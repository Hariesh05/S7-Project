import React, { useState, useEffect } from 'react';
import { User } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { GoogleAuthModal } from './components/GoogleAuthModal.tsx';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard.tsx';
import { RecruiterDashboard } from './components/RecruiterPortal/RecruiterDashboard.tsx';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard.tsx';
import { Sparkles, Shield, Database, Cpu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/current-user');
      const data = await res.json();
      setHasGeminiKey(Boolean(data.hasGeminiKey));
      if (data.user) {
        setCurrentUser(data.user);
      } else {
        setIsGoogleModalOpen(true);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
      setIsGoogleModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (err) {
      console.error('Sign out error:', err);
    } finally {
      setCurrentUser(null);
      setIsGoogleModalOpen(true);
    }
  };

  const handleGoogleSuccess = (user: User) => {
    setCurrentUser(user);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-semibold text-slate-600">
            Initializing AI Career Copilot & Placement Intelligence...
          </p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <GoogleAuthModal
          isOpen={isGoogleModalOpen}
          canClose={false}
          onClose={() => setIsGoogleModalOpen(false)}
          onSuccess={handleGoogleSuccess}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        hasGeminiKey={hasGeminiKey}
        onLogout={handleLogout}
        onOpenGoogleAuth={() => setIsGoogleModalOpen(true)}
      />

      {/* Main Role Content */}
      <main className="flex-1">
        {currentUser.role === 'student' && <StudentDashboard currentUser={currentUser} />}
        {currentUser.role === 'recruiter' && <RecruiterDashboard currentUser={currentUser} />}
        {currentUser.role === 'admin' && <AdminDashboard currentUser={currentUser} />}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-xs text-slate-500 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-slate-800">
              NexusCareer AI · Placement & Skill Matching Architecture
            </span>
          </div>

          <div className="flex items-center space-x-6 text-[11px] text-slate-500">
              <span className="flex items-center space-x-1">
                <Database className="w-3.5 h-3.5 text-indigo-500" />
                <span>Supabase PostgreSQL</span>
              </span>
            <span className="flex items-center space-x-1">
              <Cpu className="w-3.5 h-3.5 text-emerald-500" />
              <span>Gemini 3.8 Flash NLP</span>
            </span>
            <span className="flex items-center space-x-1">
              <Shield className="w-3.5 h-3.5 text-cyan-500" />
              <span>Google OAuth 2.0</span>
            </span>
          </div>
        </div>
      </footer>

      {/* Google Sign-In Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        canClose={true}
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
      />
    </div>
  );
}
