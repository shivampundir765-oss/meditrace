import React, { useState, useRef, useEffect } from 'react';
import { useProfile } from '../../context/ProfileContext';
import { useTranslation } from '../../i18n';

export default function ProfileSwitcher() {
  const { profiles, activeProfile, switchProfile, createFamilyMember } = useProfile();
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newMember, setNewMember] = useState({
    name: '',
    relationship: 'other',
    blood_group: '',
    gender: 'male',
    date_of_birth: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!activeProfile) return null;

  const relationshipColors = {
    self: 'bg-teal-50 text-teal-700 border-teal-200',
    father: 'bg-blue-50 text-blue-700 border-blue-200',
    mother: 'bg-rose-50 text-rose-700 border-rose-200',
    spouse: 'bg-purple-50 text-purple-700 border-purple-200',
    child: 'bg-amber-50 text-amber-700 border-amber-200',
    other: 'bg-gray-50 text-gray-700 border-gray-200'
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!newMember.name.trim()) return;
    setSubmitting(true);
    try {
      await createFamilyMember(newMember);
      setShowAddModal(false);
      setNewMember({ name: '', relationship: 'other', blood_group: '', gender: 'male', date_of_birth: '' });
      setIsOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white/90 hover:bg-white border border-teal-200/80 rounded-full px-3.5 py-1.5 text-xs font-medium text-gray-800 shadow-xs hover:shadow transition-all"
        title={t('profile.switch_profile', 'Switch Profile')}
      >
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span className="font-semibold text-teal-800 truncate max-w-[130px]">
          {activeProfile.name}
        </span>
        <span className={`text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full border ${relationshipColors[activeProfile.relationship] || relationshipColors.other}`}>
          {activeProfile.relationship}
        </span>
        <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white shadow-xl ring-1 ring-black/5 divide-y divide-gray-100 z-50 animate-in fade-in zoom-in-95 duration-100">
          <div className="p-3 bg-teal-50/50 rounded-t-2xl">
            <p className="text-[11px] font-semibold text-teal-900 uppercase tracking-wider">
              {t('profile.family_mode', 'Family Mode & Profiles')}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {t('profile.switch_desc', 'Switch context to view or manage family records')}
            </p>
          </div>

          <div className="py-1 max-h-60 overflow-y-auto">
            {profiles.map((p) => {
              const isActive = String(p._id) === String(activeProfile._id);
              return (
                <button
                  key={p._id}
                  onClick={() => {
                    switchProfile(p._id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 flex items-center justify-between text-xs transition-colors ${
                    isActive ? 'bg-teal-50 text-teal-900 font-semibold' : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <div className="w-7 h-7 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs uppercase">
                      {p.name.charAt(0)}
                    </div>
                    <div className="truncate">
                      <p className="truncate font-medium">{p.name}</p>
                      <div className="flex items-center space-x-1.5 mt-0.5">
                        <span className="text-[10px] text-gray-400 capitalize">{p.relationship}</span>
                        {p.blood_group && (
                          <span className="text-[9px] bg-red-50 text-red-600 px-1 rounded font-medium">
                            {p.blood_group}
                          </span>
                        )}
                        {!p.is_owner && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 px-1 rounded font-medium">
                            {p.user_access_level === 'caregiver_edit' ? 'Can Edit' : 'View Only'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {isActive && (
                    <svg className="w-4 h-4 text-teal-600 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              );
            })}
          </div>

          <div className="p-2">
            <button
              onClick={() => {
                setShowAddModal(true);
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-center space-x-2 py-2 px-3 text-xs font-medium text-teal-700 bg-teal-50/70 hover:bg-teal-100/70 rounded-xl transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              <span>{t('profile.add_member', 'Add Family Member')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Family Member Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                {t('profile.add_member', 'Add Family Member')}
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunita Rao"
                  value={newMember.name}
                  onChange={(e) => setNewMember({ ...newMember, name: e.target.value })}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                  <select
                    value={newMember.relationship}
                    onChange={(e) => setNewMember({ ...newMember, relationship: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-200 px-2 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  >
                    <option value="father">Father</option>
                    <option value="mother">Mother</option>
                    <option value="spouse">Spouse</option>
                    <option value="child">Child</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Blood Group</label>
                  <input
                    type="text"
                    placeholder="e.g. O+, A+"
                    value={newMember.blood_group}
                    onChange={(e) => setNewMember({ ...newMember, blood_group: e.target.value })}
                    className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs disabled:opacity-50"
                >
                  {submitting ? 'Saving...' : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
