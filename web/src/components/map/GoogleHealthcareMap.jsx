import React, { useState } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { Navigation, Phone, Clock, MapPin, ExternalLink, ShieldAlert } from 'lucide-react';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export default function GoogleHealthcareMap({
  facilities = [],
  center = { lat: 12.9716, lng: 77.5946 },
  zoom = 13,
  selectedFacility = null,
  onSelectFacility = () => {}
}) {
  const [activeMarker, setActiveMarker] = useState(null);

  // If a valid API key is present, render the official Google Maps JS API canvas
  if (GOOGLE_MAPS_API_KEY) {
    return (
      <div className="w-full h-96 rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative">
        <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
          <Map
            defaultCenter={center}
            center={center}
            defaultZoom={zoom}
            zoom={zoom}
            mapId="meditrace_healthcare_map"
            internalUsageAttributionIds={['gmp_git_agentskills_v1']}
            gestureHandling="greedy"
            disableDefaultUI={false}
            className="w-full h-full"
          >
            {/* User Center Pin */}
            <AdvancedMarker position={center} title="Your Location">
              <div className="w-4 h-4 bg-blue-600 rounded-full border-2 border-white ring-4 ring-blue-500/30 animate-pulse" />
            </AdvancedMarker>

            {/* Facilities Markers */}
            {facilities.map((fac) => {
              const coords = fac.coordinates || { latitude: 12.9716, longitude: 77.5946 };
              const isSelected = selectedFacility?._id === fac._id;

              let pinColor = '#10B981'; // Chemist = Emerald
              let pinGlyph = '💊';
              if (fac.type === 'hospital') {
                pinColor = '#EF4444'; // Hospital = Red
                pinGlyph = '🏥';
              } else if (fac.type === 'clinic') {
                pinColor = '#3B82F6'; // Clinic = Blue
                pinGlyph = '🩺';
              }

              return (
                <AdvancedMarker
                  key={fac._id}
                  position={{ lat: coords.latitude, lng: coords.longitude }}
                  onClick={() => {
                    setActiveMarker(fac);
                    onSelectFacility(fac);
                  }}
                  title={fac.name}
                >
                  <Pin
                    background={pinColor}
                    borderColor="#FFFFFF"
                    glyphColor="#FFFFFF"
                    scale={isSelected ? 1.25 : 1.0}
                  >
                    <span className="text-xs">{pinGlyph}</span>
                  </Pin>
                </AdvancedMarker>
              );
            })}

            {/* Info Window */}
            {activeMarker && (
              <InfoWindow
                position={{
                  lat: activeMarker.coordinates?.latitude || center.lat,
                  lng: activeMarker.coordinates?.longitude || center.lng
                }}
                onCloseClick={() => setActiveMarker(null)}
              >
                <div className="p-2 max-w-xs text-xs space-y-1.5 font-sans">
                  <div className="flex items-center justify-between gap-2">
                    <span className={`px-2 py-0.5 rounded font-bold uppercase text-[9px] ${
                      activeMarker.type === 'hospital'
                        ? 'bg-rose-100 text-rose-800'
                        : activeMarker.type === 'clinic'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {activeMarker.type}
                    </span>
                    {activeMarker.is_emergency_24x7 && (
                      <span className="bg-amber-100 text-amber-900 font-extrabold text-[9px] px-1.5 py-0.5 rounded">
                        24x7 Emergency
                      </span>
                    )}
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm">{activeMarker.name}</h4>
                  <p className="text-slate-500 text-[11px]">
                    {activeMarker.address?.street}, {activeMarker.address?.city}
                  </p>
                  <div className="text-slate-600 flex items-center justify-between pt-1 border-t border-slate-100">
                    <span>{activeMarker.distanceKm ? `${activeMarker.distanceKm} km away` : 'Nearby'}</span>
                    <span>{activeMarker.opening_hours}</span>
                  </div>

                  <div className="pt-2 flex gap-2">
                    <a
                      href={activeMarker.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${activeMarker.coordinates?.latitude},${activeMarker.coordinates?.longitude}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 py-1 px-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-semibold text-center flex items-center justify-center gap-1"
                    >
                      <Navigation size={12} />
                      Directions
                    </a>
                    {activeMarker.phone && (
                      <a
                        href={`tel:${activeMarker.phone}`}
                        className="py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded font-semibold text-center flex items-center justify-center gap-1"
                      >
                        <Phone size={12} />
                        Call
                      </a>
                    )}
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>
      </div>
    );
  }

  // Interactive Resilient Visual Healthcare Map
  return (
    <div className="w-full rounded-2xl overflow-hidden border border-slate-200 shadow-sm bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white p-5 relative">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-slate-700/60 gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
            <h3 className="font-bold text-sm tracking-wide text-white flex items-center gap-1.5">
              <MapPin size={16} className="text-blue-400" />
              Live Healthcare Geospatial Radar
            </h3>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Displaying {facilities.length} verified facilities near ({center.lat.toFixed(4)}, {center.lng.toFixed(4)})
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" /> Chemist
          </span>
          <span className="flex items-center gap-1 text-rose-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" /> Hospital
          </span>
          <span className="flex items-center gap-1 text-blue-400 font-medium">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> Clinic
          </span>
        </div>
      </div>

      {/* Interactive Map Grid with Pins */}
      <div className="py-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {facilities.slice(0, 6).map((fac) => {
            const isSelected = selectedFacility?._id === fac._id;
            const isHospital = fac.type === 'hospital';
            const isClinic = fac.type === 'clinic';

            return (
              <div
                key={fac._id}
                onClick={() => onSelectFacility(fac)}
                className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                  isSelected
                    ? 'bg-blue-600/30 border-blue-400 shadow-lg shadow-blue-500/20 ring-1 ring-blue-400'
                    : 'bg-slate-800/60 hover:bg-slate-800 border-slate-700/80'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider ${
                    isHospital
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                      : isClinic
                      ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  }`}>
                    {fac.type === 'chemist' ? '💊 Chemist' : isHospital ? '🏥 Hospital' : '🩺 Clinic'}
                  </span>
                  <span className="text-[11px] font-bold text-amber-300 flex items-center gap-1">
                    <Navigation size={11} className="text-blue-400" />
                    {fac.distanceKm ? `${fac.distanceKm} km` : 'Near'}
                  </span>
                </div>

                <h4 className="font-bold text-white text-xs line-clamp-1">{fac.name}</h4>
                <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                  {fac.address?.street}, {fac.address?.city}
                </p>

                <div className="flex items-center justify-between text-[11px] text-slate-300 mt-2.5 pt-2 border-t border-slate-700/50">
                  <span className="flex items-center gap-1 text-[10px]">
                    <Clock size={11} className="text-slate-400" />
                    {fac.opening_hours?.slice(0, 15)}...
                  </span>
                  <a
                    href={fac.google_maps_url || `https://www.google.com/maps/dir/?api=1&destination=${fac.coordinates?.latitude},${fac.coordinates?.longitude}`}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="text-blue-400 hover:text-blue-300 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    Directions <ExternalLink size={10} />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between text-xs text-slate-400 pt-2 border-t border-slate-700/60">
        <span className="text-[11px]">
          Powered by Google Maps Platform & Open Geospatial Standards
        </span>
        <span className="text-[11px] font-mono text-slate-500">
          Ref: gmp_git_agentskills_v1
        </span>
      </div>
    </div>
  );
}
