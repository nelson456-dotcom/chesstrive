// Centralized API configuration
// Uses environment variables for different environments

const getApiBaseUrl = () => {
  // Check for environment variable first (for production)
  if (process.env.REACT_APP_API_URL) {
    const envUrl = process.env.REACT_APP_API_URL;
    // If it already ends with /api, return as is
    // If it's a full URL, append /api
    // If it's just /api, return as is
    if (envUrl.endsWith('/api')) {
      return envUrl;
    } else if (envUrl.startsWith('http://') || envUrl.startsWith('https://')) {
      // Full URL - append /api if not present
      return `${envUrl.replace(/\/$/, '')}/api`;
    } else {
      // Relative path - ensure it starts with / and ends with /api
      const cleanPath = envUrl.startsWith('/') ? envUrl : `/${envUrl}`;
      return cleanPath.endsWith('/api') ? cleanPath : `${cleanPath}/api`;
    }
  }
  
  // In development, use relative URL to go through the proxy (setupProxy.js)
  // This ensures requests go through the React dev server proxy
  // In production, also use relative URL (proxied by nginx or similar)
  return '/api';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper to get full API endpoint URL
export const getApiUrl = (endpoint) => {
  // Remove leading slash if present to avoid double slashes
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;
  const url = `${API_BASE_URL}/${cleanEndpoint}`;
  
  // Debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[API Config] getApiUrl:', {
      endpoint,
      cleanEndpoint,
      API_BASE_URL,
      result: url
    });
  }
  
  return url;
};

// Helper to get auth token
export const getAuthToken = () => {
  return localStorage.getItem('token');
};

// Helper to create authenticated fetch options
export const getAuthHeaders = (additionalHeaders = {}) => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 
      'x-auth-token': token,
      Authorization: `Bearer ${token}` 
    }),
    ...additionalHeaders
  };
};

export default {
  API_BASE_URL,
  getApiUrl,
  getAuthToken,
  getAuthHeaders
};

