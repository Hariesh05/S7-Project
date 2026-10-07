import React, { useState, useEffect } from 'react';
import { User, UserRole } from './types/index.ts';
import { Navbar } from './components/Navbar.tsx';
import { GoogleAuthModal } from './components/GoogleAuthModal.tsx';
import { StudentDashboard } from './components/StudentPortal/StudentDashboard.tsx';
import { RecruiterDashboard } from './components/RecruiterPortal/RecruiterDashboard.tsx';
import { AdminDashboard } from './components/AdminPortal/AdminDashboard.tsx';
import { Sparkles, Shield, Database, Cpu } from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState<User>({
    id: 'user_alex',
    email: 'hariesh.al23@bitsathy.ac.in',
    name: 'Alex Chen',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    role: 'student',
    createdAt: new Date().toISOString(),
  });

  const [hasGeminiKey, setHasGeminiKey] = useState<boolean>(true);
  const [activeRole, setActiveRole] = useState<UserRole>('student');
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const res = await fetch('/api/auth/current-user');
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setActiveRole(data.user.role);
        setHasGeminiKey(data.hasGeminiKey);
      }
    } catch (err) {
      console.error('Error fetching user:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchUser = async (userId: string) => {
    try {
      const res = await fetch('/api/auth/switch-user', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        setActiveRole(data.user.role);
      }
    } catch (err) {
      console.error('Switch user error:', err);
    }
  };

  const handleGoogleSuccess = (user: User) => {
    setCurrentUser(user);
    setActiveRole(user.role);
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

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentUser={currentUser}
        hasGeminiKey={hasGeminiKey}
        onSwitchUser={handleSwitchUser}
        onOpenGoogleAuth={() => setIsGoogleModalOpen(true)}
        activeRole={activeRole}
        onSelectRole={role => setActiveRole(role)}
      />

      {/* Main Role Content */}
      <main className="flex-1">
        {activeRole === 'student' && <StudentDashboard currentUser={currentUser} />}
        {activeRole === 'recruiter' && <RecruiterDashboard currentUser={currentUser} />}
        {activeRole === 'admin' && <AdminDashboard currentUser={currentUser} />}
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
              <span>PostgreSQL & pgvector</span>
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
        onClose={() => setIsGoogleModalOpen(false)}
        onSuccess={handleGoogleSuccess}
        defaultEmail={currentUser.email}
      />
    </div>
  );
}
