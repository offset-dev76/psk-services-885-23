import React from 'react';
import { Card } from '@/components/ui/card';

interface TVAppCardProps {
  name: string;
  icon: string;
  url: string;
  className?: string;
  style?: React.CSSProperties;
  focused?: boolean;
}

const TVAppCard: React.FC<TVAppCardProps> = ({ name, icon, url, className, style, focused = false }) => {
  const handleClick = () => {
    window.open(url, '_blank');
  };

  return (
    <Card 
      onClick={handleClick}
      className={`relative overflow-hidden glassmorphism bg-psyco-black-light/20 border-psyco-green-DEFAULT/20 transition-all duration-300 cursor-pointer group card-hover w-52 h-32 ${
        focused ? 'border-white border-2 scale-105' : 'hover:border-psyco-green-DEFAULT/50'
      } ${className}`}
      style={style}
    >
      <div className="relative w-full h-full">
        <img 
          src={icon} 
          alt={`${name} app`}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute bottom-1 left-1 right-1">
          <h3 className="text-white font-medium text-xs text-center truncate">{name}</h3>
        </div>
      </div>
    </Card>
  );
};

export default TVAppCard;