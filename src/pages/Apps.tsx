import React, { useEffect, useState } from "react";
import TVAppCard from "@/components/TVAppCard";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import NavigationBar from "@/components/NavigationBar";
import WeatherWidget from "@/components/WeatherWidget";
import AIOrb from "@/components/AIOrb";
import WeatherBackground from "@/components/WeatherBackground";

// Import images
import netflixIcon from "@/assets/netflix-icon.jpg";
import youtubeIcon from "@/assets/youtube-icon.jpg";
import plutoIcon from "@/assets/pluto-icon.jpg";
import youtubeMusicIcon from "@/assets/youtube-music-icon.jpg";
import plexIcon from "@/assets/plex-icon.jpg";

const Apps = () => {
  const [currentTime, setCurrentTime] = useState("");
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'>('sunny');

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Update time every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
      }));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const streamingApps = [
    { name: "Netflix", icon: netflixIcon, url: "https://www.netflix.com" },
    { name: "YouTube", icon: youtubeIcon, url: "https://www.youtube.com" },
    { name: "Pluto TV", icon: plutoIcon, url: "https://pluto.tv" },
    { name: "YouTube Music", icon: youtubeMusicIcon, url: "https://music.youtube.com" },
    { name: "Plex TV", icon: plexIcon, url: "https://www.plex.tv" },
    { name: "Disney+", icon: netflixIcon, url: "https://www.disneyplus.com" },
    { name: "Hulu", icon: youtubeIcon, url: "https://www.hulu.com" },
    { name: "Prime Video", icon: plutoIcon, url: "https://www.primevideo.com" },
    { name: "HBO Max", icon: youtubeMusicIcon, url: "https://www.hbomax.com" },
  ];

  // Initialize keyboard navigation
  const navigation = useKeyboardNavigation(streamingApps.length, 0, 0, 0, 4); // 4 nav items including AI button

  return (
    <div className="min-h-screen bg-black text-white relative">
      {/* Weather Background Animations */}
      <WeatherBackground condition={weatherCondition} />
      
      {/* Header */}
      <header className="flex items-center justify-between p-6 md:p-8 relative z-10">
        <NavigationBar 
          focused={navigation.currentSection === 'nav'} 
          focusedIndex={navigation.focusedIndex} 
        />
        
        <div className="flex items-center space-x-6">
          {/* Time Widget */}
          <div className="flex items-center text-gray-300">
            <span className="text-lg font-semibold text-white">{currentTime}</span>
          </div>
          
          {/* Weather Widget */}
          <WeatherWidget onWeatherChange={setWeatherCondition} />
          
          {/* AI Orb */}
          <AIOrb focused={navigation.currentSection === 'ai-button'} />
        </div>
      </header>

      <div className="p-6 md:p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold text-white mb-2">All Apps</h1>
          <p className="text-gray-400">Choose your streaming platform</p>
        </div>

        {/* Apps Grid */}
        <section id="section-apps" className="max-w-6xl mx-auto">
          <div id="apps-container" className="grid grid-cols-3 gap-6 md:gap-8">
            {streamingApps.map((app, index) => (
              <TVAppCard 
                key={index} 
                name={app.name}
                icon={app.icon}
                url={app.url}
                focused={navigation.currentSection === 'apps' && navigation.focusedIndex === index}
                className="animate-fade-in" 
                style={{ animationDelay: `${index * 100}ms` }} 
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Apps;