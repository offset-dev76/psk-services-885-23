import React from 'react';

interface WeatherBackgroundProps {
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
}

const WeatherBackground: React.FC<WeatherBackgroundProps> = ({ condition }) => {
  const renderRaindrops = () => {
    return Array.from({ length: 50 }, (_, i) => (
      <div
        key={i}
        className="absolute w-px bg-blue-300/30 animate-rain"
        style={{
          left: `${Math.random() * 100}%`,
          height: `${10 + Math.random() * 20}px`,
          animationDelay: `${Math.random() * 2}s`,
          animationDuration: `${1 + Math.random()}s`
        }}
      />
    ));
  };

  const renderLightning = () => {
    return (
      <div className="absolute inset-0 animate-lightning opacity-0">
        <div className="absolute inset-0 bg-white/5" />
      </div>
    );
  };

  switch (condition) {
    case 'sunny':
      return (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-40">
          {/* Extended subtle golden glow */}
          <div className="absolute -top-20 -right-20 w-2/3 h-2/3 bg-gradient-radial from-yellow-300/20 via-yellow-300/10 via-yellow-300/5 to-transparent animate-pulse" />
          <div className="absolute -top-10 -right-10 w-1/2 h-1/2 bg-gradient-radial from-orange-200/25 via-orange-200/15 via-orange-200/8 to-transparent animate-glow" />
        </div>
      );

    case 'cloudy':
      return (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-30">
          {/* Grey gradient moving from left to right */}
          <div className="absolute inset-0 bg-gradient-to-r from-gray-600/20 via-gray-500/10 to-transparent animate-slide-slow" />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-400/15 to-gray-600/20 animate-slide-slow-reverse" />
        </div>
      );

    case 'rainy':
      return (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-35">
          {/* Rain animation */}
          <div className="absolute inset-0 overflow-hidden">
            {renderRaindrops()}
          </div>
          {/* Subtle blue tint */}
          <div className="absolute inset-0 bg-blue-900/10" />
        </div>
      );

    case 'stormy':
      return (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-40">
          {/* Rain animation */}
          <div className="absolute inset-0 overflow-hidden">
            {renderRaindrops()}
          </div>
          {/* Lightning effect */}
          {renderLightning()}
          {/* Dark storm atmosphere */}
          <div className="absolute inset-0 bg-gray-900/15" />
        </div>
      );

    case 'snowy':
      return (
        <div className="fixed top-0 right-0 w-96 h-96 pointer-events-none z-0 opacity-35">
          {/* Snow animation (similar to rain but slower and white) */}
          <div className="absolute inset-0 overflow-hidden">
            {Array.from({ length: 30 }, (_, i) => (
              <div
                key={i}
                className="absolute w-1 h-1 bg-white/60 rounded-full animate-snow"
                style={{
                  left: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${3 + Math.random() * 2}s`
                }}
              />
            ))}
          </div>
          {/* Cool blue tint */}
          <div className="absolute inset-0 bg-blue-100/10" />
        </div>
      );

    default:
      return null;
  }
};

export default WeatherBackground;