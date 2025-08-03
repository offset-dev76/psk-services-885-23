import React from 'react';
import { Card } from '@/components/ui/card';

interface MovieCardProps {
  title: string;
  poster: string;
  year: string;
  genre: string;
  className?: string;
  style?: React.CSSProperties;
  focused?: boolean;
}

const MovieCard: React.FC<MovieCardProps> = ({ title, poster, year, genre, className, style, focused = false }) => {
  return (
    <Card 
      className={`relative overflow-hidden glassmorphism bg-psyco-black-light/20 border-psyco-green-DEFAULT/20 transition-all duration-300 cursor-pointer group card-hover w-64 h-40 ${
        focused ? 'border-white border-2 scale-105' : 'hover:border-psyco-green-DEFAULT/50'
      } ${className}`}
      style={style}
    >
      <div className="relative w-full h-full">
        <img 
          src={poster} 
          alt={`${title} poster`}
          className="w-full h-full object-cover rounded-lg"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
        <div className="absolute bottom-1 left-1 right-1">
          <h3 className="text-white font-medium text-xs mb-0.5 truncate">{title}</h3>
          <p className="text-gray-300 text-[10px] truncate">{year} • {genre}</p>
        </div>
      </div>
    </Card>
  );
};

export default MovieCard;