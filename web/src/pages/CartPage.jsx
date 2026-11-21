import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../api/client';
import useCartStore from '../store/useCartStore';
import { ShoppingBag, Trash2, Plus, Minus, ShieldAlert, CreditCard, Banknote, ArrowLeft, CheckCircle } from 'lucide-react';

export default function CartPage() {
  const navigate = useNavigate();
  const { items, updateQuantity, removeItem, clearCart, getTotalPrice, hasPrescriptionRequiredItems } = useCartStore();

  const [prescriptions, setPrescriptions] = useState([]);
  const [selectedPrescriptionId, setSelectedPrescriptionId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('cod'); // 'cod' | 'card'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Delivery Address form
  const [address, setAddress] = useState({
    street: '',
    city: '',
    state: '',
    pincode: ''
  });

  const rxMandatory = hasPrescriptionRequiredItems();

  useEffect(() => {
    if (rxMandatory) {
      apiClient.get('/prescriptions')
        .then(res => {
          const list = res.data.data.prescriptions || [];
          setPrescriptions(list);
          if (list.length > 0) setSelectedPrescriptionId(list[0]._id);
        })
        .catch(() => setPrescriptions([]));
    }
  }, [rxMandatory]);

  const handleCheckout = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    if (rxMandatory && !selectedPrescriptionId) {
      setError('A valid prescription is required to order prescription-controlled drugs.');
      return;
    }

    if (!address.street || !address.city || !address.pincode) {
      setError('Please provide a complete delivery address.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Group items by retailer (or use first retailer if single)
      const primaryRetailerId = items[0]?.retailerId;

      const orderPayload = {
        retailerId: primaryRetailerId,
        items: items.map(it => ({
          medicineId: it.medicineId,
          name: it.name,
          quantity: it.quantity,
          price: it.price
        })),
        deliveryAddress: address,
        paymentMethod: paymentMethod === 'card' ? 'razorpay' : 'cod',
        prescriptionId: rxMandatory ? selectedPrescriptionId : undefined
      };

      const res = await apiClient.post('/orders', orderPayload);
      const createdOrder = res.data.data.order;

      // If test payment gateway chosen, simulate payment session & webhook confirmation
      if (paymentMethod === 'card') {
        const sessionRes = await apiClient.post('/payments/session', {
          orderId: createdOrder._id,
          gateway: 'razorpay'
        });
        const paymentSession = sessionRes.data.data;

        // Auto-confirm test mode payment
        await apiClient.post('/payments/webhook', {
          orderId: createdOrder._id,
          paymentId: `pay_test_${Date.now()}`,
          status: 'success'
        });
      }

      clearCart();
      navigate('/orders');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to place order. Please review your cart.');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-gray-100 shadow-sm max-w-lg mx-auto space-y-4">
        <div className="w-16 h-16 bg-primary-50 text-primary-600 rounded-full flex items-center justify-center mx-auto">
          <ShoppingBag size={28} />
        </div>
        <h2 className="text-xl font-bold text-gray-900">Your Cart is Empty</h2>
        <p className="text-sm text-gray-500">Search authentic medicines from licensed stockists and add them here.</p>
        <Link
          to="/shop"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition"
        >
          <ArrowLeft size={16} /> Browse Pharmacy
        </Link>
      </div>
    );
  }

  const subtotal = getTotalPrice();
  const deliveryFee = subtotal > 500 ? 0 : 40;
  const grandTotal = subtotal + deliveryFee;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShoppingBag className="text-primary-600" /> Checkout & Order Medicines
        </h1>
        <p className="text-gray-600">Review items, verify delivery details, and confirm your order.</p>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items List & Prescription Verification */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm divide-y divide-gray-100">
            {items.map((item) => (
              <div key={item.medicineId} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-gray-900 text-sm">{item.name}</h3>
                    {item.prescriptionRequired && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        Rx Required
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{item.strength || ''} • From {item.retailerName}</p>
                  <p className="text-sm font-semibold text-primary-600 mt-1">₹{item.price} each</p>
                </div>

                {/* Stepper */}
                <div className="flex items-center gap-3">
                  <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.medicineId, item.quantity - 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-200 transition"
                    >
                      <Minus size={14} />
                    </button>
                    <span className="px-3 text-xs font-bold text-gray-800">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.medicineId, item.quantity + 1)}
                      className="px-2 py-1 text-gray-600 hover:bg-gray-200 transition"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <span className="font-bold text-gray-900 text-sm w-16 text-right">
                    ₹{(item.price * item.quantity).toFixed(2)}
                  </span>

                  <button
                    type="button"
                    onClick={() => removeItem(item.medicineId)}
                    className="text-gray-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Rx Verification Section */}
          {rxMandatory && (
            <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-5 space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="text-amber-600 mt-0.5 flex-shrink-0" size={20} />
                <div>
                  <h3 className="text-sm font-bold text-amber-900">Doctor Prescription Required</h3>
                  <p className="text-xs text-amber-700">
                    Your cart contains Schedule H/X regulated medicines. Under drug safety compliance, partner pharmacies require an active doctor prescription before dispensing.
                  </p>
                </div>
              </div>

              {prescriptions.length === 0 ? (
                <div className="bg-white p-4 rounded-xl border border-amber-200 text-xs text-amber-800">
                  You don't have any saved prescriptions yet. Please <Link to="/prescriptions" className="font-bold underline text-amber-900">upload a prescription</Link> before checking out.
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-amber-900 mb-1">Select Attached Prescription</label>
                  <select
                    value={selectedPrescriptionId}
                    onChange={(e) => setSelectedPrescriptionId(e.target.value)}
                    className="w-full px-3 py-2 bg-white rounded-xl border border-amber-300 text-xs text-gray-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    {prescriptions.map((p) => (
                      <option key={p._id} value={p._id}>
                        {p.doctorName || 'Doctor Prescription'} - Issued {new Date(p.issuedDate || p.createdAt).toLocaleDateString()}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Delivery Address Form */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Delivery Address</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-gray-600 mb-1">Street Address</label>
                <input
                  type="text"
                  placeholder="Apartment, building, street..."
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">City</label>
                <input
                  type="text"
                  placeholder="e.g. Bangalore"
                  value={address.city}
                  onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1">Pincode</label>
                <input
                  type="text"
                  placeholder="e.g. 560001"
                  value={address.pincode}
                  onChange={(e) => setAddress({ ...address, pincode: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/* Order Summary & Payment */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-gray-900 text-base">Order Summary</h3>

            <div className="space-y-2 text-sm text-gray-600 border-b border-gray-100 pb-4">
              <div className="flex justify-between">
                <span>Subtotal ({items.length} items)</span>
                <span className="font-semibold text-gray-900">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery Fee</span>
                <span>{deliveryFee === 0 ? <span className="text-emerald-600 font-bold">FREE</span> : `₹${deliveryFee}`}</span>
              </div>
              {deliveryFee > 0 && (
                <p className="text-[11px] text-gray-400">Add ₹{(500 - subtotal).toFixed(2)} more for free delivery.</p>
              )}
            </div>

            <div className="flex justify-between items-baseline pt-1">
              <span className="font-bold text-gray-900 text-base">Total Amount</span>
              <span className="text-2xl font-black text-primary-700">₹{grandTotal.toFixed(2)}</span>
            </div>

            {/* Payment Method Selector */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Payment Method</label>
              
              <div
                onClick={() => setPaymentMethod('cod')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                  paymentMethod === 'cod' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Banknote className="text-primary-600" size={18} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Cash on Delivery (COD)</p>
                    <p className="text-[11px] text-gray-500">Pay when medicine arrives</p>
                  </div>
                </div>
                {paymentMethod === 'cod' && <CheckCircle size={16} className="text-primary-600" />}
              </div>

              <div
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                  paymentMethod === 'card' ? 'border-primary-600 bg-primary-50/50' : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="text-primary-600" size={18} />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Card / UPI / NetBanking</p>
                    <p className="text-[11px] text-gray-500">Instant test gateway mode</p>
                  </div>
                </div>
                {paymentMethod === 'card' && <CheckCircle size={16} className="text-primary-600" />}
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading || (rxMandatory && !selectedPrescriptionId)}
              className="w-full py-3.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition shadow-sm mt-4"
            >
              {loading ? 'Processing Order...' : `Place Order (₹${grandTotal.toFixed(2)})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
