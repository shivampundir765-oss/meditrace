import React, { useEffect, useState } from 'react';
import {
  Clock,
  AlertTriangle,
  RefreshCw,
  Plus,
  ShoppingBag,
  MapPin,
  Calendar,
  CheckCircle,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../api/client';

export default function StockPage() {
  const [stockData, setStockData] = useState(null);
  const [filter, setFilter] = useState('all'); // all, low, expiring, expired
  const [loading, setLoading] = useState(true);
  const [refillModalMed, setRefillModalMed] = useState(null);
  const [refillQuantity, setRefillQuantity] = useState(30);
  const [refillAction, setRefillAction] = useState('add');

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await api.get('/stock');
      setStockData(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStock();
  }, []);

  const handleRefillSubmit = async (e) => {
    e.preventDefault();
    if (!refillModalMed) return;

    try {
      await api.put(`/stock/${refillModalMed._id}`, {
        quantity: Number(refillQuantity),
        action: refillAction
      });
      setRefillModalMed(null);
      fetchStock();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredItems = stockData?.stockItems?.filter((item) => {
    if (filter === 'low') return item.isLowStock;
    if (filter === 'expiring') return item.daysUntilExpiry !== null && item.daysUntilExpiry <= 30 && item.daysUntilExpiry >= 0;
    if (filter === 'expired') return item.isExpired;
    return true;
  }) || [];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Stock & Expiry Intelligence</h1>
          <p className="text-xs text-slate-500">
            Smart consumption engine predicting medicine finish dates and preventing stockouts.
          </p>
        </div>

        <button
          onClick={fetchStock}
          className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl flex items-center space-x-1.5 self-start sm:self-center"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Analytics</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setFilter('all')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'all' ? 'border-brand-600 bg-brand-50/40 shadow-sm' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-slate-400 uppercase">Tracked Items</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stockData?.totalMedicines || 0}</p>
        </div>

        <div
          onClick={() => setFilter('low')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'low' ? 'border-amber-600 bg-amber-50/40 shadow-sm' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-amber-600 uppercase">Low Stock (≤ 3d)</p>
          <p className="text-2xl font-black text-amber-600 mt-1">{stockData?.lowStockCount || 0}</p>
        </div>

        <div
          onClick={() => setFilter('expiring')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'expiring' ? 'border-purple-600 bg-purple-50/40 shadow-sm' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-purple-600 uppercase">Expiring in 30d</p>
          <p className="text-2xl font-black text-purple-600 mt-1">{stockData?.expiringSoonCount || 0}</p>
        </div>

        <div
          onClick={() => setFilter('expired')}
          className={`p-4 rounded-2xl border cursor-pointer transition-all ${
            filter === 'expired' ? 'border-rose-600 bg-rose-50/40 shadow-sm' : 'bg-white border-slate-200'
          }`}
        >
          <p className="text-[11px] font-semibold text-rose-600 uppercase">Expired</p>
          <p className="text-2xl font-black text-rose-600 mt-1">{stockData?.expiredCount || 0}</p>
        </div>
      </div>

      {/* Stock Items Table / Cards */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Computing stock predictions...</div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-2">
          <p className="font-bold text-sm text-slate-800">No medicines in this category</p>
          <p className="text-xs text-slate-400">Everything looks in order!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className={`bg-white rounded-2xl p-5 border shadow-sm flex flex-col justify-between ${
                item.isLowStock
                  ? 'border-amber-200 bg-amber-50/10'
                  : item.isExpired
                  ? 'border-rose-200 bg-rose-50/10'
                  : 'border-slate-200'
              }`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{item.name}</h3>
                    {item.strength && <p className="text-xs text-slate-500">{item.strength} • <span className="capitalize">{item.dosage_form}</span></p>}
                  </div>
                  {item.isLowStock && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md">
                      Low Stock
                    </span>
                  )}
                  {item.isExpired && (
                    <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-bold rounded-md">
                      Expired
                    </span>
                  )}
                </div>

                {/* Stock metrics list */}
                <div className="mt-4 space-y-2 text-xs bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Current In-Hand:</span>
                    <span className="font-bold text-slate-800">{item.quantity} units</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Daily Consumption:</span>
                    <span className="font-semibold text-slate-700">{item.dailyConsumption} / day</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Estimated Days Left:</span>
                    <span className={`font-bold ${item.daysRemaining <= 3 ? 'text-amber-600' : 'text-slate-800'}`}>
                      {item.daysRemaining !== null ? `${item.daysRemaining} days` : 'No active schedule'}
                    </span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-slate-200">
                    <span className="text-slate-500">Predicted Finish Date:</span>
                    <span className="font-bold text-brand-700">
                      {item.predictedFinishDate
                        ? new Date(item.predictedFinishDate).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setRefillModalMed(item);
                    setRefillQuantity(30);
                    setRefillAction('add');
                  }}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Update / Refill</span>
                </button>

                <div className="flex items-center space-x-1">
                  <Link
                    to={`/shop?query=${encodeURIComponent(item.name)}`}
                    className="p-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-lg text-xs font-bold"
                    title="Buy online"
                  >
                    <ShoppingBag className="w-4 h-4" />
                  </Link>
                  <Link
                    to={`/chemists?search=${encodeURIComponent(item.name)}`}
                    className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold"
                    title="Find nearby chemist"
                  >
                    <MapPin className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Refill Modal */}
      {refillModalMed && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Refill {refillModalMed.name}
              </h3>
              <button onClick={() => setRefillModalMed(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRefillSubmit} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Refill Action</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRefillAction('add')}
                    className={`py-2 rounded-xl border text-center font-semibold ${
                      refillAction === 'add'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Add to Existing
                  </button>
                  <button
                    type="button"
                    onClick={() => setRefillAction('set')}
                    className={`py-2 rounded-xl border text-center font-semibold ${
                      refillAction === 'set'
                        ? 'border-brand-600 bg-brand-50 text-brand-700'
                        : 'border-slate-200 text-slate-600'
                    }`}
                  >
                    Set Exact Quantity
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">
                  {refillAction === 'add' ? 'Units to Add (e.g. +30)' : 'Exact Current Units'}
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={refillQuantity}
                  onChange={(e) => setRefillQuantity(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-brand-500 font-bold text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setRefillModalMed(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Update Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
