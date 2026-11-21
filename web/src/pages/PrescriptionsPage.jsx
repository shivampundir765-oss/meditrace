import React, { useEffect, useState } from 'react';
import { FileText, Plus, Upload, Calendar, User, Eye, X } from 'lucide-react';
import api from '../api/client';

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState(null);

  // Form
  const [doctorName, setDoctorName] = useState('');
  const [hospitalName, setHospitalName] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  const fetchPrescriptions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/prescriptions');
      setPrescriptions(res.data.prescriptions || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const handleUpload = async (e) => {
    e.preventDefault();
    try {
      await api.post('/prescriptions', {
        doctor_name: doctorName,
        hospital_name: hospitalName,
        notes,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600'
      });
      setShowUploadModal(false);
      setDoctorName('');
      setHospitalName('');
      setNotes('');
      setImageUrl('');
      fetchPrescriptions();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleViewDetails = async (id) => {
    try {
      const res = await api.get(`/prescriptions/${id}`);
      setSelectedPrescription(res.data);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Prescriptions Vault</h1>
          <p className="text-xs text-slate-500">Secure digital archive of your doctor's prescriptions and linked medications.</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl text-xs shadow-sm transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Upload Prescription</span>
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-xs text-slate-400">Loading prescriptions...</div>
      ) : prescriptions.length === 0 ? (
        <div className="bg-white rounded-3xl p-10 border border-slate-200 text-center space-y-3">
          <FileText className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="font-bold text-base text-slate-800">No prescriptions stored</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Upload your prescription photos to easily order prescription-only medicines online.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2 bg-brand-600 text-white text-xs font-bold rounded-xl hover:bg-brand-700"
          >
            Upload Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {prescriptions.map((rx) => (
            <div
              key={rx._id}
              className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-bold text-base text-slate-900">
                      {rx.doctor_name ? `Dr. ${rx.doctor_name}` : 'Prescription'}
                    </h3>
                    {rx.hospital_name && (
                      <p className="text-xs text-slate-500">{rx.hospital_name}</p>
                    )}
                  </div>
                  <span className="px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full capitalize">
                    {rx.status}
                  </span>
                </div>

                {rx.notes && (
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 italic bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    "{rx.notes}"
                  </p>
                )}

                <p className="text-[11px] text-slate-400 mt-3 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Issued on {new Date(rx.prescription_date).toLocaleDateString()}</span>
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Digital Copy Attached</span>
                <button
                  onClick={() => handleViewDetails(rx._id)}
                  className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-700 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Details</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Prescription Modal */}
      {selectedPrescription && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">
                Dr. {selectedPrescription.prescription?.doctor_name}
              </h3>
              <button onClick={() => setSelectedPrescription(null)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs">
              {selectedPrescription.prescription?.image_url && (
                <div className="rounded-xl overflow-hidden max-h-48 border border-slate-200">
                  <img
                    src={selectedPrescription.prescription.image_url}
                    alt="Prescription"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div>
                <h4 className="font-bold text-slate-800 mb-2">Prescribed Medicines</h4>
                {selectedPrescription.medicines?.length === 0 ? (
                  <p className="text-slate-400 italic">No medicines currently linked to this prescription.</p>
                ) : (
                  <div className="divide-y divide-slate-100 border border-slate-100 rounded-xl">
                    {selectedPrescription.medicines?.map((m) => (
                      <div key={m._id} className="p-2.5 flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{m.name}</span>
                        <span className="text-slate-500">{m.dosage_form} • {m.quantity} left</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-slate-900">Upload New Prescription</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpload} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Doctor's Name</label>
                <input
                  type="text"
                  placeholder="e.g. Dr. House, Dr. Smith"
                  value={doctorName}
                  onChange={(e) => setDoctorName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Hospital / Clinic Name</label>
                <input
                  type="text"
                  placeholder="e.g. Apollo Hospital"
                  value={hospitalName}
                  onChange={(e) => setHospitalName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Image URL or Reference</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Doctor's Notes & Advice</label>
                <textarea
                  rows="3"
                  placeholder="Dosage instructions, duration, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                ></textarea>
              </div>

              <div className="pt-2 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold rounded-xl shadow-sm"
                >
                  Save Prescription
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
