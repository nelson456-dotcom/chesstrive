import React from 'react';
import { getIconById } from './ProfileIconSelector';

const ProfileIcon = ({ iconId = 'user', size = 'md', className = '' }) => {
  const iconData = getIconById(iconId);
  const IconComponent = iconData.icon;

  const sizeClasses = {
    xs: 'w-6 h-6',
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  const iconSizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8'
  };

  return (
    <div 
      className={`${sizeClasses[size]} bg-gradient-to-br ${iconData.color} rounded-full flex items-center justify-center ${className}`}
      title={iconData.name}
    >
      <IconComponent className={`${iconSizeClasses[size]} text-white`} />
    </div>
  );
};

export default ProfileIcon;











