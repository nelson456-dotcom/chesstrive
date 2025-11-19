const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getAuthToken();
  
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'x-auth-token': token }),
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
  }

  return await response.json();
};

// Stripe API
export const stripeService = {
  // Create a checkout session
  async createCheckoutSession(plan, billingPeriod) {
    return apiRequest('/stripe/create-checkout-session', {
      method: 'POST',
      body: JSON.stringify({ plan, billingPeriod }),
    });
  },

  // Get subscription status
  async getSubscriptionStatus() {
    return apiRequest('/stripe/subscription-status');
  },

  // Cancel subscription
  async cancelSubscription() {
    return apiRequest('/stripe/cancel-subscription', {
      method: 'POST',
    });
  },

  // Reactivate subscription
  async reactivateSubscription() {
    return apiRequest('/stripe/reactivate-subscription', {
      method: 'POST',
    });
  },

  // Create customer portal session
  async createPortalSession() {
    return apiRequest('/stripe/create-portal-session', {
      method: 'POST',
    });
  },
};

