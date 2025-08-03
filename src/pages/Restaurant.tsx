import React, { useEffect, useState } from "react";
import { Clock, DollarSign } from "lucide-react";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import NavigationBar from "@/components/NavigationBar";
import WeatherWidget from "@/components/WeatherWidget";
import AIOrb from "@/components/AIOrb";
import WeatherBackground from "@/components/WeatherBackground";

const Restaurant = () => {
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

  const menuItems = [
    { 
      name: "Margherita Pizza", 
      description: "Fresh tomato sauce, mozzarella, basil", 
      price: "$18.99", 
      category: "Pizza",
      time: "15-20 min"
    },
    { 
      name: "Caesar Salad", 
      description: "Romaine lettuce, parmesan, croutons, caesar dressing", 
      price: "$12.99", 
      category: "Salads",
      time: "5-10 min"
    },
    { 
      name: "Grilled Salmon", 
      description: "Atlantic salmon with lemon herb seasoning", 
      price: "$24.99", 
      category: "Main Course",
      time: "20-25 min"
    },
    { 
      name: "Chicken Alfredo", 
      description: "Fettuccine pasta with grilled chicken in cream sauce", 
      price: "$19.99", 
      category: "Pasta",
      time: "15-20 min"
    },
    { 
      name: "Chocolate Lava Cake", 
      description: "Warm chocolate cake with molten center", 
      price: "$8.99", 
      category: "Dessert",
      time: "10-15 min"
    },
    { 
      name: "Beef Burger", 
      description: "Angus beef patty with lettuce, tomato, onion", 
      price: "$16.99", 
      category: "Burgers",
      time: "12-18 min"
    },
  ];

  // Initialize keyboard navigation
  const navigation = useKeyboardNavigation(0, menuItems.length, 0, 0, 4); // 4 nav items including AI button

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
          <h1 className="text-4xl font-bold text-white mb-2">Restaurant Menu</h1>
          <p className="text-gray-400">Order your favorite meals</p>
        </div>

        {/* Menu Items */}
        <section id="section-menu" className="max-w-4xl mx-auto">
          <div id="menu-container" className="space-y-4">
            {menuItems.map((item, index) => (
              <div 
                key={index}
                className={`
                  p-6 rounded-lg border transition-all duration-300 cursor-pointer
                  ${navigation.currentSection === 'movies' && navigation.focusedIndex === index 
                    ? 'border-white bg-white/10 shadow-lg shadow-white/20' 
                    : 'border-gray-700 hover:border-gray-500 bg-gray-900/50'
                  }
                `}
                style={{ animationDelay: `${index * 100}ms` }}
              >
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-white">{item.name}</h3>
                <span className="text-lg font-bold text-green-400">{item.price}</span>
              </div>
              <p className="text-gray-300 mb-3">{item.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm bg-gray-700 px-2 py-1 rounded">{item.category}</span>
                <div className="flex items-center text-gray-400 text-sm">
                  <Clock size={14} className="mr-1" />
                  {item.time}
                </div>
              </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default Restaurant;