import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './lib/firebase';

import Navigation from './components/Navigation';
import Hero from './components/Hero';
import About from './components/About';
import Contact from './components/Contact';
import AuthModal from './components/AuthModal';
import UserDashboard from './components/UserDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const [user, setUser] = useState<any>(null);
  const [userData, setUserData] = useState<any>(null);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');
  const [currentView, setCurrentView] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const userDocRef = doc(db, 'users', user.uid);
      const unsubscribe = onSnapshot(userDocRef, (doc) => {
        if (doc.exists()) {
          const data = { id: doc.id, ...doc.data() };
          setUserData(data);

          // Auto-redirect authenticated users to appropriate dashboard
          setCurrentView(data.isAdmin ? 'admin' : 'dashboard');
        }
      });

      return () => unsubscribe();
    } else {
      setUserData(null);
      // Redirect unauthenticated users to home
      setCurrentView('home');
    }
  }, [user]);

  const handleViewChange = (view: string) => {
    setCurrentView(view);
    
    if (view === 'home') {
      // Scroll to top for home view
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (view === 'about') {
      // Scroll to about section
      const aboutElement = document.getElementById('about');
      aboutElement?.scrollIntoView({ behavior: 'smooth' });
    } else if (view === 'contact') {
      // Scroll to contact section
      const contactElement = document.getElementById('contact');
      contactElement?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleStartWinning = () => {
    if (user) {
      if (userData?.isAdmin) {
        setCurrentView('admin');
      } else {
        setCurrentView('dashboard');
      }
    } else {
      setAuthModalOpen(true);
    }
  };

  const handleAuthClick = (mode: 'login' | 'signup' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-600 to-teal-800 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-center text-white dark:text-gray-200">
          <div className="w-16 h-16 border-4 border-white dark:border-gray-300 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold">Loading Winza ZA...</h2>
        </div>
      </div>
    );
  }

  // Dashboard views for authenticated users
  if (user && (currentView === 'dashboard' || currentView === 'admin')) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
        <Navigation
          user={user}
          userData={userData}
          currentView={currentView}
          onViewChange={handleViewChange}
          onAuthClick={handleAuthClick}
        />
        {currentView === 'dashboard' && <UserDashboard user={user} userData={userData} />}
        {currentView === 'admin' && userData?.isAdmin && <AdminDashboard user={user} />}
      </div>
    );
  }

  // Main website - show to unauthenticated users or when explicitly viewing home
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors duration-200">
      <Navigation
        user={user}
        userData={userData}
        currentView={currentView}
        onViewChange={handleViewChange}
        onAuthClick={handleAuthClick}
      />

      <main>
        <Hero onStartWinning={handleStartWinning} />
        <About />
        <Contact />
      </main>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </div>
  );
}

export default App;