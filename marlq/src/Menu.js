import React, { useState, useEffect } from "react";
import { FaHeart, FaImages, FaRobot, FaSignOutAlt, FaUserCog, FaInfoCircle } from "react-icons/fa";
import { db } from './firebase';
import { doc, getDoc } from 'firebase/firestore';
import "./menu.css";

const menuItems = [
  {
    id: 'home',
    icon: FaHeart,
    title: 'Home',
    description: 'Your daily dose of love, affirmations, and AI-generated compliments'
  },
  {
    id: 'gallery',
    icon: FaImages,
    title: 'Gallery',
    description: 'Share and cherish your precious memories'
  },
  {
    id: 'ai',
    icon: FaRobot,
    title: 'AI Chat',
    description: 'Chat with your personal AI friend who remembers your conversations'
  },
  {
    id: 'profile',
    icon: FaUserCog,
    title: 'Profile',
    description: 'Customize your profile and track your daily login streak'
  }
];

export default function Menu({ currentPage, setCurrentPage, onSignOut, user }) {
  const [profile, setProfile] = useState(null);
  const [showTooltip, setShowTooltip] = useState(null);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const profileRef = doc(db, 'userProfiles', user.uid);
        const profileSnap = await getDoc(profileRef);
        if (profileSnap.exists()) {
          setProfile(profileSnap.data());
        }
      } catch (err) {
        console.error('Failed to load profile:', err);
      }
    };

    if (user) {
      loadProfile();
    }
  }, [user]);

  return (
    <nav className="glass-card sidebar-menu d-flex flex-md-column flex-row align-items-center justify-content-center p-2 mb-4">
      <div className="menu-items">
        {menuItems.map((item) => (
          <div 
            key={item.id}
            className="menu-item-wrapper"
            onMouseEnter={() => setShowTooltip(item.id)}
            onMouseLeave={() => setShowTooltip(null)}
          >
            <button
              className={`menu-btn ${currentPage === item.id ? "active" : ""}`}
              onClick={() => setCurrentPage(item.id)}
              aria-label={item.title}
            >
              <item.icon size={24} />
              <span className="menu-label">{item.title}</span>
            </button>
            {showTooltip === item.id && (
              <div className="menu-tooltip">
                <FaInfoCircle className="tooltip-icon" />
                {item.description}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="user-profile">
        <div className="user-info">
          <div
            className="user-avatar"
            style={{
              backgroundColor: '#ff69b4',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontSize: '1.2rem',
              fontWeight: 'bold',
            }}
          >
            {profile?.displayName?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase()}
          </div>
          <span className="user-name">
            {profile?.displayName || user?.email?.split('@')[0]}
          </span>
        </div>
        <button className="sign-out-button" onClick={onSignOut}>
          <FaSignOutAlt /> <span className="sign-out-text">Sign Out</span>
        </button>
      </div>
    </nav>
  );
}
