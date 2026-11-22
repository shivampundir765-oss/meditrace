import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { User, Bell, Lock, CheckCircle2, AlertCircle, ShieldAlert, Users, Globe, PhoneCall } from 'lucide-react';
import { useTranslation } from '../i18n';
import { useProfile } from '../context/ProfileContext';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();
  const { t, language, setLanguage } = useTranslation();
  const { profiles, activeProfile, switchProfile, createFamilyMember } = useProfile();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile fields
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || ''
  });

  // Push notifications & alert toggles
  const [pushEnabled, setPushEnabled] = useState(user?.notificationSettings?.pushNotifications ?? true);
  const [doseAlerts, setDoseAlerts] = useState(user?.notificationSettings?.doseAlerts ?? true);
  const [lowStockAlerts, setLowStockAlerts] = useState(user?.notificationSettings?.lowStockAlerts ?? true);

  // New family member modal
  const [showAddFamily, setShowAddFamily] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRel, setNewMemberRel] = useState('father');
  const [newMemberBlood, setNewMemberBlood] = useState('');

  // Password fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  // Show legal notice modal
  const [showLegalNotice, setShowLegalNotice] = useState(false);

  useEffect(() => {
    apiClient.get('/users/me')
      .then((res) => {
        const u = res.data?.user || res.data?.data?.user;
        if (!u) return;
        setUser(u);
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          emergencyContact: u.emergencyContact || ''
        });
        if (u.notificationSettings) {
          setPushEnabled(u.notificationSettings.pushNotifications !== false);
          setDoseAlerts(u.notificationSettings.doseAlerts !== false);
          setLowStockAlerts(u.notificationSettings.lowStockAlerts !== false);
        }
      })
      .catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await apiClient.put('/users/me', {
        name: formData.name,
        phone: formData.phone || undefined,
        preferred_language: language,
        notificationSettings: {
          pushNotifications: pushEnabled,
          doseAlerts,
          lowStockAlerts
        }
      });
      setSuccess('Profile and notification settings saved successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFamily = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    try {
      await createFamilyMember({
        name: newMemberName.trim(),
        relationship: newMemberRel,
        blood_group: newMemberBlood
      });
      setShowAddFamily(false);
      setNewMemberName('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to create member');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return setPwdError('New passwords do not match.');
    }
    setPwdLoading(true);
    setPwdMessage('');
    setPwdError('');
    try {
      await apiClient.put('/users/change-password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPwdMessage('Password changed successfully.');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password.');
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
            <span>👤</span>
            <span>{t('profile.title', 'Profile & Settings')}</span>
          </h1>
          <p className="text-xs text-gray-500 mt-1">
            Manage your account, multi-profile family members, localization, and notifications.
          </p>
        </div>

        <button
          onClick={() => setShowLegalNotice(true)}
          className="text-xs font-bold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3.5 py-2 rounded-2xl border border-teal-200 transition-colors flex items-center space-x-1.5"
        >
          <ShieldAlert className="w-4 h-4 text-teal-600" />
          <span>{t('profile.legal_notice', 'Important Medical & Legal Notice')}</span>
        </button>
      </div>

      {success && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-2 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{success}</span>
        </div>
      )}

      {error && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl flex items-center space-x-2 text-xs text-rose-800">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Localization & Language Selector */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-teal-900 border-b border-gray-100 pb-3">
          <Globe className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-sm">{t('profile.language', 'Preferred Language')}</h3>
        </div>

        <div className="flex items-center space-x-3 text-xs">
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-4 py-2 rounded-xl font-bold border transition-all ${
              language === 'en'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            English (EN)
          </button>
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`px-4 py-2 rounded-xl font-bold border transition-all ${
              language === 'hi'
                ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
            }`}
          >
            हिंदी (Hindi)
          </button>
        </div>
      </div>

      {/* 2. Family Mode & Profiles */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center space-x-2 text-teal-900">
            <Users className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold text-sm">{t('profile.family_mode', 'Family Mode & Profiles')}</h3>
          </div>
          <button
            onClick={() => setShowAddFamily(true)}
            className="text-xs font-bold text-teal-700 hover:text-teal-900"
          >
            + {t('profile.add_member', 'Add Family Member')}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.map((p) => {
            const isActive = String(p._id) === String(activeProfile?._id);
            return (
              <div
                key={p._id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  isActive ? 'bg-teal-50 border-teal-300 ring-2 ring-teal-100' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div>
                  <div className="flex items-center space-x-1.5">
                    <span className="font-bold text-xs text-gray-900">{p.name}</span>
                    <span className="text-[10px] font-semibold uppercase px-1.5 py-0.2 rounded-full bg-white border border-gray-200 text-gray-600">
                      {p.relationship}
                    </span>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {p.blood_group ? `Blood: ${p.blood_group} • ` : ''}
                    {p.is_owner ? 'Owner' : p.user_access_level === 'caregiver_edit' ? 'Can Edit' : 'View Only'}
                  </p>
                </div>

                {!isActive ? (
                  <button
                    onClick={() => switchProfile(p._id)}
                    className="text-xs font-bold text-teal-700 bg-white hover:bg-teal-100/70 border border-teal-200 px-3 py-1 rounded-xl shadow-2xs transition-colors"
                  >
                    Switch
                  </button>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-full">
                    Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. Push Notifications Settings */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-teal-900 border-b border-gray-100 pb-3">
          <Bell className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-sm">Notifications & Alerts</h3>
        </div>

        <div className="space-y-3 text-xs">
          {/* Push notification toggle */}
          <div className="flex items-start justify-between p-3.5 bg-gray-50 rounded-2xl border border-gray-100">
            <div>
              <p className="font-bold text-gray-900">Push Notifications (FCM / Web Push)</p>
              <p className="text-gray-500 text-[11px] mt-0.5">
                {t('profile.push_desc', 'Receive alerts when doses are due or stock is low. In-app alerts remain active even when push is off.')}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-4">
              <input
                type="checkbox"
                checked={pushEnabled}
                onChange={(e) => setPushEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-gray-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-teal-600"></div>
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={doseAlerts}
                onChange={(e) => setDoseAlerts(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium text-gray-800">Dose Reminders</span>
            </label>

            <label className="flex items-center space-x-2 p-3 bg-gray-50 rounded-xl border border-gray-100 cursor-pointer">
              <input
                type="checkbox"
                checked={lowStockAlerts}
                onChange={(e) => setLowStockAlerts(e.target.checked)}
                className="rounded text-teal-600 focus:ring-teal-500"
              />
              <span className="font-medium text-gray-800">Low Stock & Expiry Warnings</span>
            </label>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={handleUpdateProfile}
            disabled={loading}
            className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
          >
            {loading ? 'Saving...' : 'Save Preferences'}
          </button>
        </div>
      </div>

      {/* 4. Password Change */}
      <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-xs space-y-4">
        <div className="flex items-center space-x-2 text-teal-900 border-b border-gray-100 pb-3">
          <Lock className="w-5 h-5 text-teal-600" />
          <h3 className="font-bold text-sm">Security & Password</h3>
        </div>

        {pwdMessage && <p className="text-xs text-emerald-600 font-medium">{pwdMessage}</p>}
        {pwdError && <p className="text-xs text-rose-600 font-medium">{pwdError}</p>}

        <form onSubmit={handleChangePassword} className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Current Password</label>
              <input
                type="password"
                required
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">New Password</label>
              <input
                type="password"
                required
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-gray-700 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-5 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs disabled:opacity-50"
            >
              {pwdLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal: Important Medical & Legal Notice */}
      {showLegalNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-lg w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center space-x-2 text-teal-800">
                <ShieldAlert className="w-5 h-5 text-teal-600" />
                <h3 className="font-bold text-sm text-gray-900">
                  {t('legal.title', 'Important Medical & Legal Notice')}
                </h3>
              </div>
              <button
                onClick={() => setShowLegalNotice(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <div className="space-y-3 text-xs text-gray-600 leading-relaxed max-h-72 overflow-y-auto">
              <p>{t('legal.p1')}</p>
              <p>{t('legal.p2')}</p>

              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-red-900 flex items-start space-x-2 font-medium">
                <PhoneCall className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold">Emergency Medical Protocol:</p>
                  <p className="mt-0.5">{t('legal.emergency')}</p>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setShowLegalNotice(false)}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs font-bold shadow-xs"
              >
                Close Notice
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Add Family Member */}
      {showAddFamily && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="font-bold text-sm text-gray-900">Add Family Member</h3>
              <button
                onClick={() => setShowAddFamily(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateFamily} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Rao"
                  value={newMemberName}
                  onChange={(e) => setNewMemberName(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Relationship</label>
                <select
                  value={newMemberRel}
                  onChange={(e) => setNewMemberRel(e.target.value)}
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
                  value={newMemberBlood}
                  onChange={(e) => setNewMemberBlood(e.target.value)}
                  className="w-full text-xs rounded-xl border border-gray-200 px-3 py-2 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddFamily(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-xl shadow-xs"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
