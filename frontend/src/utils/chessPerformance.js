// Chess Board Performance Monitoring Utilities

export const performanceMonitor = {
  // Measure render performance
  measureRender: (componentName, renderFn) => {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    const duration = end - start;
    
    if (duration > 16) { // More than one frame (60fps)
      console.warn(`🐌 ${componentName} render took ${duration.toFixed(2)}ms`);
    } else if (duration > 8) {
      console.log(`⚡ ${componentName} render took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },

  // Measure move performance
  measureMove: (moveFn) => {
    const start = performance.now();
    const result = moveFn();
    const end = performance.now();
    
    const duration = end - start;
    
    if (duration > 5) { // Move should be very fast
      console.warn(`🐌 Move processing took ${duration.toFixed(2)}ms`);
    } else if (duration > 2) {
      console.log(`⚡ Move processing took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },

  // Measure animation performance
  measureAnimation: (animationFn) => {
    const start = performance.now();
    const result = animationFn();
    const end = performance.now();
    
    const duration = end - start;
    
    if (duration > 100) { // Animation should be fast
      console.warn(`🐌 Animation took ${duration.toFixed(2)}ms`);
    } else {
      console.log(`⚡ Animation took ${duration.toFixed(2)}ms`);
    }
    
    return result;
  },

  // Get performance metrics
  getMetrics: () => {
    if (typeof performance !== 'undefined' && performance.memory) {
      return {
        usedJSHeapSize: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024) + 'MB',
        totalJSHeapSize: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024) + 'MB',
        jsHeapSizeLimit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      };
    }
    return null;
  },

  // Log performance summary
  logSummary: (componentName) => {
    const metrics = performanceMonitor.getMetrics();
    if (metrics) {
      console.log(`📊 ${componentName} Performance Summary:`, metrics);
    }
  }
};

// Performance optimization utilities
export const optimizationUtils = {
  // Debounce function for frequent calls
  debounce: (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Throttle function for frequent calls
  throttle: (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
      if (!inThrottle) {
        func.apply(this, args);
        inThrottle = true;
        setTimeout(() => inThrottle = false, limit);
      }
    };
  },

  // Memoize expensive calculations
  memoize: (fn) => {
    const cache = new Map();
    return function memoizedFunction(...args) {
      const key = JSON.stringify(args);
      if (cache.has(key)) {
        return cache.get(key);
      }
      const result = fn.apply(this, args);
      cache.set(key, result);
      return result;
    };
  }
};

// CSS performance utilities
export const cssOptimizations = {
  // Add performance classes to element
  addPerformanceClasses: (element) => {
    if (element) {
      element.classList.add('smooth-board');
      element.style.transform = 'translateZ(0)';
      element.style.willChange = 'transform';
      element.style.backfaceVisibility = 'hidden';
    }
  },

  // Remove performance classes
  removePerformanceClasses: (element) => {
    if (element) {
      element.classList.remove('smooth-board');
      element.style.transform = '';
      element.style.willChange = '';
      element.style.backfaceVisibility = '';
    }
  }
};

export default {
  performanceMonitor,
  optimizationUtils,
  cssOptimizations
};
