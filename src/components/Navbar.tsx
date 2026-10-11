import React from 'react';
import { User } from '../types/index.ts';
import {
  Sparkles,
  GraduationCap,
  Cpu,
  LogOut,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  hasGeminiKey: boolean;
  onOpenGoogleAuth: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  hasGeminiKey,
  onOpenGoogleAuth,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand: Explicitly Student-Oriented */}
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-100">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 tracking-tight text-lg">NexusCareer</span>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {currentUser.role === 'admin' ? 'Admin Workspace' : currentUser.role === 'recruiter' ? 'Recruiter Workspace' : 'Student Career Copilot'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                {currentUser.role === 'admin' ? 'Account, listing, and platform administration' : 'Career tools and job matching'}
              </p>
            </div>
          </div>

          {/* Current workspace */}
          <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="font-semibold text-slate-700 capitalize">{currentUser.role} workspace</span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500">{currentUser.email}</span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Gemini Live Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <Cpu className={`w-3.5 h-3.5 ${hasGeminiKey ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="font-mono">Gemini 3.8 Flash</span>
              <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
            </div>

            {/* Google Account Profile Button */}
            <button
              onClick={onOpenGoogleAuth}
              className="flex items-center space-x-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-2xs transition-colors"
            >
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.name}
                className="w-6 h-6 rounded-full object-cover border border-slate-200"
              />
              <span className="hidden sm:inline">{currentUser.name.split(' ')[0]}</span>
            </button>
            <button
              onClick={onLogout}
              title="Sign out"
              aria-label="Sign out"
              className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
