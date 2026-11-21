import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { Stethoscope, Calendar, Clock, MapPin, DollarSign, CheckCircle2, XCircle, Search, AlertCircle } from 'lucide-react';

export default function DoctorsPage() {
  const [activeTab, setActiveTab] = useState('find'); // 'find' | 'my-appointments'
  const [doctors, setDoctors] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Search filters
  const [specialization, setSpecialization] = useState('');
  const [city, setCity] = useState('');

  // Booking modal state
  const [selectedDoctor, setSelectedDoctor] = useState(null);
  const [selectedDate, setSelectedDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState('');
  const [symptoms, setSymptoms] = useState('');
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);

  const fetchDoctors = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (specialization) params.specialization = specialization;
      if (city) params.city = city;
      const res = await apiClient.get('/doctors', { params });
      setDoctors(res.data.data.doctors || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch doctors');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyAppointments = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.get('/appointments/my');
      setAppointments(res.data.data.appointments || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch appointments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'find') {
      fetchDoctors();
    } else {
      fetchMyAppointments();
    }
  }, [activeTab]);

  const openBookingModal = async (doctor) => {
    setSelectedDoctor(doctor);
    setSelectedSlot('');
    setSymptoms('');
    setError('');
    setSuccess('');
    await fetchSlots(doctor._id, selectedDate);
  };

  const fetchSlots = async (doctorId, date) => {
    setSlotsLoading(true);
    try {
      const res = await apiClient.get(`/doctors/${doctorId}/slots`, {
        params: { date }
      });
      setAvailableSlots(res.data.data.slots || []);
    } catch (err) {
      setAvailableSlots([]);
    } finally {
      setSlotsLoading(false);
    }
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedSlot('');
    if (selectedDoctor) {
      fetchSlots(selectedDoctor._id, date);
    }
  };

  const handleBookAppointment = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError('Please select an available time slot');
      return;
    }
    setBookingLoading(true);
    setError('');
    try {
      await apiClient.post('/appointments', {
        doctorId: selectedDoctor._id,
        appointmentDate: selectedDate,
        timeSlot: selectedSlot,
        symptoms: symptoms.trim() || undefined
      });
      setSuccess('Appointment confirmed successfully!');
      setTimeout(() => {
        setSelectedDoctor(null);
        setActiveTab('my-appointments');
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to book slot. It may have just been taken.');
    } finally {
      setBookingLoading(false);
    }
  };

  const handleCancelAppointment = async (id) => {
    if (!window.confirm('Are you sure you want to cancel this appointment?')) return;
    try {
      await apiClient.put(`/appointments/${id}/cancel`, { reason: 'Patient requested cancellation' });
      fetchMyAppointments();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to cancel appointment');
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Stethoscope className="text-primary-600" /> Consult Doctors & Book Appointments
          </h1>
          <p className="text-gray-600">Find trusted specialists and schedule verified clinic visits.</p>
        </div>

        {/* Tab Buttons */}
        <div className="flex bg-gray-100 p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('find')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'find' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Find Doctor
          </button>
          <button
            onClick={() => setActiveTab('my-appointments')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === 'my-appointments' ? 'bg-white text-primary-700 shadow-sm' : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Appointments
          </button>
        </div>
      </div>

      {activeTab === 'find' ? (
        <div className="space-y-6">
          {/* Filters */}
          <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Specialization</label>
              <input
                type="text"
                placeholder="e.g. Cardiologist, Dermatologist..."
                value={specialization}
                onChange={(e) => setSpecialization(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">City</label>
              <input
                type="text"
                placeholder="e.g. Bangalore, Mumbai..."
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={fetchDoctors}
                className="w-full py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2"
              >
                <Search size={16} /> Search Doctors
              </button>
            </div>
          </div>

          {/* Doctors Listing */}
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading verified doctors...</div>
          ) : doctors.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              No doctors found matching your criteria. Try widening your search.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {doctors.map((doc) => (
                <div key={doc._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900 text-lg">Dr. {doc.user?.name || doc.name}</h3>
                        <p className="text-sm font-semibold text-primary-600">{doc.specialization}</p>
                      </div>
                      <span className="text-xs bg-primary-50 text-primary-700 px-2.5 py-1 rounded-full font-bold">
                        {doc.experienceYears ? `${doc.experienceYears}+ yrs exp` : 'Verified'}
                      </span>
                    </div>

                    <p className="text-xs text-gray-500 mb-3 flex items-center gap-1">
                      <MapPin size={13} className="text-gray-400" />
                      {doc.clinicAddress?.street}, {doc.clinicAddress?.city}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-gray-600 py-3 border-y border-gray-100 my-3">
                      <div className="flex items-center gap-1 font-semibold text-gray-900">
                        <DollarSign size={14} className="text-emerald-600" />
                        ₹{doc.consultationFee} <span className="text-gray-400 font-normal">fee</span>
                      </div>
                      <div className="text-gray-500">
                        {doc.availableDays?.join(', ') || 'Mon-Fri'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => openBookingModal(doc)}
                    className="w-full mt-2 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-xl text-sm transition flex items-center justify-center gap-2"
                  >
                    <Calendar size={15} /> Book Appointment
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* My Appointments Tab */
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading appointments...</div>
          ) : appointments.length === 0 ? (
            <div className="bg-white p-8 rounded-2xl border border-gray-100 text-center text-gray-500">
              You have no scheduled appointments yet. Find a doctor to book your first slot.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {appointments.map((app) => (
                <div key={app._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-gray-900">Dr. {app.doctor?.user?.name || app.doctor?.name}</h3>
                        <p className="text-xs text-primary-600 font-medium">{app.doctor?.specialization}</p>
                      </div>
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold uppercase ${
                        app.status === 'confirmed' ? 'bg-emerald-100 text-emerald-800' :
                        app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        app.status === 'cancelled' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {app.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 p-3 rounded-xl space-y-1.5 text-xs text-gray-600 mb-3">
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <Calendar size={13} className="text-primary-600" />
                        {new Date(app.appointmentDate).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                      </div>
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <Clock size={13} className="text-primary-600" />
                        {app.timeSlot}
                      </div>
                      {app.symptoms && (
                        <div className="text-gray-500 pt-1">
                          Reason: {app.symptoms}
                        </div>
                      )}
                    </div>
                  </div>

                  {app.status === 'confirmed' && (
                    <div className="flex justify-end pt-2 border-t border-gray-100">
                      <button
                        onClick={() => handleCancelAppointment(app._id)}
                        className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {selectedDoctor && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Book Appointment</h2>
                <p className="text-sm text-gray-500">Dr. {selectedDoctor.user?.name || selectedDoctor.name} ({selectedDoctor.specialization})</p>
              </div>
              <button onClick={() => setSelectedDoctor(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">&times;</button>
            </div>

            {error && (
              <div className="mb-4 bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-4 bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs border border-emerald-200 flex items-center gap-2">
                <CheckCircle2 size={16} /> {success}
              </div>
            )}

            <form onSubmit={handleBookAppointment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Select Appointment Date</label>
                <input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  value={selectedDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Available Slots on {selectedDate}</label>
                {slotsLoading ? (
                  <div className="text-xs text-gray-400 py-3">Checking slot availability...</div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-xs text-rose-600 bg-rose-50 p-3 rounded-xl">
                    No open slots remaining on this day. Please pick another date.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`py-2 px-3 rounded-xl text-xs font-semibold border transition ${
                          selectedSlot === slot
                            ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                            : 'bg-white text-gray-700 border-gray-200 hover:border-primary-400'
                        }`}
                      >
                        {slot}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Symptoms or Primary Concern (Optional)</label>
                <textarea
                  placeholder="e.g. Mild chest discomfort for 2 days, routine blood pressure review..."
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={2}
                />
              </div>

              <div className="bg-gray-50 p-3 rounded-xl text-xs text-gray-500 flex justify-between">
                <span>Consultation Fee:</span>
                <span className="font-bold text-gray-900">₹{selectedDoctor.consultationFee} (Pay at clinic)</span>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctor(null)}
                  className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-sm font-medium transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={bookingLoading || !selectedSlot}
                  className="flex-1 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition"
                >
                  {bookingLoading ? 'Reserving...' : 'Confirm Slot'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
