import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import useAuthStore from '../store/useAuthStore';
import { User, Bell, Moon, Lock, CheckCircle2, AlertCircle, ShieldAlert } from 'lucide-react';

export default function ProfilePage() {
  const { user, setUser, logout } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Profile fields
  const [formData, setFormData] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    emergencyContact: user?.emergencyContact || '',
    language: user?.language || 'en'
  });

  // Quiet hours & notifications
  const [notificationPrefs, setNotificationPrefs] = useState({
    email: user?.notificationPreferences?.email ?? true,
    push: user?.notificationPreferences?.push ?? true,
    inApp: user?.notificationPreferences?.inApp ?? true,
    quietHoursStart: user?.quietHoursStart || '22:00',
    quietHoursEnd: user?.quietHoursEnd || '07:00'
  });

  // Password fields
  const [passwords, setPasswords] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMessage, setPwdMessage] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    apiClient.get('/users/me')
      .then(res => {
        const u = res.data.data.user;
        setUser(u);
        setFormData({
          name: u.name || '',
          phone: u.phone || '',
          emergencyContact: u.emergencyContact || '',
          language: u.language || 'en'
        });
        setNotificationPrefs({
          email: u.notificationPreferences?.email ?? true,
          push: u.notificationPreferences?.push ?? true,
          inApp: u.notificationPreferences?.inApp ?? true,
          quietHoursStart: u.quietHoursStart || '22:00',
          quietHoursEnd: u.quietHoursEnd || '07:00'
        });
      })
      .catch(() => {});
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await apiClient.put('/users/me', {
        name: formData.name,
        phone: formData.phone || undefined,
        emergencyContact: formData.emergencyContact || undefined,
        language: formData.language,
        notificationPreferences: {
          email: notificationPrefs.email,
          push: notificationPrefs.push,
          inApp: notificationPrefs.inApp
        },
        quietHoursStart: notificationPrefs.quietHoursStart,
        quietHoursEnd: notificationPrefs.quietHoursEnd
      });

      setUser(res.data.data.user);
      setSuccess('Profile and preferences updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      setPwdError('New passwords do not match');
      return;
    }
    setPwdLoading(true);
    setPwdError('');
    setPwdMessage('');
    try {
      await apiClient.put('/users/me/password', {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword
      });
      setPwdMessage('Password changed successfully');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPwdMessage(''), 3000);
    } catch (err) {
      setPwdError(err.response?.data?.message || 'Failed to change password');
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm('Are you sure you want to deactivate your account? You can reactivate anytime by contacting support.')) return;
    try {
      await apiClient.delete('/users/me');
      logout();
    } catch (err) {
      alert('Failed to deactivate account');
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <User className="text-primary-600" /> Account Settings & Preferences
        </h1>
        <p className="text-gray-600">Personalize your dosage reminders, quiet hours, and security settings.</p>
      </div>

      {success && (
        <div className="bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 flex items-center gap-2">
          <CheckCircle2 size={16} /> {success}
        </div>
      )}
      {error && (
        <div className="bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-200">
          {error}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleUpdateProfile} className="space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Personal Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Full Name</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Email Address</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm bg-gray-50 text-gray-400 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Phone Number</label>
              <input
                type="text"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Emergency Contact</label>
              <input
                type="text"
                placeholder="Caregiver / Doctor contact"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        {/* Quiet Hours & Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-2">
            <Moon className="text-primary-600" size={20} />
            <h2 className="text-lg font-bold text-gray-900">Quiet Hours & Reminders</h2>
          </div>
          <p className="text-xs text-gray-500">
            During quiet hours, routine non-emergency notifications are silenced so your sleep is uninterrupted.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quiet Hours Start</label>
              <input
                type="time"
                value={notificationPrefs.quietHoursStart}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, quietHoursStart: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Quiet Hours End</label>
              <input
                type="time"
                value={notificationPrefs.quietHoursEnd}
                onChange={(e) => setNotificationPrefs({ ...notificationPrefs, quietHoursEnd: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 space-y-2">
            <span className="block text-xs font-bold text-gray-700 uppercase tracking-wider">Reminder Channels</span>
            <div className="flex flex-wrap gap-6 text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.inApp}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, inApp: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">In-App Notification Bell</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.push}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, push: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Device Push Alerts</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={notificationPrefs.email}
                  onChange={(e) => setNotificationPrefs({ ...notificationPrefs, email: e.target.checked })}
                  className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4"
                />
                <span className="text-xs font-medium text-gray-700">Email Summaries</span>
              </label>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
            >
              {loading ? 'Saving Changes...' : 'Save Preferences'}
            </button>
          </div>
        </div>
      </form>

      {/* Change Password Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="text-primary-600" size={20} />
          <h2 className="text-lg font-bold text-gray-900">Security & Password</h2>
        </div>

        {pwdMessage && (
          <div className="bg-emerald-50 text-emerald-700 p-3 rounded-xl text-xs border border-emerald-200">
            {pwdMessage}
          </div>
        )}
        {pwdError && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
            {pwdError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Current Password</label>
              <input
                type="password"
                value={passwords.currentPassword}
                onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">New Password (min 8 chars)</label>
              <input
                type="password"
                value={passwords.newPassword}
                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1">Confirm New Password</label>
              <input
                type="password"
                value={passwords.confirmPassword}
                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={pwdLoading}
              className="px-6 py-2.5 bg-gray-900 hover:bg-black disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition"
            >
              {pwdLoading ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone */}
      <div className="bg-rose-50/50 border border-rose-200 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-rose-900">Deactivate Account</h3>
          <p className="text-xs text-rose-700">Temporarily deactivate your Meditrace profile and pause all notifications.</p>
        </div>
        <button
          type="button"
          onClick={handleDeactivate}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl text-xs transition"
        >
          Deactivate My Account
        </button>
      </div>
    </div>
  );
}
