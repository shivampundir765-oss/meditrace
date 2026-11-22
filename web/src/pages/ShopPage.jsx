import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import useCartStore from '../store/useCartStore';
import { ShoppingBag, Search, Tag, AlertCircle, CheckCircle2, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ShopPage() {
  const [query, setQuery] = useState('');
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [genericsModalItem, setGenericsModalItem] = useState(null);
  const [generics, setGenerics] = useState([]);
  const [genericsLoading, setGenericsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { addItem, getItemCount } = useCartStore();

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/shop/search', {
        params: { query: query.trim() || undefined }
      });
      setMedicines(res.data?.results || res.data?.data?.results || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to search medicines');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    handleSearch();
  }, []);

  const openGenericsModal = async (med) => {
    setGenericsModalItem(med);
    setGenericsLoading(true);
    try {
      const res = await apiClient.get(`/shop/generics/${med.medicineId || med._id}`);
      setGenerics(res.data?.alternatives || res.data?.data?.alternatives || []);
    } catch (err) {
      setGenerics([]);
    } finally {
      setGenericsLoading(false);
    }
  };

  const handleAddToCart = (item) => {
    addItem({
      medicineId: item.medicineId || item._id,
      name: item.name,
      strength: item.strength,
      dosageForm: item.dosageForm,
      retailerId: item.retailer?._id || item.retailerId,
      retailerName: item.retailer?.storeName || 'Partner Pharmacy',
      price: item.price,
      discount: item.discount || 0,
      prescriptionRequired: item.prescriptionRequired || false,
      quantity: 1,
      availableStock: item.quantity
    });

    setToastMessage(`Added "${item.name}" to cart`);
    setTimeout(() => setToastMessage(''), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-slide-up">
          <CheckCircle2 className="text-emerald-400" size={20} />
          <span className="text-sm font-medium">{toastMessage}</span>
          <Link to="/cart" className="text-xs text-primary-300 hover:text-white font-bold ml-2 underline">
            View Cart
          </Link>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShoppingBag className="text-primary-600" /> Meditrace Pharmacy
          </h1>
          <p className="text-gray-600">Order authentic medicines directly from licensed partner pharmacies.</p>
        </div>

        <Link
          to="/cart"
          className="relative flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition shadow-sm"
        >
          <ShoppingBag size={18} />
          <span>Cart</span>
          {getItemCount() > 0 && (
            <span className="bg-white text-primary-700 text-xs font-black px-2 py-0.5 rounded-full">
              {getItemCount()}
            </span>
          )}
        </Link>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search by brand name or salt formula (e.g. Dolo 650, Telmisartan, Amoxicillin)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm transition"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Product Grid */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">Loading medicines catalogue...</div>
      ) : medicines.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
          No medicines found matching "{query}". Try checking the salt formula or another keyword.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {medicines.map((item, idx) => (
            <div key={idx} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-2">
                  <span className="text-xs uppercase tracking-wider font-bold text-gray-400">
                    {item.dosageForm || 'Medicine'}
                  </span>
                  {item.prescriptionRequired && (
                    <span className="text-[11px] bg-amber-50 text-amber-700 border border-amber-200 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <ShieldCheck size={12} /> Rx Required
                    </span>
                  )}
                </div>

                <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{item.name}</h3>
                <p className="text-xs text-primary-600 font-medium mb-2">{item.strength || 'Standard'}</p>

                {item.saltFormula && (
                  <p className="text-xs text-gray-500 mb-3 bg-gray-50 p-2 rounded-lg line-clamp-1">
                    Salt: <span className="font-semibold text-gray-700">{item.saltFormula}</span>
                  </p>
                )}

                <p className="text-xs text-gray-400 mb-3">
                  Store: <span className="text-gray-600 font-medium">{item.retailer?.storeName || 'Verified Stockist'}</span>
                </p>
              </div>

              <div className="pt-3 border-t border-gray-100">
                <div className="flex items-baseline justify-between mb-3">
                  <div>
                    <span className="text-xl font-bold text-gray-900">₹{item.price}</span>
                    {item.mrp && item.mrp > item.price && (
                      <span className="text-xs text-gray-400 line-through ml-2">₹{item.mrp}</span>
                    )}
                  </div>
                  <span className="text-xs text-emerald-600 font-medium">{item.quantity} units left</span>
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    disabled={item.quantity === 0}
                    className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
                  >
                    {item.quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                  </button>

                  <button
                    onClick={() => openGenericsModal(item)}
                    className="w-full py-2 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <Tag size={13} className="text-primary-600" /> Compare Generic Substitutes
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generics Modal */}
      {genericsModalItem && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900">Affordable Generic Substitutes</h2>
                <p className="text-xs text-gray-500">Same therapeutic molecule & strength as <span className="font-semibold text-gray-700">{genericsModalItem.name}</span></p>
              </div>
              <button onClick={() => setGenericsModalItem(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            {genericsLoading ? (
              <div className="text-xs text-gray-400 py-8 text-center">Finding matching generic brands...</div>
            ) : generics.length === 0 ? (
              <div className="bg-gray-50 p-6 rounded-2xl text-center text-xs text-gray-500">
                No lower-cost generic alternatives currently catalogued for this molecule.
              </div>
            ) : (
              <div className="space-y-3">
                {generics.map((gen, idx) => (
                  <div key={idx} className="p-4 rounded-2xl border border-gray-100 bg-gray-50/50 hover:bg-gray-50 transition flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900 text-sm">{gen.name}</h4>
                      <p className="text-xs text-gray-500">{gen.manufacturer || 'Approved Generic Lab'}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-base font-bold text-emerald-700">₹{gen.price}</span>
                        {gen.savingsPercentage > 0 && (
                          <span className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                            Save {gen.savingsPercentage}%
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        handleAddToCart(gen);
                        setGenericsModalItem(null);
                      }}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-semibold transition"
                    >
                      Switch & Add
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
