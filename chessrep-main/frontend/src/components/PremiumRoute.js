import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import UpgradeBanner from './UpgradeBanner';

/**
 * Protected route that requires premium subscription
 * Shows upgrade banner for free users, allows access for premium users
 */
const PremiumRoute = ({ children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/" />;
  }

  if (user.userType !== 'premium') {
    return (
      <div className="min-h-screen bg-gray-900">
        <UpgradeBanner 
          title="Premium Feature"
          message="This feature is available for premium members only."
          showFullPage={true}
        />
      </div>
    );
  }

  return children;
};

export default PremiumRoute;



