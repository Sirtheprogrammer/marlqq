import React from 'react';
import { signInWithGoogle } from '../firebase';
import './Login.css';

const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Login error:', error);
      // You could add a toast notification here
    }
  };

  return (
    <div className="login-container glass-card">
      <div className="login-content">
        <h1>Welcome to Marqueelz</h1>
        <p>Please sign in to continue 💖</p>
        <button onClick={handleLogin} className="google-sign-in-btn">
          <img src="https://upload.wikimedia.org/wikipedia/commons/5/53/Google_%22G%22_Logo.svg" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
};

export default Login;
