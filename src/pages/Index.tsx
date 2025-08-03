import React, { useEffect, useState } from "react";
import TVCarousel from "@/components/TVCarousel";
import TVAppCard from "@/components/TVAppCard";
import MovieCard from "@/components/MovieCard";
import AIOrb from "@/components/AIOrb";
import WeatherWidget from "@/components/WeatherWidget";
import WeatherBackground from "@/components/WeatherBackground";
import NavigationBar from "@/components/NavigationBar";
import { Clock } from "lucide-react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";

// Import images
import netflixIcon from "@/assets/netflix-icon.jpg";
import youtubeIcon from "@/assets/youtube-icon.jpg";
import plutoIcon from "@/assets/pluto-icon.jpg";
import youtubeMusicIcon from "@/assets/youtube-music-icon.jpg";
import plexIcon from "@/assets/plex-icon.jpg";
import inceptionPoster from "@/assets/inception-poster.jpg";
import darkKnightPoster from "@/assets/dark-knight-poster.jpg";
import interstellarPoster from "@/assets/interstellar-poster.jpg";
import pulpFictionPoster from "@/assets/pulp-fiction-poster.jpg";
import matrixPoster from "@/assets/matrix-poster.jpg";
import fightClubPoster from "@/assets/fight-club-poster.jpg";
const Index = () => {
  const [weatherCondition, setWeatherCondition] = useState<'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy'>('sunny');

  // Scroll to top on page load
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const streamingApps = [{
    name: "Netflix",
    icon: netflixIcon,
    url: "https://www.netflix.com"
  }, {
    name: "YouTube",
    icon: youtubeIcon,
    url: "https://www.youtube.com"
  }, {
    name: "Pluto TV",
    icon: plutoIcon,
    url: "https://pluto.tv"
  }, {
    name: "YouTube Music",
    icon: youtubeMusicIcon,
    url: "https://music.youtube.com"
  }, {
    name: "Plex TV",
    icon: plexIcon,
    url: "https://www.plex.tv"
  }];
  const movies = [{
    title: "Inception",
    poster: inceptionPoster,
    year: "2010",
    genre: "Sci-Fi"
  }, {
    title: "The Dark Knight",
    poster: darkKnightPoster,
    year: "2008",
    genre: "Action"
  }, {
    title: "Interstellar",
    poster: interstellarPoster,
    year: "2014",
    genre: "Sci-Fi"
  }, {
    title: "Pulp Fiction",
    poster: pulpFictionPoster,
    year: "1994",
    genre: "Crime"
  }, {
    title: "The Matrix",
    poster: matrixPoster,
    year: "1999",
    genre: "Action"
  }, {
    title: "Fight Club",
    poster: fightClubPoster,
    year: "1999",
    genre: "Drama"
  }];
  // Initialize keyboard navigation
  const navigation = useKeyboardNavigation(
    streamingApps.length,
    movies.length,
    4, // Continue watching count
    3, // Carousel items count
    4  // Navigation items count (including AI button)
  );

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };
  return <div className="min-h-screen bg-black text-white relative">
      {/* Weather Background Animations */}
      <WeatherBackground condition={weatherCondition} />
      
      {/* Header with Navigation and Controls */}
      <header className="flex justify-between items-center p-6 md:p-8">
        <NavigationBar 
          focused={navigation.currentSection === 'nav'}
          focusedIndex={navigation.focusedIndex}
        />
        <div className="flex items-center space-x-6">
          {/* Time Widget */}
          <div className="flex items-center text-gray-300">
            <span className="text-lg font-semibold text-white">{getCurrentTime()}</span>
          </div>
          
          {/* Weather Widget */}
          <WeatherWidget onWeatherChange={setWeatherCondition} />
          
          {/* AI Orb */}
          <AIOrb 
            focused={navigation.currentSection === 'ai-button'} 
            onClick={() => console.log('AI activated')}
          />
        </div>
      </header>

      {/* Hero Carousel Section */}
      <section id="section-carousel" className="px-6 md:px-8 mb-12">
        <TVCarousel />
      </section>
      
      {/* Streaming Apps Section */}
      <section id="section-apps" className="px-6 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Your Apps</h2>
          <div id="apps-container" className="flex gap-4 overflow-x-auto pb-4">
            {streamingApps.map((app, index) => (
              <TVAppCard 
                key={index} 
                name={app.name}
                icon={app.icon}
                url={app.url}
                focused={navigation.currentSection === 'apps' && navigation.focusedIndex === index}
                className="animate-fade-in flex-shrink-0" 
                style={{ animationDelay: `${index * 100}ms` }} 
              />
            ))}
          </div>
        </div>
      </section>
      
      {/* Movies Section */}
      <section id="section-movies" className="px-6 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Trending Movies</h2>
          <div id="movies-container" className="flex gap-4 overflow-x-auto pb-4">
            {movies.map((movie, index) => (
              <MovieCard 
                key={index} 
                {...movie} 
                focused={navigation.currentSection === 'movies' && navigation.focusedIndex === index}
                className="animate-fade-in flex-shrink-0" 
                style={{ animationDelay: `${index * 100}ms` }} 
              />
            ))}
          </div>
        </div>
      </section>

      {/* Continue Watching Section */}
      <section id="section-continue-watching" className="px-6 md:px-8 mb-12">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-2xl font-bold text-white mb-6">Continue Watching</h2>
          <div id="continue-watching-container" className="flex gap-4 overflow-x-auto pb-4">
            {movies.slice(0, 4).map((movie, index) => (
              <div key={index} className="relative flex-shrink-0">
                <MovieCard 
                  {...movie} 
                  focused={navigation.currentSection === 'continue-watching' && navigation.focusedIndex === index}
                  className="animate-fade-in" 
                  style={{ animationDelay: `${index * 100}ms` }} 
                />
                <div className="absolute bottom-1 left-1 right-1">
                  <div className="bg-psyco-green-DEFAULT h-1 rounded-full" style={{
                    width: `${(index + 1) * 25}%`
                  }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>;
};
export default Index;