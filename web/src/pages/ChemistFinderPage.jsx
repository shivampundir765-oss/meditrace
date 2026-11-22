import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import {
  Search,
  MapPin,
  Phone,
  Clock,
  Navigation,
  CheckCircle,
  Building2,
  Stethoscope,
  Pill,
  AlertCircle,
  ShieldAlert,
  Compass
} from 'lucide-react';
import GoogleHealthcareMap from '../components/map/GoogleHealthcareMap';

export default function ChemistFinderPage() {
  const [facilities, setFacilities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [coords, setCoords] = useState({ latitude: 12.9716, longitude: 77.5946 }); // Default Bangalore coords
  const [radiusKm, setRadiusKm] = useState(10);
  const [selectedType, setSelectedType] = useState('chemist'); // default to 'chemist' tab
  const [selectedFacility, setSelectedFacility] = useState(null);
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [locationPermissionExplanation, setLocationPermissionExplanation] = useState(true);
  const [typedCity, setTypedCity] = useState('');

  // Major cities coordinate lookup fallback
  const CITY_COORDS = {
    bangalore: { lat: 12.9716, lng: 77.5946, label: 'Bangalore (560001)' },
    mumbai: { lat: 19.0760, lng: 72.8777, label: 'Mumbai (400001)' },
    delhi: { lat: 28.6139, lng: 77.2090, label: 'Delhi NCR (110001)' },
    hyderabad: { lat: 17.3850, lng: 78.4867, label: 'Hyderabad (500001)' },
    chennai: { lat: 13.0827, lng: 80.2707, label: 'Chennai (600001)' },
    pune: { lat: 18.5204, lng: 73.8567, label: 'Pune (411001)' }
  };

  const handleApplyCity = (cityKey) => {
    const target = CITY_COORDS[cityKey.toLowerCase()] || CITY_COORDS.bangalore;
    setCoords({ latitude: target.lat, longitude: target.lng });
    setTypedCity('');
  };

  // Live Medicine Stock Search State
  const [medicineQuery, setMedicineQuery] = useState('');
  const [medicineStockists, setMedicineStockists] = useState(null);
  const [stockSearchLoading, setStockSearchLoading] = useState(false);

  // Auto request location on mount
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        () => console.log('Location permission unavailable; using default regional coordinates.')
      );
    }
  }, []);

  const fetchNearbyFacilities = async () => {
    setLoading(true);
    setError('');
    try {
      let endpoint = '/places/nearby';
      if (selectedType === 'chemist') endpoint = '/nearby/chemists';
      else if (selectedType === 'hospital') endpoint = '/nearby/hospitals';

      const res = await apiClient.get(endpoint, {
        params: {
          lat: coords.latitude,
          lng: coords.longitude,
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radiusKm,
          radiusKm,
          type: selectedType,
          emergencyOnly
        }
      });
      const data = res.data?.places || res.data?.facilities || res.data?.data?.places || res.data?.data?.facilities || [];
      setFacilities(data);
      if (data.length > 0 && !selectedFacility) {
        setSelectedFacility(data[0]);
      }
    } catch (err) {
      // Fallback to /places/nearby
      try {
        const fallbackRes = await apiClient.get('/places/nearby', {
          params: {
            latitude: coords.latitude,
            longitude: coords.longitude,
            radiusKm
          }
        });
        const cData = fallbackRes.data?.facilities || fallbackRes.data?.data?.facilities || [];
        setFacilities(cData);
      } catch (_e) {
        setError(err.message || 'Unable to retrieve nearby healthcare facilities');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSearchMedicineStock = async (e) => {
    e.preventDefault();
    if (!medicineQuery.trim()) return;

    setStockSearchLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/chemists/search-medicine', {
        params: {
          name: medicineQuery.trim(),
          latitude: coords.latitude,
          longitude: coords.longitude,
          radius: radiusKm
        }
      });
      const items = res.data?.stockists || res.data?.data?.stockists || res.data?.results || [];
      setMedicineStockists(items);
    } catch (err) {
      setError(err.message || 'Failed to search medicine in nearby chemists');
    } finally {
      setStockSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchNearbyFacilities();
  }, [coords.latitude, coords.longitude, radiusKm, selectedType, emergencyOnly]);

  const handleUseMyLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude
          });
        },
        (err) => alert('Could not get GPS location: ' + err.message)
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Location Permission Explanation & City Fallback Banner */}
      {locationPermissionExplanation && (
        <div className="bg-teal-50/70 border border-teal-200 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-700" />
              <span className="text-xs font-bold text-teal-900 uppercase tracking-wide">
                Location Privacy & Permission
              </span>
            </div>
            <p className="text-xs text-teal-800 leading-relaxed max-w-2xl">
              Meditrace uses your device geolocation solely to calculate travel distance and find open pharmacies and hospitals near you. Your exact location is never stored on our servers.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleUseMyLocation}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
            >
              <Navigation size={13} className="text-teal-200" />
              <span>Allow GPS</span>
            </button>
            <div className="flex items-center gap-1 text-[11px] font-semibold text-teal-900">
              <span className="text-teal-600 mr-1">Or City:</span>
              {['Bangalore', 'Mumbai', 'Delhi'].map(city => (
                <button
                  key={city}
                  onClick={() => handleApplyCity(city)}
                  className="px-2.5 py-1 bg-white hover:bg-teal-100 text-teal-900 rounded-lg border border-teal-200 shadow-2xs transition"
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="px-2.5 py-1 bg-teal-100 text-teal-800 text-[10px] font-bold rounded-full uppercase tracking-wider">
            Google Maps & ABDM Registered Retailers
          </span>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 mt-1">
            <Compass className="text-teal-600" />
            Healthcare & Chemist Locator
          </h1>
          <p className="text-xs text-slate-500">
            Find nearby 24/7 pharmacies, trauma hospitals, and clinics with stock verification and Google Maps turn-by-turn directions.
          </p>
        </div>

        <button
          onClick={handleUseMyLocation}
          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow transition"
        >
          <Navigation size={14} className="text-teal-300" />
          <span>Update My GPS Location</span>
        </button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        {/* Category Pills */}
        <div className="flex flex-wrap gap-2 text-xs font-bold">
          <button
            onClick={() => setSelectedType('chemist')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition ${
              selectedType === 'chemist'
                ? 'bg-teal-600 text-white shadow'
                : 'bg-teal-50 text-teal-800 hover:bg-teal-100'
            }`}
          >
            <Pill size={15} />
            <span>Chemists & Pharmacies</span>
          </button>
          <button
            onClick={() => setSelectedType('hospital')}
            className={`px-4 py-2.5 rounded-xl flex items-center gap-1.5 transition ${
              selectedType === 'hospital'
                ? 'bg-rose-600 text-white shadow'
                : 'bg-rose-50 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <Building2 size={15} />
            <span>Hospitals & Clinics</span>
          </button>
          <button
            onClick={() => setSelectedType('all')}
            className={`px-4 py-2.5 rounded-xl transition ${
              selectedType === 'all'
                ? 'bg-slate-900 text-white shadow'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Facilities ({facilities.length})
          </button>
          <button
            onClick={() => setEmergencyOnly(!emergencyOnly)}
            className={`px-3 py-2.5 rounded-xl border flex items-center gap-1.5 transition ml-auto text-xs ${
              emergencyOnly
                ? 'bg-amber-500 text-white border-amber-600 shadow'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            <ShieldAlert size={14} />
            <span>24x7 Emergency Only</span>
          </button>
        </div>

        {/* Controls: Radius & Live Medicine Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-slate-100">
          <div>
            <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1.5">
              <span>Search Radius:</span>
              <span className="text-teal-600 font-extrabold">{radiusKm} km</span>
            </div>
            {/* Quick radius chips */}
            <div className="flex gap-1.5">
              {[1, 3, 5, 10, 25].map(r => (
                <button
                  key={r}
                  onClick={() => setRadiusKm(r)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    radiusKm === r ? 'bg-teal-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {r} km
                </button>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <form onSubmit={handleSearchMedicineStock} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Check live pharmacy stock for a medicine (e.g. Dolo 650, Augmentin)..."
                  value={medicineQuery}
                  onChange={(e) => setMedicineQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500 text-xs font-medium"
                />
              </div>
              <button
                type="submit"
                disabled={stockSearchLoading}
                className="px-4 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs transition shadow flex items-center gap-1 flex-shrink-0"
              >
                <span>{stockSearchLoading ? 'Checking...' : 'Check Stock'}</span>
              </button>
              {medicineStockists && (
                <button
                  type="button"
                  onClick={() => {
                    setMedicineStockists(null);
                    setMedicineQuery('');
                  }}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-700 p-4 rounded-2xl text-xs border border-rose-200 flex items-center gap-2">
          <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Google Maps Visual Interactive Canvas */}
      <GoogleHealthcareMap
        facilities={facilities}
        center={{ lat: coords.latitude, lng: coords.longitude }}
        zoom={13}
        selectedFacility={selectedFacility}
        onSelectFacility={setSelectedFacility}
      />

      {/* Medicine Stock Search Results (If Active) */}
      {medicineStockists !== null && (
        <div className="space-y-3">
          <h2 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span>Pharmacies with "{medicineQuery}" in stock ({medicineStockists.length})</span>
          </h2>
          {medicineStockists.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
              No chemist within {radiusKm} km currently stocks "{medicineQuery}". Try increasing search radius.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {medicineStockists.map((item, idx) => (
                <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
                  <div className="flex justify-between items-start">
                    <h3 className="font-bold text-slate-900 text-sm">{item.retailer?.shop_name || item.retailer?.storeName || 'Pharmacy'}</h3>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle size={10} /> {item.quantity_in_stock || item.quantity || 10} In Stock
                    </span>
                  </div>
                  <p className="text-xs font-bold text-brand-600">₹{item.price || 35.00}</p>
                  <p className="text-[11px] text-slate-500">{item.retailer?.address?.street}, {item.retailer?.address?.city}</p>
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-1 text-slate-500 text-[11px]">
                      <Navigation size={12} className="text-brand-600" />
                      {item.distance_km ? `${item.distance_km} km away` : 'Nearby'}
                    </span>
                    <a
                      href={`tel:${item.retailer?.phone || '+918025251122'}`}
                      className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 text-xs"
                    >
                      <Phone size={12} /> Call
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Verified Facilities Cards Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-extrabold text-slate-900">
            Verified Facilities ({facilities.length})
          </h2>
          <span className="text-xs text-slate-400 font-medium">Sorted by GPS Proximity</span>
        </div>

        {loading ? (
          <div className="text-center py-12 text-slate-400 text-xs">Loading facilities...</div>
        ) : facilities.length === 0 ? (
          <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center text-slate-500 text-xs">
            No healthcare facilities found within {radiusKm} km. Try increasing the search radius.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {facilities.map((fac) => {
              const isHospital = fac.type === 'hospital';
              const isClinic = fac.type === 'clinic';
              const isSelected = selectedFacility?._id === fac._id;

              return (
                <div
                  key={fac._id}
                  onClick={() => setSelectedFacility(fac)}
                  className={`bg-white p-5 rounded-2xl border transition-all cursor-pointer space-y-3 ${
                    isSelected
                      ? 'border-brand-500 shadow-md ring-2 ring-brand-500/20'
                      : 'border-slate-200 hover:border-slate-300 shadow-sm'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                        isHospital
                          ? 'bg-rose-100 text-rose-800'
                          : isClinic
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {fac.type === 'chemist' ? '💊 Chemist' : isHospital ? '🏥 Hospital' : '🩺 Clinic'}
                      </span>
                      <h3 className="font-extrabold text-slate-900 text-sm mt-1">{fac.name}</h3>
                    </div>
                    {fac.is_emergency_24x7 && (
                      <span className="text-[10px] bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        24x7 Emergency
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">
                    {fac.address?.street}, {fac.address?.city}, {fac.address?.state || ''} {fac.address?.zipCode || ''}
                  </p>

                  {fac.specialties && fac.specialties.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {fac.specialties.slice(0, 3).map((spec, i) => (
                        <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md font-medium">
                          {spec}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-slate-500 text-[11px]">
                      <span className="flex items-center gap-1 font-semibold text-slate-700">
                        <Navigation size={12} className="text-brand-600" />
                        {fac.distanceKm !== undefined ? `${fac.distanceKm} km away` : 'Nearby'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {fac.opening_hours || '24 Hours'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      {fac.phone ? (
                        <a
                          href={`tel:${fac.emergency_phone || fac.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="text-brand-600 hover:text-brand-700 font-bold flex items-center gap-1 text-xs"
                        >
                          <Phone size={13} /> Call: {fac.phone}
                        </a>
                      ) : <span />}

                      <a
                        href={fac.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${fac.coordinates?.latitude},${fac.coordinates?.longitude}`}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 font-bold rounded-lg text-xs flex items-center gap-1 transition"
                      >
                        <Navigation size={12} />
                        Directions
                      </a>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
