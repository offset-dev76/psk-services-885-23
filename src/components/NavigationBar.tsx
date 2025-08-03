import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavigationBarProps {
  focused: boolean;
  focusedIndex: number;
}

const NavigationBar: React.FC<NavigationBarProps> = ({ focused, focusedIndex }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Apps', path: '/apps' },
    { name: 'Restaurant', path: '/restaurant' },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
  };

  return (
    <nav id="navigation-bar" className="flex items-center space-x-8">
      {navItems.map((item, index) => {
        const isActive = location.pathname === item.path;
        const isFocused = focused && focusedIndex === index;
        
        return (
          <button
            key={item.path}
            onClick={() => handleNavClick(item.path)}
            className={`
              text-lg font-medium transition-all duration-300 px-4 py-2
              ${isActive || isFocused 
                ? 'text-white text-shadow-glow' 
                : 'text-gray-300 hover:text-white'
              }
            `}
          >
            {item.name}
          </button>
        );
      })}
    </nav>
  );
};

export default NavigationBar;