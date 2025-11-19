import { useState, useCallback, useRef } from 'react';

// Performance monitoring hooks for chess operations
export const useChessPerformance = () => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    moveCalculationTime: 0,
    renderTime: 0,
    totalOperations: 0
  });

  const startTime = useRef<number>(0);

  const startTiming = useCallback(() => {
    startTime.current = performance.now();
  }, []);

  const endTiming = useCallback((operation: string) => {
    const endTime = performance.now();
    const duration = endTime - startTime.current;
    
    setPerformanceMetrics(prev => ({
      ...prev,
      [operation]: duration,
      totalOperations: prev.totalOperations + 1
    }));
    
    return duration;
  }, []);

  return {
    performanceMetrics,
    startTiming,
    endTiming
  };
};

export const useMoveCalculationPerformance = () => {
  const [moveCalculationTime, setMoveCalculationTime] = useState(0);
  
  const measureMoveCalculation = useCallback(async (calculationFn: () => Promise<any>) => {
    const start = performance.now();
    const result = await calculationFn();
    const end = performance.now();
    
    setMoveCalculationTime(end - start);
    return result;
  }, []);

  return {
    moveCalculationTime,
    measureMoveCalculation
  };
};

export const useDebouncedOperation = <T>(
  operation: (value: T) => void,
  delay: number = 300
) => {
  const timeoutRef = useRef<NodeJS.Timeout>();

  const debouncedOperation = useCallback((value: T) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      operation(value);
    }, delay);
  }, [operation, delay]);

  return debouncedOperation;
};
