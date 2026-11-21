const { Cart } = require('../models/cart.model');
const { RetailerInventory } = require('../models/retailerInventory.model');

const getCart = async (patientId) => {
  let cart = await Cart.findOne({ patient_id: patientId }).populate({
    path: 'items.inventory_id',
    populate: { path: 'retailer_id', select: 'shop_name address delivery_available' }
  });

  if (!cart) {
    cart = await Cart.create({ patient_id: patientId, items: [] });
  }

  let subtotal = 0;
  let hasPrescriptionRequiredItems = false;
  const items = [];

  for (const item of cart.items) {
    const inv = item.inventory_id;
    if (!inv) continue;

    const unitPrice = Math.round(inv.price * (1 - (inv.discount_percentage || 0) / 100));
    const totalPrice = unitPrice * item.quantity;
    subtotal += totalPrice;

    if (inv.requires_prescription) {
      hasPrescriptionRequiredItems = true;
    }

    items.push({
      _id: item._id,
      inventory_id: inv._id,
      medicine_name: inv.medicine_name,
      generic_name: inv.generic_name,
      dosage_form: inv.dosage_form,
      strength: inv.strength,
      unit_price: unitPrice,
      quantity: item.quantity,
      total_price: totalPrice,
      available_stock: inv.quantity,
      is_in_stock: inv.quantity >= item.quantity,
      requires_prescription: inv.requires_prescription,
      retailer: inv.retailer_id
    });
  }

  const deliveryFee = subtotal > 500 || subtotal === 0 ? 0 : 40; // Free delivery over ₹500
  const grandTotal = subtotal + deliveryFee;

  return {
    cartId: cart._id,
    itemCount: items.length,
    items,
    subtotal,
    deliveryFee,
    grandTotal,
    hasPrescriptionRequiredItems
  };
};

const addToCart = async (patientId, { inventory_id, quantity = 1 }) => {
  const inventory = await RetailerInventory.findById(inventory_id);
  if (!inventory || !inventory.is_available) {
    const error = new Error('Medicine is not available in stock');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  let cart = await Cart.findOne({ patient_id: patientId });
  if (!cart) {
    cart = await Cart.create({ patient_id: patientId, items: [] });
  }

  const existingIndex = cart.items.findIndex(
    (i) => i.inventory_id.toString() === inventory_id.toString()
  );

  if (existingIndex > -1) {
    cart.items[existingIndex].quantity += quantity;
  } else {
    cart.items.push({ inventory_id, quantity });
  }

  await cart.save();
  return getCart(patientId);
};

const updateCartItem = async (patientId, itemId, quantity) => {
  const cart = await Cart.findOne({ patient_id: patientId });
  if (!cart) {
    const error = new Error('Cart not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const item = cart.items.id(itemId);
  if (!item) {
    const error = new Error('Item not found in cart');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  item.quantity = quantity;
  await cart.save();
  return getCart(patientId);
};

const removeFromCart = async (patientId, itemId) => {
  const cart = await Cart.findOne({ patient_id: patientId });
  if (cart) {
    cart.items.pull(itemId);
    await cart.save();
  }
  return getCart(patientId);
};

const clearCart = async (patientId) => {
  await Cart.findOneAndUpdate({ patient_id: patientId }, { $set: { items: [] } });
  return { message: 'Cart cleared successfully' };
};

module.exports = {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart
};
