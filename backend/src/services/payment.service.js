const crypto = require('crypto');
const { Payment } = require('../models/payment.model');
const { Order } = require('../models/order.model');
const env = require('../config/env');
const { createNotification } = require('./notification.service');

const createPaymentSession = async (userId, { order_id, method = 'upi' }) => {
  const order = await Order.findById(order_id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  if (method === 'cod') {
    const payment = await Payment.create({
      order_id,
      user_id: userId,
      gateway: 'cod',
      amount: order.total_amount,
      currency: 'INR',
      status: 'cod',
      method: 'cod'
    });

    order.payment_status = 'cod';
    order.payment_method = 'cod';
    await order.save();

    return {
      mode: 'cod',
      payment,
      message: 'Cash on delivery selected. Pay when order arrives.'
    };
  }

  // Simulated Razorpay / Stripe TEST MODE order
  const mockGatewayOrderId = `order_${crypto.randomBytes(8).toString('hex')}`;

  const payment = await Payment.create({
    order_id,
    user_id: userId,
    gateway: 'razorpay',
    gateway_order_id: mockGatewayOrderId,
    amount: order.total_amount,
    currency: 'INR',
    status: 'created',
    method
  });

  return {
    mode: 'test_online',
    gateway: 'razorpay',
    key_id: env.RAZORPAY_KEY_ID || 'rzp_test_dummy_key_id',
    amount: order.total_amount * 100, // in paise
    currency: 'INR',
    order_id: order._id,
    gateway_order_id: mockGatewayOrderId,
    payment_id: payment._id,
    prefill: {
      name: 'Test Patient',
      email: 'patient@example.com'
    }
  };
};

const processWebhook = async ({ order_id, gateway_payment_id, status }) => {
  const order = await Order.findById(order_id);
  if (!order) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    error.errorCode = 'NOT_FOUND';
    throw error;
  }

  const payment = await Payment.findOne({ order_id });
  if (payment) {
    payment.gateway_payment_id = gateway_payment_id || `pay_${crypto.randomBytes(8).toString('hex')}`;
    payment.status = status === 'captured' ? 'captured' : 'failed';
    await payment.save();
  }

  if (status === 'captured') {
    order.payment_status = 'paid';
    await order.save();

    await createNotification(order.patient_id, {
      type: 'order',
      title: 'Payment Successful',
      message: `Your payment of ₹${order.total_amount} was successfully captured (Test Mode).`,
      channel: 'push',
      action_type: 'view_order',
      action_url: `/orders/${order._id}`,
      reference_id: order._id
    });
  }

  return { order, payment };
};

module.exports = {
  createPaymentSession,
  processWebhook
};
