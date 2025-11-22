import { getApiUrl, getAuthHeaders } from '../config/api';

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const config = {
    headers: {
      ...getAuthHeaders(),
      ...options.headers,
    },
    credentials: 'include', // Include cookies for CORS
    ...options,
  };

  const response = await fetch(getApiUrl(endpoint), config);
  
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

