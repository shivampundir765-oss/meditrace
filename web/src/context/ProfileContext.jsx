import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../api/client';
import useAuthStore from '../store/useAuthStore';

const ProfileContext = createContext({
  profiles: [],
  activeProfile: null,
  loading: false,
  setActiveProfile: () => {},
  switchProfile: () => {},
  refreshProfiles: () => {},
  createFamilyMember: async () => {}
});

export const ProfileProvider = ({ children }) => {
  const { isAuthenticated } = useAuthStore();
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchProfiles = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const res = await api.get('/profiles');
      const list = res.data?.profiles || [];
      setProfiles(list);

      const storedId = localStorage.getItem('meditrace_active_profile_id');
      let found = null;
      if (storedId) {
        found = list.find((p) => String(p._id) === String(storedId));
      }
      if (!found) {
        found = list.find((p) => p.is_default) || list.find((p) => p.relationship === 'self') || list[0] || null;
      }

      if (found) {
        setActiveProfile(found);
        localStorage.setItem('meditrace_active_profile_id', found._id);
      }
    } catch (err) {
      console.error('Failed to load profiles:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  const switchProfile = (profileId) => {
    const target = profiles.find((p) => String(p._id) === String(profileId));
    if (target) {
      setActiveProfile(target);
      localStorage.setItem('meditrace_active_profile_id', target._id);
      window.dispatchEvent(new CustomEvent('meditrace_profile_switched', { detail: target }));
    }
  };

  const createFamilyMember = async (payload) => {
    try {
      const res = await api.post('/profiles', payload);
      const newProfile = res.data?.profile;
      if (newProfile) {
        await fetchProfiles();
        switchProfile(newProfile._id);
        return newProfile;
      }
    } catch (err) {
      console.error('Error creating family member profile:', err);
      throw err;
    }
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loading,
        setActiveProfile,
        switchProfile,
        refreshProfiles: fetchProfiles,
        createFamilyMember
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
