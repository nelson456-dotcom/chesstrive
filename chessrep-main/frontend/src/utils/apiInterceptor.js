// Global API interceptor to handle token errors gracefully
let authContext = null;
let isHandlingTokenError = false;

export const setAuthContext = (context) => {
  authContext = context;
};

// Store original fetch before we override it
const originalFetch = window.fetch;

// Intercept fetch requests to handle 401 errors
window.fetch = async function(...args) {
  try {
    const response = await originalFetch(...args);
    
    // Handle 401 unauthorized errors
    if (response.status === 401 && !isHandlingTokenError) {
      // Clone the response so we can read it multiple times
      const clonedResponse = response.clone();
      const data = await clonedResponse.json().catch(() => ({}));
      
      // If token is invalid/expired, clear it silently
      if (data.code === 'TOKEN_INVALID' || 
          data.code === 'TOKEN_EXPIRED' || 
          data.message?.toLowerCase().includes('token')) {
        
        // Prevent multiple handlers from running
        if (isHandlingTokenError) {
          return response;
        }
        
        isHandlingTokenError = true;
        
        // Clear invalid token silently
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        
        // Clear user state if auth context is available
        if (authContext?.logout) {
          authContext.logout();
        }
        
        // Only redirect if user is not already on login/signup pages
        const currentPath = window.location.pathname;
        const isAuthPage = currentPath === '/login' || 
                          currentPath === '/signup' || 
                          currentPath.startsWith('/login') ||
                          currentPath.startsWith('/signup');
        
        // Silent logout - don't show error, just redirect if needed
        if (!isAuthPage && currentPath !== '/') {
          // Use a small delay to avoid race conditions
          setTimeout(() => {
            isHandlingTokenError = false;
            window.location.href = '/login';
          }, 100);
        } else {
          // Reset flag if we're not redirecting
          setTimeout(() => {
            isHandlingTokenError = false;
          }, 1000);
        }
      }
    }
    
    return response;
  } catch (error) {
    // If fetch itself fails, re-throw the error
    throw error;
  }
};

