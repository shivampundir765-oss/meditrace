import React, { useState, useEffect } from 'react';
import apiClient from '../api/client';
import { ShieldCheck, Users, Stethoscope, Store, UserX, CheckCircle, Search } from 'lucide-react';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    setError('');
    try {
      const params = {};
      if (roleFilter) params.role = roleFilter;
      const res = await apiClient.get('/admin/users', { params });
      setUsers(res.data.data.users || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch user directory');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [roleFilter]);

  const patientCount = users.filter(u => u.role === 'patient').length;
  const doctorCount = users.filter(u => u.role === 'doctor').length;
  const retailerCount = users.filter(u => u.role === 'retailer').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <ShieldCheck className="text-primary-600" /> Platform Administration & Security
        </h1>
        <p className="text-gray-600">Monitor system users, verify credentials, and manage RBAC permissions.</p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Total Users</p>
              <p className="text-xl font-black text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Patients</p>
              <p className="text-xl font-black text-gray-900">{patientCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Stethoscope size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Doctors</p>
              <p className="text-xl font-black text-gray-900">{doctorCount}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Store size={20} />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-semibold uppercase">Retailers</p>
              <p className="text-xl font-black text-gray-900">{retailerCount}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Role Filter & Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h2 className="text-lg font-bold text-gray-900">User Accounts Directory</h2>

          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 font-semibold">Filter Role:</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 bg-gray-50 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option value="patient">Patients</option>
              <option value="doctor">Doctors</option>
              <option value="retailer">Retailers</option>
              <option value="admin">Admins</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs border border-red-200">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading directory...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-gray-600">
              <thead className="bg-gray-50 text-xs uppercase font-bold text-gray-400 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-3.5">Name</th>
                  <th className="px-6 py-3.5">Email</th>
                  <th className="px-6 py-3.5">Role</th>
                  <th className="px-6 py-3.5">Phone</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {users.map((u) => (
                  <tr key={u._id} className="hover:bg-gray-50/50 transition">
                    <td className="px-6 py-4 font-bold text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 text-xs text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'doctor' ? 'bg-emerald-100 text-emerald-800' :
                        u.role === 'retailer' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{u.phone || '—'}</td>
                    <td className="px-6 py-4">
                      {u.isActive !== false ? (
                        <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                          <CheckCircle size={13} /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-rose-700 font-semibold flex items-center gap-1">
                          <UserX size={13} /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
