import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { useUser } from '../context/UserContext';
import './SubscriptionModal.css';

export function SubscriptionModal({ isOpen, onClose, promptsUsed = 5 }) {
  const { purchaseSubscription } = useUser();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);

  useEffect(() => {
    if (isOpen) {
      setPlans([
        {
          id: 'starter',
          name: 'Starter',
          price: 99,
          prompts: 25,
          duration: '1 month',
          features: ['25 prompts per month', 'Basic support', 'Save your favorites'],
          popular: false
        },
        {
          id: 'pro',
          name: 'Pro',
          price: 299,
          prompts: 100,
          duration: '6 months',
          features: ['100 prompts per month', 'Priority support', 'Save 50% vs monthly', 'Early access to new prompts'],
          popular: true
        },
        {
          id: 'premium',
          name: 'Premium',
          price: 799,
          prompts: 400,
          duration: '1 year',
          features: ['400 prompts per month', 'VIP support', 'Save 73% vs monthly', 'Lifetime access to new prompts'],
          popular: false
        }
      ]);
    }
  }, [isOpen]);

  const handlePurchase = async (planId) => {
    setLoading(true);
    setSelectedPlan(planId);
    
    const loadingToast = toast.loading('Opening payment window...');
    
    try {
      const result = await purchaseSubscription(planId);
      
      toast.dismiss(loadingToast);
      
      if (result && result.success) {
        toast.success(`✅ ${result.data.message || 'Payment successful!'}`);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (error) {
      toast.dismiss(loadingToast);
      
      const errorMsg = typeof error === 'string' ? error : error?.message || 'Payment failed. Please try again.';
      
      if (errorMsg.includes('cancelled')) {
        toast.error('Payment cancelled. Please try again.');
      } else if (errorMsg.includes('Invalid plan')) {
        toast.error('Invalid plan selected. Please refresh and try again.');
      } else {
        toast.error(`❌ ${errorMsg}`);
      }
      
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
      setSelectedPlan(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="subscription-modal-overlay" onClick={onClose}>
      <div className="subscription-modal" onClick={e => e.stopPropagation()}>
        <button className="close-btn" onClick={onClose}>×</button>

        <div className="modal-header">
          <h2>🚀 Unlock More Prompts!</h2>
          <p>You've used your {promptsUsed} free prompts. Choose a plan to continue exploring!</p>
          <div className="free-prompts-badge">
            <span>✨ Free Tier: {promptsUsed} prompts</span>
          </div>
        </div>

        <div className="plans-container">
          {plans.map(plan => (
            <div 
              key={plan.id} 
              className={`plan-card ${plan.popular ? 'popular' : ''}`}
            >
              {plan.popular && <div className="popular-badge">🌟 Most Popular</div>}
              
              <h3>{plan.name}</h3>
              
              <div className="price-section">
                <div className="price">
                  <span className="currency">₹</span>
                  <span className="amount">{plan.price}</span>
                </div>
                <span className="period">{plan.duration}</span>
              </div>

              <div className="prompts-limit">
                <span className="limit-label">📊 {plan.prompts} Prompts Included</span>
                <span className="monthly">{Math.ceil(plan.prompts / (plan.duration.includes('year') ? 12 : plan.duration.includes('6') ? 6 : 1))} per month</span>
              </div>

              <ul className="features">
                {plan.features.map((feature, idx) => (
                  <li key={idx}>
                    <span className="checkmark">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                className={`subscribe-btn ${selectedPlan === plan.id ? 'loading' : ''}`}
                onClick={() => handlePurchase(plan.id)}
                disabled={loading}
              >
                {loading && selectedPlan === plan.id 
                  ? 'Processing...' 
                  : `Subscribe - ₹${plan.price}`
                }
              </button>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <p>💳 Secure payment gateway</p>
          <p className="note">Money-back guarantee if not satisfied</p>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionModal;
