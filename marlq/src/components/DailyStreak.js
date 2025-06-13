import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaFire, FaGift } from 'react-icons/fa';
import './DailyStreak.css';

const DailyStreak = ({ onClose }) => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [lastLoginDate, setLastLoginDate] = useState(null);
  const [showReward, setShowReward] = useState(false);
  const [voucher, setVoucher] = useState(null);

  useEffect(() => {
    const loadStreak = async () => {
      try {
        const streakRef = doc(db, 'userStreaks', user.uid);
        const streakDoc = await getDoc(streakRef);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (streakDoc.exists()) {
          const data = streakDoc.data();
          const lastLogin = data.lastLoginDate.toDate();
          lastLogin.setHours(0, 0, 0, 0);
          
          const diffDays = Math.floor((today - lastLogin) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            // Consecutive day
            await updateDoc(streakRef, {
              streak: data.streak + 1,
              lastLoginDate: today
            });
            setStreak(data.streak + 1);
            
            // Check if reached 7 days
            if ((data.streak + 1) % 7 === 0) {
              checkForVoucher(data.streak + 1);
            }
          } else if (diffDays === 0) {
            // Same day login
            setStreak(data.streak);
          } else {
            // Streak broken
            await updateDoc(streakRef, {
              streak: 1,
              lastLoginDate: today
            });
            setStreak(1);
          }
          setLastLoginDate(today);
        } else {
          // First time login
          await setDoc(streakRef, {
            streak: 1,
            lastLoginDate: today
          });
          setStreak(1);
          setLastLoginDate(today);
        }
      } catch (error) {
        console.error('Error loading streak:', error);
      }
    };

    if (user) {
      loadStreak();
    }
  }, [user]);

  const checkForVoucher = async (currentStreak) => {
    try {
      // Check the secret path for vouchers
      const voucherRef = doc(db, 'sirtheprogrammer/vouchers');
      const voucherDoc = await getDoc(voucherRef);
      
      if (voucherDoc.exists()) {
        const vouchers = voucherDoc.data().available || [];
        if (vouchers.length > 0) {
          // Get the first available voucher
          const [newVoucher, ...remainingVouchers] = vouchers;
          
          // Update the vouchers list
          await updateDoc(voucherRef, {
            available: remainingVouchers,
            claimed: [...(voucherDoc.data().claimed || []), {
              voucher: newVoucher,
              claimedBy: user.uid,
              claimedAt: new Date(),
              streak: currentStreak
            }]
          });
          
          setVoucher(newVoucher);
          setShowReward(true);
        }
      }
    } catch (error) {
      console.error('Error checking voucher:', error);
    }
  };

  return (
    <div className="streak-container glass-card">
      <h3 className="streak-title">
        <FaFire className="streak-icon" /> Daily Streak
      </h3>
      
      <div className="streak-count">
        <span className="streak-number">{streak}</span>
        <span className="streak-text">days</span>
      </div>

      <div className="streak-progress">
        <div className="progress-bar">
          {[...Array(7)].map((_, i) => (
            <div 
              key={i} 
              className={`progress-day ${i < (streak % 7) ? 'active' : ''}`}
            />
          ))}
        </div>
        <div className="progress-label">
          {7 - (streak % 7)} days until next reward
        </div>
      </div>

      {showReward && voucher && (
        <div className="reward-popup">
          <FaTrophy className="trophy-icon" />
          <h4>Congratulations! 🎉</h4>
          <p>You've maintained a {streak} day streak!</p>
          <div className="voucher-container">
            <FaGift className="gift-icon" />
            <p>Here's your Halottel voucher:</p>
            <div className="voucher-code">{voucher}</div>
          </div>
          <button className="close-button" onClick={() => setShowReward(false)}>
            Claim Reward
          </button>
        </div>
      )}
    </div>
  );
};

export default DailyStreak;
