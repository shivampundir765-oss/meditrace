import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Store, Package, Plus, Trash2, Edit2, CheckCircle2, Truck, RefreshCw, AlertCircle } from 'lucide-react';

export default function RetailerDashboardPage() {
  const [activeTab, setActiveTab] = useState('inventory'); // 'inventory' | 'orders' | 'profile'
  const [profile, setProfile] = useState(null);
  const [inventory, setInventory] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    saltFormula: '',
    strength: '',
    dosageForm: 'tablet',
    price: '',
    mrp: '',
    quantity: '',
    prescriptionRequired: false
  });

  const fetchProfile = async () => {
    try {
      const res = await apiClient.get('/retailer/profile');
      setProfile(res.data.data.retailer || null);
    } catch (err) {
      // Maybe not created yet
    }
  };

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/retailer/inventory');
      setInventory(res.data.data.inventory || []);
    } catch (err) {
      setError('Failed to fetch inventory');
    } finally {
      setLoading(false);
    }
  };

  const fetchRetailerOrders = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/orders/retailer');
      setOrders(res.data.data.orders || []);
    } catch (err) {
      setError('Failed to fetch store orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    if (activeTab === 'inventory') fetchInventory();
    if (activeTab === 'orders') fetchRetailerOrders();
  }, [activeTab]);

  const handleAddItem = async (e) => {
    e.preventDefault();
    setError('');
    try {
      await apiClient.post('/retailer/inventory', {
        ...newItem,
        price: Number(newItem.price),
        mrp: newItem.mrp ? Number(newItem.mrp) : Number(newItem.price),
        quantity: Number(newItem.quantity)
      });
      setShowAddModal(false);
      setNewItem({
        name: '',
        saltFormula: '',
        strength: '',
        dosageForm: 'tablet',
        price: '',
        mrp: '',
        quantity: '',
        prescriptionRequired: false
      });
      fetchInventory();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add item to inventory');
    }
  };

  const handleDeleteItem = async (id) => {
    if (!window.confirm('Are you sure you want to remove this item from your inventory?')) return;
    try {
      await apiClient.delete(`/retailer/inventory/${id}`);
      fetchInventory();
    } catch (err) {
      alert('Failed to remove item');
    }
  };

  const handleUpdateOrderStatus = async (orderId, status) => {
    try {
      await apiClient.put(`/orders/${orderId}/status`, { status });
      fetchRetailerOrders();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update order status');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Store className="text-primary-600" /> Pharmacy Retailer Portal
          </h1>
          <p className="text-gray-600">
            {profile ? profile.storeName : 'Manage your pharmacy inventory, orders, and compliance.'}
          </p>
        </div>

        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'inventory' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Inventory
          </button>
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'orders' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Orders
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Tab 1: Inventory */}
      {activeTab === 'inventory' && (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-bold text-gray-900">Live Stock Catalogue ({inventory.length} items)</h2>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
            >
              <Plus size={16} /> Add Medicine
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading store stock...</div>
          ) : inventory.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              No inventory listed. Click "Add Medicine" to list products for nearby patients.
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
              <table className="w-full text-left text-sm text-gray-600">
                <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 border-b border-gray-100">
                  <tr>
                    <th className="px-6 py-4">Medicine</th>
                    <th className="px-6 py-4">Salt Formula</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Rx Type</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {inventory.map((item) => (
                    <tr key={item._id} className="hover:bg-gray-50/50 transition">
                      <td className="px-6 py-4 font-bold text-gray-900">
                        {item.name}
                        <span className="text-xs text-gray-400 font-normal block">{item.strength} • {item.dosageForm}</span>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-600">{item.saltFormula || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          item.quantity > 10 ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {item.quantity} in stock
                        </span>
                      </td>
                      <td className="px-6 py-4 font-semibold text-gray-900">₹{item.price}</td>
                      <td className="px-6 py-4">
                        {item.prescriptionRequired ? (
                          <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full">
                            Rx Required
                          </span>
                        ) : (
                          <span className="text-[11px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded-full">
                            OTC
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => handleDeleteItem(item._id)}
                          className="text-gray-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeTab === 'orders' && (
        <div className="space-y-6">
          <h2 className="text-lg font-bold text-gray-900">Store Orders & Dispatch Status</h2>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              No orders received yet.
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((ord) => (
                <div key={ord._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-gray-100">
                    <div>
                      <span className="font-bold text-gray-900 text-sm">Order #{ord._id.slice(-8).toUpperCase()}</span>
                      <p className="text-xs text-gray-400">
                        Patient: {ord.user?.name || 'Customer'} • {ord.deliveryAddress?.street}, {ord.deliveryAddress?.city}
                      </p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="text-sm font-black text-gray-900">₹{ord.totalAmount?.toFixed(2)}</span>
                      <select
                        value={ord.status}
                        onChange={(e) => handleUpdateOrderStatus(ord._id, e.target.value)}
                        className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-bold text-primary-700 bg-gray-50 focus:outline-none"
                      >
                        <option value="placed">Placed</option>
                        <option value="confirmed">Confirmed</option>
                        <option value="packed">Packed</option>
                        <option value="out_for_delivery">Out for Delivery</option>
                        <option value="delivered">Delivered (Auto-Stock)</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="text-xs text-gray-600 space-y-1">
                    {ord.items?.map((it, idx) => (
                      <div key={idx} className="flex justify-between">
                        <span>{it.name} x {it.quantity}</span>
                        <span className="font-semibold text-gray-800">₹{(it.price * it.quantity).toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-lg font-bold text-gray-900">Add Medicine to Pharmacy Stock</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            <form onSubmit={handleAddItem} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Medicine Brand Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Dolo 650"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Salt / Molecule</label>
                  <input
                    type="text"
                    placeholder="e.g. Paracetamol"
                    value={newItem.saltFormula}
                    onChange={(e) => setNewItem({ ...newItem, saltFormula: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Strength</label>
                  <input
                    type="text"
                    placeholder="e.g. 650mg"
                    value={newItem.strength}
                    onChange={(e) => setNewItem({ ...newItem, strength: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Price (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 30"
                    value={newItem.price}
                    onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Available Units</label>
                  <input
                    type="number"
                    placeholder="e.g. 100"
                    value={newItem.quantity}
                    onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="prescriptionRequired"
                  checked={newItem.prescriptionRequired}
                  onChange={(e) => setNewItem({ ...newItem, prescriptionRequired: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <label htmlFor="prescriptionRequired" className="text-xs text-gray-700 font-medium">
                  Prescription Mandatory (Schedule H/X)
                </label>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
