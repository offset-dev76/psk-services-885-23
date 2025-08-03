
import React, { useState } from 'react';
import { Mic, MicOff, Volume2 } from 'lucide-react';
import { useGeminiLiveAudio } from '@/hooks/useGeminiLiveAudio';

interface AIOrbProps {
  focused?: boolean;
  onClick?: () => void;
}

const AIOrb: React.FC<AIOrbProps> = ({ focused = false, onClick }) => {
  const { 
    isConnected, 
    isMuted, 
    toggleMute, 
    connect, 
    disconnect, 
    audioLevel 
  } = useGeminiLiveAudio();

  const handleClick = async () => {
    onClick?.();

    if (!isConnected) {
      // First click - establish connection
      await connect();
    } else {
      // Subsequent clicks - toggle mute
      await toggleMute();
    }
  };

  const getOrbState = () => {
    if (!isConnected) return 'idle';
    if (isMuted) return 'muted';
    return 'active';
  };

  const orbState = getOrbState();

  const getIcon = () => {
    if (!isConnected) {
      return <Mic size={20} className="text-white" />;
    }
    if (isMuted) {
      return <MicOff size={20} className="text-white" />;
    }
    return <Volume2 size={20} className="text-white" />;
  };

  return (
    <button
      id="ai-orb-button"
      onClick={handleClick}
      className={`relative w-12 h-12 rounded-full transition-all duration-300 cursor-pointer group ${
        focused ? 'ring-2 ring-white' : ''
      } ${
        orbState === 'active'
          ? 'bg-gradient-to-r from-green-500 to-green-600 scale-110 shadow-lg shadow-green-500/50' 
          : orbState === 'muted'
          ? 'bg-gradient-to-r from-yellow-500 to-orange-600 scale-110 shadow-lg shadow-yellow-500/50'
          : 'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-psyco-green-DEFAULT/80 hover:to-blue-500/80'
      }`}
    >
      {/* Pulsing rings when active */}
      {orbState === 'active' && (
        <>
          <div className="absolute inset-0 rounded-full animate-ping bg-green-500/30" />
          <div className="absolute inset-0 rounded-full animate-ping animation-delay-200 bg-green-500/20" />
        </>
      )}
      
      {/* Content */}
      <div className="absolute inset-0 flex items-center justify-center">
        {orbState === 'active' ? (
          <div className="flex items-center space-x-0.5">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="w-0.5 bg-white rounded-full animate-pulse transition-all duration-75"
                style={{ 
                  height: `${8 + (audioLevel * 20)}px`,
                  animationDelay: `${i * 100}ms` 
                }}
              />
            ))}
          </div>
        ) : (
          getIcon()
        )}
      </div>
      
      {/* Glow effect when focused */}
      {focused && (
        <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse" />
      )}
    </button>
  );
};

export default AIOrb;
