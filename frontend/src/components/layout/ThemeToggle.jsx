import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

export const ThemeToggle = () => {
  const { isDarkMode, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      className="rounded-full w-10 h-10 transition-all duration-300 hover:bg-primary/10 group focus-visible:ring-primary"
      aria-label="Toggle theme"
    >
      <div className="relative w-6 h-6 flex items-center justify-center">
        <Sun 
          className={`absolute transition-all duration-500 transform ${
            isDarkMode ? 'rotate-0 scale-100 opacity-100 text-amber-500' : 'rotate-90 scale-0 opacity-0'
          }`}
        />
        <Moon 
          className={`absolute transition-all duration-500 transform ${
            !isDarkMode ? 'rotate-0 scale-100 opacity-100 text-indigo-400' : '-rotate-90 scale-0 opacity-0'
          }`}
        />
      </div>
    </Button>
  );
};

export default ThemeToggle;
