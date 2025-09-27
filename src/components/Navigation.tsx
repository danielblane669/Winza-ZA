import React, { useState } from 'react';
import { User, LogOut, Settings, Menu, X, Moon, Sun } from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useTheme } from '../contexts/ThemeContext';
import Logo from './Logo';

interface NavigationProps {
  user: any;
  userData: any;
  currentView: string;
  onViewChange: (view: string) => void;
  onAuthClick: (mode?: 'login' | 'signup') => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  user, 
  userData, 
  currentView, 
  onViewChange, 
  onAuthClick 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isDarkMode, toggleDarkMode } = useTheme();

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      onViewChange('home');
      setMobileMenuOpen(false);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const navigationItems = user ? [
    { id: 'dashboard', label: 'Dashboard' },
    ...(userData?.isAdmin ? [{ id: 'admin', label: 'Admin' }] : [])
  ] : [
    { id: 'home', label: 'Home' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <nav className="bg-white dark:bg-gray-900 shadow-lg sticky top-0 z-40 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and brand */}
          <div className="flex items-center space-x-3">
            <Logo size="sm" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">Winza ZA</span>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {navigationItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onViewChange(item.id)}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentView === item.id
                    ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                    : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* User menu */}
          <div className="hidden md:flex items-center space-x-4">
            {/* Dark mode toggle */}
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {user ? (
              <>
                {userData && (
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">
                      {userData.fullName || user.email}
                    </p>
                    <p className="text-sm text-emerald-600 font-bold">
                      R{userData.currentBalance?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                )}
                <button
                  onClick={handleSignOut}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/30 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign Out</span>
                </button>
              </>
            ) : (
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => onAuthClick('login')}
                  className="px-4 py-2 text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onAuthClick('signup')}
                  className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-4 py-2 rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-300"
                >
                  Sign Up
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-200 dark:border-gray-700">
            <div className="py-2 space-y-1">
              {/* Dark mode toggle for mobile */}
              <div className="px-3 py-2">
                <button
                  onClick={toggleDarkMode}
                  className="flex items-center space-x-2 w-full text-left text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md px-3 py-2 transition-colors"
                >
                  {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                  <span>{isDarkMode ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
              </div>

              {navigationItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    onViewChange(item.id);
                    setMobileMenuOpen(false);
                  }}
                  className={`block w-full text-left px-3 py-2 rounded-md text-base font-medium transition-colors ${
                    currentView === item.id
                      ? 'text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400'
                      : 'text-gray-700 dark:text-gray-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              
              {user ? (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  {userData && (
                    <div className="px-3 py-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {userData.fullName || user.email}
                      </p>
                      <p className="text-sm text-emerald-600 font-bold">
                        Balance: R{userData.currentBalance?.toFixed(2) || '0.00'}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-2 px-3 py-2 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors w-full"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
                  <button
                    onClick={() => {
                      onAuthClick('login');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 text-emerald-600 dark:text-emerald-400 border border-emerald-600 dark:border-emerald-400 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      onAuthClick('signup');
                      setMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-lg hover:from-emerald-700 hover:to-teal-800 transition-all duration-300"
                  >
                    Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;