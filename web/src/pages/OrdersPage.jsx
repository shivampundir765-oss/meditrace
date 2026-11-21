import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Package, Clock, CheckCircle2, Truck, Box, Check, AlertCircle, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';

const TIMELINE_STEPS = [
  { key: 'placed', label: 'Order Placed', icon: Clock },
  { key: 'confirmed', label: 'Confirmed', icon: Check },
  { key: 'packed', label: 'Packed', icon: Box },
  { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 }
];

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/orders');
      setOrders(res.data.data.orders || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch your orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStepStatus = (orderStatus, stepKey) => {
    const orderIndex = TIMELINE_STEPS.findIndex(s => s.key === orderStatus);
    const stepIndex = TIMELINE_STEPS.findIndex(s => s.key === stepKey);

    if (orderStatus === 'cancelled') return 'cancelled';
    if (stepIndex < orderIndex) return 'completed';
    if (stepIndex === orderIndex) return 'current';
    return 'upcoming';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Package className="text-primary-600" /> My Orders & Delivery Tracking
          </h1>
          <p className="text-gray-600">Track real-time dispatch and stock auto-sync across your deliveries.</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading your orders...</div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 rounded-3xl border border-gray-100 shadow-sm text-center max-w-lg mx-auto space-y-4">
          <div className="w-16 h-16 bg-gray-50 text-gray-400 rounded-full flex items-center justify-center mx-auto">
            <Package size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">No Orders Placed Yet</h2>
          <p className="text-sm text-gray-500">You haven't ordered any medicines yet. Search our partner pharmacies to get started.</p>
          <Link
            to="/shop"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Go to Pharmacy
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div key={order._id} className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-6">
              {/* Order Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-900 text-sm">Order #{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase ${
                      order.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' :
                      order.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-primary-100 text-primary-800'
                    }`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    Placed on {new Date(order.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                <div className="text-right">
                  <div className="text-lg font-black text-gray-900">₹{order.totalAmount?.toFixed(2)}</div>
                  <p className="text-xs text-gray-500 capitalize">
                    {order.paymentMethod} • <span className={order.paymentStatus === 'paid' ? 'text-emerald-600 font-bold' : 'text-amber-600 font-bold'}>
                      {order.paymentStatus}
                    </span>
                  </p>
                </div>
              </div>

              {/* Status Timeline */}
              {order.status !== 'cancelled' ? (
                <div className="py-2">
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {TIMELINE_STEPS.map((step) => {
                      const state = getStepStatus(order.status, step.key);
                      const Icon = step.icon;

                      return (
                        <div key={step.key} className="flex flex-col items-center text-center">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center transition mb-2 ${
                            state === 'completed' ? 'bg-emerald-600 text-white shadow-sm' :
                            state === 'current' ? 'bg-primary-600 text-white ring-4 ring-primary-100' :
                            'bg-gray-100 text-gray-400'
                          }`}>
                            <Icon size={18} />
                          </div>
                          <span className={`text-xs font-semibold ${
                            state === 'completed' ? 'text-emerald-700' :
                            state === 'current' ? 'text-primary-700' :
                            'text-gray-400'
                          }`}>
                            {step.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="bg-rose-50 text-rose-800 p-3 rounded-xl text-xs font-medium">
                  This order was cancelled.
                </div>
              )}

              {/* Auto-Restock Confirmation Banner on Delivery */}
              {order.status === 'delivered' && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3 text-emerald-900">
                  <Sparkles className="text-emerald-600 flex-shrink-0" size={20} />
                  <p className="text-xs font-medium">
                    <span className="font-bold">Stock Auto-Synced:</span> The delivered medicines have been automatically added or updated in your <Link to="/medicines" className="underline font-bold">Medicine Cabinet</Link> and inventory tracker.
                  </p>
                </div>
              )}

              {/* Items in Order */}
              <div className="bg-gray-50/70 rounded-xl p-4 divide-y divide-gray-100 text-xs">
                {order.items?.map((it, idx) => (
                  <div key={idx} className="py-2.5 first:pt-0 last:pb-0 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-gray-800">{it.name}</span>
                      <span className="text-gray-500 ml-2">Qty: {it.quantity}</span>
                    </div>
                    <span className="font-semibold text-gray-900">₹{(it.price * it.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Delivery Address Details */}
              {order.deliveryAddress && (
                <div className="text-xs text-gray-500 flex justify-between items-center pt-2">
                  <span>Delivering to: <span className="text-gray-800 font-medium">{order.deliveryAddress.street}, {order.deliveryAddress.city} - {order.deliveryAddress.pincode}</span></span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
