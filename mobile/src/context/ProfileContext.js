import React, { createContext, useContext, useState, useEffect } from 'react';
import storage from '../api/storage';
import mobileClient from '../api/client';

const ProfileContext = createContext({
  profiles: [],
  activeProfile: null,
  loading: true,
  switchProfile: () => {},
  refreshProfiles: () => {},
  addFamilyMember: async () => {}
});

export const ProfileProvider = ({ children }) => {
  const [profiles, setProfiles] = useState([]);
  const [activeProfile, setActiveProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchProfiles = async () => {
    try {
      const res = await mobileClient.get('/profiles');
      const list = res.data?.profiles || res.data || [];
      if (Array.isArray(list) && list.length > 0) {
        setProfiles(list);
        const storedProfileId = await storage.getItem('meditrace_profile_id');
        const matched = list.find((p) => p._id === storedProfileId);
        const selected = matched || list[0];
        setActiveProfile(selected);
        if (selected) {
          await storage.setItem('meditrace_profile_id', selected._id);
        }
      }
    } catch (_err) {
      // Fallback default self profile
      const defaultProfile = {
        _id: 'default-profile-self',
        name: 'Alex Johnson',
        relationship: 'self',
        access_level: 'owner',
        is_primary: true
      };
      setProfiles([defaultProfile]);
      setActiveProfile(defaultProfile);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfiles();
  }, []);

  const switchProfile = async (profile) => {
    if (!profile) return;
    setActiveProfile(profile);
    await storage.setItem('meditrace_profile_id', profile._id);
  };

  const addFamilyMember = async (data) => {
    const res = await mobileClient.post('/profiles', data);
    await fetchProfiles();
    return res;
  };

  return (
    <ProfileContext.Provider
      value={{
        profiles,
        activeProfile,
        loading,
        switchProfile,
        refreshProfiles: fetchProfiles,
        addFamilyMember
      }}
    >
      {children}
    </ProfileContext.Provider>
  );
};

export const useProfile = () => useContext(ProfileContext);
export default useProfile;
