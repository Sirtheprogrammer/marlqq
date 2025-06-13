import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaBirthdayCake, FaVenus, FaMars, FaPencilAlt, FaSave } from 'react-icons/fa';
import './Profile.css';

const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [profile, setProfile] = useState({
    displayName: '',
    age: '',
    dateOfBirth: '',
    sex: '',
    bio: ''
  });

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        } else {
          // Create default profile if it doesn't exist
          const defaultProfile = {
            displayName: user.email.split('@')[0],
            age: '',
            dateOfBirth: '',
            sex: '',
            bio: '',
            createdAt: new Date()
          };
          await setDoc(profileRef, defaultProfile);
          setProfile(defaultProfile);
        }
      } catch (err) {
        setError('Failed to load profile');
        console.error(err);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfile(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    try {
      const profileRef = doc(db, 'userProfiles', user.uid);
      await updateDoc(profileRef, {
        ...profile,
        updatedAt: new Date()
      });
      setIsEditing(false);
    } catch (err) {
      setError('Failed to update profile');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="profile-header">
          <h2>My Profile</h2>
          <button 
            className={`edit-button ${isEditing ? 'editing' : ''}`}
            onClick={() => setIsEditing(!isEditing)}
            disabled={saving}
          >
            {isEditing ? (
              <>Cancel Edit <FaPencilAlt /></>
            ) : (
              <>Edit Profile <FaPencilAlt /></>
            )}
          </button>
        </div>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-group">
            <label>
              <FaUser className="form-icon" />
              Display Name
            </label>
            <input
              type="text"
              name="displayName"
              value={profile.displayName}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder="Your display name"
              required
            />
          </div>

          <div className="form-group">
            <label>
              <FaBirthdayCake className="form-icon" />
              Age
            </label>
            <input
              type="number"
              name="age"
              value={profile.age}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder="Your age"
              min="0"
              max="150"
            />
          </div>

          <div className="form-group">
            <label>
              <FaBirthdayCake className="form-icon" />
              Date of Birth
            </label>
            <input
              type="date"
              name="dateOfBirth"
              value={profile.dateOfBirth}
              onChange={handleChange}
              disabled={!isEditing || saving}
            />
          </div>

          <div className="form-group">
            <label>
              {profile.sex === 'Female' ? 
                <FaVenus className="form-icon" /> : 
                <FaMars className="form-icon" />}
              Sex
            </label>
            <select
              name="sex"
              value={profile.sex}
              onChange={handleChange}
              disabled={!isEditing || saving}
            >
              <option value="">Select...</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="form-group">
            <label>
              <FaUser className="form-icon" />
              Bio
            </label>
            <textarea
              name="bio"
              value={profile.bio}
              onChange={handleChange}
              disabled={!isEditing || saving}
              placeholder="Tell us about yourself..."
              rows="4"
            />
          </div>

          {isEditing && (
            <button 
              type="submit" 
              className="save-button"
              disabled={saving}
            >
              {saving ? (
                'Saving...'
              ) : (
                <>
                  Save Changes <FaSave />
                </>
              )}
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
