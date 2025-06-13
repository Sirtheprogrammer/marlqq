import React, { useState, useEffect } from "react";
import { FaHeart, FaImages, FaRobot, FaSignOutAlt, FaUserCog, FaBars } from "react-icons/fa";
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
  const [showMenu, setShowMenu] = useState(false);

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
    <div className="dropdown-menu-container">
      <button className="menu-toggle" onClick={() => setShowMenu(!showMenu)}>
        <FaBars size={28} />
      </button>

      {showMenu && (
        <div className="menu-dropdown glass-card">
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
                {profile?.displayName || user?.email}
              </span>
            </div>
          </div>

          <div className="menu-items-dropdown">
            {menuItems.map((item) => (
              <button
                key={item.id}
                className={`menu-item ${currentPage === item.id ? "active" : ""}`}
                onClick={() => {
                  setCurrentPage(item.id);
                  setShowMenu(false);
                }}
              >
                <item.icon size={28} />
                <div className="menu-content">
                  <span className="menu-label">{item.title}</span>
                  <div className="menu-description">{item.description}</div>
                </div>
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              setShowMenu(false);
              onSignOut();
            }}
            className="sign-out-button"
          >
            <FaSignOutAlt size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
}
