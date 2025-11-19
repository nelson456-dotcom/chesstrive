import React from 'react';
import {
  User,
  Crown,
  Zap,
  Star,
  Trophy,
  Target,
  Flame,
  Heart,
  Shield,
  Swords,
  Sparkles,
  Award,
  Gem,
  Rocket,
  Brain,
  Eye,
  Skull,
  Ghost,
  Smile,
  Coffee
} from 'lucide-react';

// 20 different profile icons
export const PROFILE_ICONS = [
  { id: 'user', icon: User, name: 'User', color: 'from-gray-500 to-gray-600' },
  { id: 'crown', icon: Crown, name: 'Crown', color: 'from-yellow-500 to-yellow-600' },
  { id: 'zap', icon: Zap, name: 'Lightning', color: 'from-yellow-400 to-orange-500' },
  { id: 'star', icon: Star, name: 'Star', color: 'from-yellow-300 to-yellow-500' },
  { id: 'trophy', icon: Trophy, name: 'Trophy', color: 'from-amber-500 to-yellow-600' },
  { id: 'target', icon: Target, name: 'Target', color: 'from-red-500 to-red-600' },
  { id: 'flame', icon: Flame, name: 'Flame', color: 'from-orange-500 to-red-600' },
  { id: 'heart', icon: Heart, name: 'Heart', color: 'from-pink-500 to-red-500' },
  { id: 'shield', icon: Shield, name: 'Shield', color: 'from-blue-500 to-blue-600' },
  { id: 'swords', icon: Swords, name: 'Swords', color: 'from-gray-600 to-gray-700' },
  { id: 'sparkles', icon: Sparkles, name: 'Sparkles', color: 'from-purple-400 to-pink-500' },
  { id: 'award', icon: Award, name: 'Award', color: 'from-indigo-500 to-purple-600' },
  { id: 'gem', icon: Gem, name: 'Gem', color: 'from-cyan-500 to-blue-600' },
  { id: 'rocket', icon: Rocket, name: 'Rocket', color: 'from-purple-500 to-purple-600' },
  { id: 'brain', icon: Brain, name: 'Brain', color: 'from-pink-500 to-purple-600' },
  { id: 'eye', icon: Eye, name: 'Eye', color: 'from-indigo-500 to-blue-600' },
  { id: 'skull', icon: Skull, name: 'Skull', color: 'from-gray-700 to-gray-800' },
  { id: 'ghost', icon: Ghost, name: 'Ghost', color: 'from-purple-300 to-purple-500' },
  { id: 'smile', icon: Smile, name: 'Smile', color: 'from-green-400 to-green-600' },
  { id: 'coffee', icon: Coffee, name: 'Coffee', color: 'from-amber-600 to-amber-700' }
];

export const getIconById = (iconId) => {
  return PROFILE_ICONS.find(icon => icon.id === iconId) || PROFILE_ICONS[0];
};

const ProfileIconSelector = ({ selectedIcon, onSelect, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16'
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  };

  return (
    <div className="grid grid-cols-5 gap-3">
      {PROFILE_ICONS.map((iconData) => {
        const IconComponent = iconData.icon;
        const isSelected = selectedIcon === iconData.id;

        return (
          <button
            key={iconData.id}
            onClick={() => onSelect(iconData.id)}
            className={`${sizeClasses[size]} bg-gradient-to-br ${iconData.color} rounded-full flex items-center justify-center transition-all hover:scale-110 ${
              isSelected ? 'ring-4 ring-purple-500 ring-offset-2' : ''
            }`}
            title={iconData.name}
          >
            <IconComponent className={`${iconSizeClasses[size]} text-white`} />
          </button>
        );
      })}
    </div>
  );
};

export default ProfileIconSelector;











