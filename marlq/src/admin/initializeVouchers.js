import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

// Your Firebase config
const firebaseConfig = {
  // Copy your config from Firebase Console
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to initialize vouchers
async function initializeVouchers() {
  try {
    await setDoc(doc(db, 'sirtheprogrammer', 'vouchers'), {
      available: [],  // Add initial vouchers here if you want
      claimed: []
    });
    console.log('Vouchers collection initialized successfully!');
  } catch (error) {
    console.error('Error initializing vouchers:', error);
  }
}

// Function to add a voucher
async function addVoucher(voucherCode) {
  try {
    const voucherRef = doc(db, 'sirtheprogrammer', 'vouchers');
    const voucherDoc = await getDoc(voucherRef);
    
    if (voucherDoc.exists()) {
      const currentVouchers = voucherDoc.data();
      await setDoc(voucherRef, {
        ...currentVouchers,
        available: [...currentVouchers.available, voucherCode]
      });
      console.log('Voucher added successfully!');
    } else {
      // Initialize with first voucher
      await setDoc(voucherRef, {
        available: [voucherCode],
        claimed: []
      });
      console.log('Vouchers collection created and voucher added!');
    }
  } catch (error) {
    console.error('Error adding voucher:', error);
  }
}

// Example usage:
// initializeVouchers();
// addVoucher('HALOTTEL-XXXX-YYYY-ZZZZ');
