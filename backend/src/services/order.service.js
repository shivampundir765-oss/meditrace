const { Order } = require('../models/order.model');
const { Retailer } = require('../models/retailer.model');
const { RetailerInventory } = require('../models/retailerInventory.model');
const { Prescription } = require('../models/prescription.model');
const { Medicine } = require('../models/medicine.model');
const { Cart } = require('../models/cart.model');
const { createNotification } = require('./notification.service');

const createOrder = async (patientId, data) => {
  const { retailer_id, items, payment_method = 'online', delivery_address, prescription_id } = data;

  const retailer = await Retailer.findById(retailer_id);
  if (!retailer) {
    const error = new Error('Retailer store not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  let totalAmount = 0;
  let requiresPrescriptionOverall = false;
  const verifiedOrderItems = [];

  for (const item of items) {
    const inv = await RetailerInventory.findOne({
      _id: item.inventory_id,
      retailer_id
    });

    if (!inv || !inv.is_available) {
      const error = new Error(`Item ${item.inventory_id} is currently unavailable`);
      error.statusCode = 400;
      error.errorCode = 'ITEM_UNAVAILABLE';
      throw error;
    }

    if (inv.quantity < item.quantity) {
      const error = new Error(`Insufficient stock for ${inv.medicine_name}. Only ${inv.quantity} available.`);
      error.statusCode = 400;
      error.errorCode = 'INSUFFICIENT_STOCK';
      throw error;
    }

    if (inv.requires_prescription) {
      requiresPrescriptionOverall = true;
    }

    const unitPrice = Math.round(inv.price * (1 - (inv.discount_percentage || 0) / 100));
    const itemTotal = unitPrice * item.quantity;
    totalAmount += itemTotal;

    verifiedOrderItems.push({
      inventory_id: inv._id,
      medicine_name: inv.medicine_name,
      quantity: item.quantity,
      unit_price: unitPrice,
      total_price: itemTotal,
      requires_prescription: inv.requires_prescription
    });

    // Deduct stock from retailer inventory
    inv.quantity -= item.quantity;
    if (inv.quantity === 0) inv.is_available = false;
    await inv.save();
  }

  // Prescription verification
  if (requiresPrescriptionOverall) {
    if (!prescription_id) {
      const error = new Error('This order contains prescription-only medicines. A valid prescription is required.');
      error.statusCode = 400;
      error.errorCode = 'PRESCRIPTION_REQUIRED';
      throw error;
    }

    const rx = await Prescription.findOne({ _id: prescription_id, patient_id: patientId });
    if (!rx) {
      const error = new Error('Prescription not found or does not belong to this patient');
      error.statusCode = 400;
      error.errorCode = 'INVALID_PRESCRIPTION';
      throw error;
    }
  }

  const deliveryFee = totalAmount > 500 ? 0 : 40;
  const grandTotal = totalAmount + deliveryFee;

  const order = await Order.create({
    patient_id: patientId,
    retailer_id,
    order_items: verifiedOrderItems,
    total_amount: grandTotal,
    payment_status: payment_method === 'cod' ? 'cod' : 'pending',
    order_status: 'placed',
    payment_method,
    delivery_address,
    prescription_id: prescription_id || null,
    delivery_tracking: [
      {
        status: 'placed',
        timestamp: new Date(),
        note: 'Order placed by patient and awaiting retailer confirmation'
      }
    ]
  });

  // Remove ordered items from cart
  await Cart.findOneAndUpdate(
    { patient_id: patientId },
    {
      $pull: {
        items: {
          inventory_id: { $in: items.map((i) => i.inventory_id) }
        }
      }
    }
  );

  // Notify Patient
  await createNotification(patientId, {
    type: 'order',
    title: 'Order Placed Successfully',
    message: `Your medicine order #${order._id.toString().slice(-6)} of ₹${grandTotal} has been sent to ${retailer.shop_name}.`,
    channel: 'push',
    action_type: 'view_order',
    action_url: `/orders/${order._id}`,
    reference_id: order._id
  });

  return order;
};

const listOrders = async (user, { status, page = 1, limit = 20 }) => {
  const query = {};

  if (user.role === 'retailer') {
    const retailer = await Retailer.findOne({ user_id: user._id });
    if (!retailer) {
      return { orders: [], pagination: { page: 1, limit: 20, total: 0, pages: 0 } };
    }
    query.retailer_id = retailer._id;
  } else if (user.role !== 'admin') {
    query.patient_id = user._id;
  }

  if (status) {
    query.order_status = status;
  }

  const skip = (page - 1) * limit;
  const [orders, total] = await Promise.all([
    Order.find(query)
      .populate('retailer_id', 'shop_name phone address')
      .populate('patient_id', 'name email phone')
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limit),
    Order.countDocuments(query)
  ]);

  return {
    orders,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total,
      pages: Math.ceil(total / limit)
    }
  };
};

const getOrderById = async (user, orderId) => {
  const order = await Order.findById(orderId)
    .populate('retailer_id', 'shop_name phone address location')
    .populate('patient_id', 'name email phone');

  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  return order;
};

/**
 * Retailer updates order status (placed -> confirmed -> packed -> out_for_delivery -> delivered / cancelled)
 * Automatically syncs patient stock when delivered!
 */
const updateOrderStatus = async (user, orderId, { status, note }) => {
  const order = await Order.findById(orderId).populate('retailer_id');
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  order.order_status = status;
  order.delivery_tracking.push({
    status,
    timestamp: new Date(),
    note: note || `Order status updated to ${status}`
  });

  if (status === 'delivered') {
    order.payment_status = 'paid';

    // AUTOMATIC STOCK REFILL IN MEDITRACE
    for (const item of order.order_items) {
      // Find existing medicine by name or create a new medicine for patient
      let patientMed = await Medicine.findOne({
        patient_id: order.patient_id,
        name: { $regex: `^${item.medicine_name}$`, $options: 'i' }
      });

      if (patientMed) {
        patientMed.quantity = (patientMed.quantity || 0) + item.quantity;
        await patientMed.save();
      } else {
        await Medicine.create({
          patient_id: order.patient_id,
          name: item.medicine_name,
          quantity: item.quantity,
          added_via: 'manual',
          status: 'active'
        });
      }
    }

    // Send stock auto-updated notification
    await createNotification(order.patient_id, {
      type: 'order',
      title: 'Order Delivered & Stock Updated!',
      message: `Your medicine order has been delivered. Your Meditrace medicine stock has been automatically updated.`,
      channel: 'push',
      action_type: 'view_order',
      action_url: `/orders/${order._id}`,
      reference_id: order._id
    });
  } else {
    // General order status change notification
    await createNotification(order.patient_id, {
      type: 'order',
      title: `Order Update: ${status.toUpperCase()}`,
      message: `Your order from ${order.retailer_id ? order.retailer_id.shop_name : 'chemist'} is now: ${status}.`,
      channel: 'push',
      action_type: 'view_order',
      action_url: `/orders/${order._id}`,
      reference_id: order._id
    });
  }

  await order.save();
  return order;
};

module.exports = {
  createOrder,
  listOrders,
  getOrderById,
  updateOrderStatus
};
