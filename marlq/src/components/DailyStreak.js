import React, { useState, useEffect, useCallback } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaTrophy, FaFire, FaGift } from 'react-icons/fa';
import './DailyStreak.css';

const DailyStreak = () => {
  const { user } = useAuth();
  const [streak, setStreak] = useState(0);
  const [showReward, setShowReward] = useState(false);
  const [voucher, setVoucher] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [daysUntilReward, setDaysUntilReward] = useState(7);

  const checkForVoucher = useCallback(async (currentStreak) => {
    try {
      const voucherRef = doc(db, 'sirtheprogrammer/vouchers');
      const voucherDoc = await getDoc(voucherRef);
      
      if (voucherDoc.exists()) {
        const vouchers = voucherDoc.data().available || [];
        if (vouchers.length > 0) {
          const [newVoucher, ...remainingVouchers] = vouchers;
          
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
  }, [user?.uid]);

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
          
          let newStreak = data.streak;
          if (diffDays === 1) {
            // Consecutive day
            newStreak = data.streak + 1;
            await updateDoc(streakRef, {
              streak: newStreak,
              lastLoginDate: today
            });
            
            // Check if reached 7 days
            if (newStreak % 7 === 0) {
              checkForVoucher(newStreak);
            }
          } else if (diffDays === 0) {
            // Same day login
            newStreak = data.streak;
          } else {
            // Streak broken
            newStreak = 1;
            await updateDoc(streakRef, {
              streak: 1,
              lastLoginDate: today
            });
          }
          setStreak(newStreak);
          setDaysUntilReward(7 - (newStreak % 7));
        } else {
          // First time login
          await setDoc(streakRef, {
            streak: 1,
            lastLoginDate: today
          });
          setStreak(1);
          setDaysUntilReward(6);
        }
      } catch (error) {
        console.error('Error loading streak:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadStreak();
    }
  }, [user, checkForVoucher]);

  if (isLoading) return null;

  return (
    <>
      <div className="streak-container glass-card">
        <div className="streak-title">
          <FaFire className="streak-icon" />
          Daily Streak
        </div>
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
                title={`Day ${i + 1}`}
              />
            ))}
          </div>
          <div className="progress-label">
            {daysUntilReward} {daysUntilReward === 1 ? 'day' : 'days'} until reward
          </div>
        </div>
      </div>

      {showReward && (
        <div className="reward-popup">
          <FaTrophy className="trophy-icon" />
          <h2>Congratulations!</h2>
          <p>You've maintained a {streak} day streak!</p>
          {voucher && (
            <div className="voucher-container">
              <FaGift className="gift-icon" />
              <p>You've earned a special voucher:</p>
              <h3>{voucher}</h3>
            </div>
          )}
          <button
            className="btn btn-primary"
            onClick={() => setShowReward(false)}
          >
            Close
          </button>
        </div>
      )}
    </>
  );
};

export default DailyStreak;
