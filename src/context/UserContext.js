import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const getApiBase = () => {
  if (process.env.REACT_APP_API_URL) return process.env.REACT_APP_API_URL;

  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:5001/api';
    if (host.includes('vercel.app')) return 'https://prompt-craftery-backend.vercel.app/api';
  }

  return 'http://localhost:5001/api';
};

const API_BASE = getApiBase();
console.log('Frontend API_BASE:', API_BASE);
if (!process.env.REACT_APP_API_URL && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
  console.warn('Frontend using runtime API fallback', { API_BASE, hostname: window.location.hostname });
}

const UserContext = createContext();

export function UserProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  const api = axios.create({
    baseURL: API_BASE,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Add token to all requests
  api.interceptors.request.use(config => {
    const t = localStorage.getItem('pv_token');
    if (t) {
      config.headers.Authorization = `Bearer ${t}`;
    }
    return config;
  });

  // Check if user is logged in on mount
  useEffect(() => {
    const t = localStorage.getItem('pv_token');
    if (t) {
      setToken(t);
      fetchCurrentUser(t);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken) => {
    try {
      const config = { headers: { Authorization: `Bearer ${authToken}` } };
      const res = await axios.get(`${API_BASE}/users/me`, config);
      setUser(res.data.user);
    } catch (error) {
      localStorage.removeItem('pv_token');
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (name, email, password) => {
    if (API_BASE.includes('localhost') && typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
      throw new Error('Frontend API URL not configured. Set REACT_APP_API_URL to your deployed backend.');
    }

    try {
      const res = await api.post('/users/register', { name, email, password });
      localStorage.setItem('pv_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  };

  const login = async (email, password) => {
    try {
      const res = await api.post('/users/login', { email, password });
      localStorage.setItem('pv_token', res.data.token);
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  };

  const logout = () => {
    localStorage.removeItem('pv_token');
    setToken(null);
    setUser(null);
  };

  const incrementPromptUsage = async () => {
    try {
      const res = await api.post('/users/increment-usage');
      if (res.data.canAccess) {
        setUser(prev => ({
          ...prev,
          promptsUsed: res.data.promptsUsed
        }));
        return { success: true, data: res.data };
      } else {
        return { success: false, error: res.data.error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || error.message 
      };
    }
  };

  const purchaseSubscription = async (planId) => {
    try {
      // Step 1: Create Razorpay Order
      const orderRes = await api.post('/subscription/create-order', { planId });
      
      if (!orderRes.data.success) {
        const errorMsg = orderRes.data.details || orderRes.data.error || 'Failed to create order';
        throw new Error(errorMsg);
      }

      const orderId = orderRes.data.orderId;
      const publicKey = process.env.REACT_APP_RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!publicKey) {
        throw new Error('Razorpay key not configured');
      }

      // Step 2: Open Razorpay Payment Window
      return new Promise((resolve, reject) => {
        const options = {
          key: publicKey,
          order_id: orderId,
          amount: orderRes.data.amount * 100, // Amount in paise
          currency: 'INR',
          name: 'PromptVault',
          description: `${orderRes.data.planName} Plan - ₹${orderRes.data.amount}`,
          handler: async (response) => {
            try {
              // Step 3: Verify Payment
              const verifyRes = await api.post('/subscription/verify-payment', {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: planId
              });

              if (verifyRes.data.success) {
                setUser(prev => ({
                  ...prev,
                  subscription: verifyRes.data.subscription,
                  promptsLimit: verifyRes.data.promptsLimit,
                  promptsUsed: 0
                }));
                resolve({ success: true, data: verifyRes.data });
              }
            } catch (error) {
              reject(error.response?.data?.error || error.message);
            }
          },
          prefill: {
            email: user?.email || '',
            name: user?.name || ''
          },
          theme: {
            color: '#667eea'
          },
          modal: {
            ondismiss: () => {
              reject('Payment cancelled by user');
            }
          }
        };

        const RazorpayWindow = window.Razorpay;
        if (!RazorpayWindow) {
          // Load Razorpay script if not already loaded
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.async = true;
          script.onload = () => {
            const razorpay = new window.Razorpay(options);
            razorpay.open();
          };
          script.onerror = () => {
            reject('Failed to load Razorpay payment gateway');
          };
          document.head.appendChild(script);
        } else {
          const razorpay = new RazorpayWindow(options);
          razorpay.open();
        }
      });
    } catch (error) {
      console.error('Payment error:', error);
      throw error.message || error;
    }
  };

  const cancelSubscription = async () => {
    try {
      const res = await api.post('/subscription/cancel');
      setUser(prev => ({
        ...prev,
        subscription: res.data.subscription
      }));
      return { success: true, data: res.data };
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  };

  const getSubscriptionStatus = async () => {
    try {
      const res = await api.get('/subscription/status');
      return res.data;
    } catch (error) {
      throw error.response?.data?.error || error.message;
    }
  };

  return (
    <UserContext.Provider value={{
      user,
      loading,
      token,
      login,
      register,
      logout,
      incrementPromptUsage,
      purchaseSubscription,
      cancelSubscription,
      getSubscriptionStatus,
      api
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};
