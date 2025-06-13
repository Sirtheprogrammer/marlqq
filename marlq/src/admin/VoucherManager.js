import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useAuth } from '../context/AuthContext';
import { FaArrowLeft, FaPlus, FaTrash, FaGift } from 'react-icons/fa';
import './VoucherManager.css';

const ADMIN_UID = "r5d8OhdgoLfJoIx43gsBpuCcty82"; // Replace with your Firebase UID

const VoucherManager = () => {
  const { user } = useAuth(); // We need user for authentication check
  const [vouchers, setVouchers] = useState({ available: [], claimed: [] });
  const [newVoucher, setNewVoucher] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('available');

  useEffect(() => {
    // Check if user is admin before loading vouchers
    if (!user || user.uid !== ADMIN_UID) {
      setError('Unauthorized access');
      setLoading(false);
      return;
    }
    loadVouchers();
  }, [user]); // Add user as dependency

  const loadVouchers = async () => {
    try {
      const voucherRef = doc(db, 'sirtheprogrammer/vouchers');
      const voucherDoc = await getDoc(voucherRef);
      
      if (voucherDoc.exists()) {
        setVouchers(voucherDoc.data());
      } else {
        // Initialize if doesn't exist
        await setDoc(voucherRef, { available: [], claimed: [] });
      }
    } catch (err) {
      setError('Failed to load vouchers');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const addVoucher = async () => {
    if (!newVoucher.trim()) {
      setError('Please enter a voucher code');
      return;
    }

    try {
      const voucherRef = doc(db, 'sirtheprogrammer/vouchers');
      const updatedVouchers = {
        ...vouchers,
        available: [...vouchers.available, newVoucher.trim()]
      };
      
      await setDoc(voucherRef, updatedVouchers);
      setVouchers(updatedVouchers);
      setNewVoucher('');
      setSuccess('Voucher added successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to add voucher');
      console.error(err);
    }
  };

  const removeVoucher = async (index) => {
    try {
      const voucherRef = doc(db, 'sirtheprogrammer/vouchers');
      const updatedAvailable = vouchers.available.filter((_, i) => i !== index);
      const updatedVouchers = {
        ...vouchers,
        available: updatedAvailable
      };
      
      await setDoc(voucherRef, updatedVouchers);
      setVouchers(updatedVouchers);
      setSuccess('Voucher removed successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove voucher');
      console.error(err);
    }
  };

  const handleBack = () => {
    window.history.pushState({}, '', '/');
    window.location.reload();
  };

  if (loading) {
    return (
      <div className="admin-container">
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }

  return (
    <div className="admin-container">
      <div className="admin-header">
        <button onClick={handleBack} className="back-btn">
          <FaArrowLeft /> Back to App
        </button>
        <h2>Voucher Manager</h2>
      </div>

      <p className="admin-note">⚠️ Keep this URL private - only for admin use!</p>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}

      <div className="add-voucher-section">
        <h3>Add New Voucher</h3>
        <div className="input-group">
          <input
            type="text"
            value={newVoucher}
            onChange={(e) => setNewVoucher(e.target.value)}
            placeholder="Enter Halottel voucher code"
            className="voucher-input"
          />
          <button onClick={addVoucher} className="add-btn">
            <FaPlus /> Add Voucher
          </button>
        </div>
      </div>

      <div className="tabs">
        <button
          className={`tab-btn ${activeTab === 'available' ? 'active' : ''}`}
          onClick={() => setActiveTab('available')}
        >
          Available ({vouchers.available.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'claimed' ? 'active' : ''}`}
          onClick={() => setActiveTab('claimed')}
        >
          Claimed ({vouchers.claimed.length})
        </button>
      </div>

      {activeTab === 'available' && (
        <div className="voucher-list">
          <h3>Available Vouchers</h3>
          {vouchers.available.length === 0 ? (
            <div className="empty-state">No vouchers available</div>
          ) : (
            vouchers.available.map((voucher, index) => (
              <div key={index} className="voucher-item">
                <div className="voucher-code">
                  <FaGift className="voucher-icon" /> {voucher}
                </div>
                <button
                  onClick={() => removeVoucher(index)}
                  className="remove-btn"
                >
                  <FaTrash /> Remove
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'claimed' && (
        <div className="claimed-list">
          <h3>Claimed Vouchers</h3>
          {vouchers.claimed.length === 0 ? (
            <div className="empty-state">No vouchers claimed yet</div>
          ) : (
            vouchers.claimed.map((claim, index) => (
              <div key={index} className="claimed-item">
                <div className="claimed-header">
                  <FaGift className="voucher-icon" />
                  <span className="voucher-code">{claim.voucher}</span>
                </div>
                <div className="claimed-details">
                  <div>Claimed by: {claim.claimedBy}</div>
                  <div>Date: {new Date(claim.claimedAt?.seconds * 1000).toLocaleDateString()}</div>
                  <div>Streak: {claim.streak} days</div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default VoucherManager;
