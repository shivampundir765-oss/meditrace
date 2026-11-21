import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Search, MapPin, Phone, Clock, Navigation, CheckCircle } from 'lucide-react';

export default function ChemistFinderPage() {
  const [chemists, setChemists] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946 }); // Default Bangalore coords
  const [radiusKm, setRadiusKm] = useState(10);
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineStockists, setMedicineStockists] = useState(null);

  // Auto get location
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        () => console.log('Location permission denied or unavailable, using fallback coordinates.')
      );
    }
  }, []);

  const fetchNearbyChemists = async () => {
    setLoading(true);
    setError('');
    setMedicineStockists(null);
    try {
      const res = await apiClient.get('/chemists/nearby', {
        params: {
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm
        }
      });
      setChemists(res.data.data.chemists || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search nearby chemists');
    } finally {
      setLoading(false);
    }
  };

  const searchMedicineStock = async (e) => {
    e.preventDefault();
    if (!medicineQuery.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/chemists/search-medicine', {
        params: {
          name: medicineQuery.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          radiusKm
        }
      });
      setMedicineStockists(res.data.data.stockists || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to search medicine in nearby chemists');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyChemists();
  }, [coords.latitude, coords.longitude, radiusKm]);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MapPin className="text-primary-600" /> Nearby Chemist & Stockist Finder
          </h1>
          <p className="text-gray-600">Discover licensed pharmacies and verify live medicine stock nearby.</p>
        </div>
      </div>

      {/* Search Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Search Radius ({radiusKm} km)</label>
          <input
            type="range"
            min="2"
            max="50"
            step="2"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary-600"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>2 km</span>
            <span>25 km</span>
            <span>50 km</span>
          </div>
        </div>

        <div className="md:col-span-2">
          <form onSubmit={searchMedicineStock} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search specific medicine in stock (e.g. Paracetamol, Metformin)..."
                value={medicineQuery}
                onChange={(e) => setMedicineQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition"
            >
              Check Stock
            </button>
            {medicineStockists && (
              <button
                type="button"
                onClick={() => {
                  setMedicineStockists(null);
                  setMedicineQuery('');
                }}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm transition"
              >
                Clear
              </button>
            )}
          </form>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Stockist Search Results */}
      {medicineStockists !== null ? (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Pharmacies with "{medicineQuery}" in stock ({medicineStockists.length})
            </h2>
          </div>
          {medicineStockists.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              No chemists within {radiusKm} km currently have "{medicineQuery}" in stock.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {medicineStockists.map((item, idx) => (
                <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900">{item.retailer?.storeName || 'Pharmacy'}</h3>
                    <span className="text-xs bg-emerald-100 text-emerald-800 font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} /> {item.quantity} in stock
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-primary-600 mb-1">₹{item.price}</p>
                  <p className="text-xs text-gray-500 mb-3">{item.retailer?.address?.street}, {item.retailer?.address?.city}</p>
                  
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-600">
                    <span className="flex items-center gap-1">
                      <Navigation size={13} className="text-primary-600" />
                      {item.distanceKm ? `${item.distanceKm.toFixed(1)} km away` : 'Nearby'}
                    </span>
                    <a
                      href={`tel:${item.retailer?.phone || ''}`}
                      className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
                    >
                      <Phone size={13} /> {item.retailer?.phone || 'Call Store'}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* General Nearby Chemists */
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              Verified Partner Pharmacies within {radiusKm} km ({chemists.length})
            </h2>
          </div>

          {loading ? (
            <div className="text-center py-12 text-gray-400">Locating pharmacies nearby...</div>
          ) : chemists.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              No pharmacies found within {radiusKm} km. Try increasing the search radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {chemists.map((chem) => (
                <div key={chem._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-bold text-gray-900 text-base">{chem.storeName}</h3>
                      <p className="text-xs text-primary-600 font-medium">Lic: {chem.drugLicenceNumber || 'Verified'}</p>
                    </div>
                    {chem.is24x7 && (
                      <span className="text-xs bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        24x7 Open
                      </span>
                    )}
                  </div>

                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {chem.address?.street}, {chem.address?.city}, {chem.address?.pincode}
                  </p>

                  <div className="space-y-1.5 text-xs text-gray-500 border-t border-gray-100 pt-3">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1">
                        <Navigation size={13} className="text-primary-600" />
                        {chem.distanceKm !== undefined ? `${chem.distanceKm.toFixed(1)} km away` : 'Nearby'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={13} />
                        {chem.openingHours || '9:00 AM - 10:00 PM'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <a
                        href={`tel:${chem.phone}`}
                        className="text-primary-600 hover:text-primary-700 font-semibold flex items-center gap-1"
                      >
                        <Phone size={13} /> {chem.phone || 'Contact'}
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${chem.location?.coordinates?.[1] || coords.latitude},${chem.location?.coordinates?.[0] || coords.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-gray-600 hover:text-primary-600 font-medium underline"
                      >
                        Get Directions
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
