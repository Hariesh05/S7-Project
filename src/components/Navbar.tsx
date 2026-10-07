import React, { useState } from 'react';
import { User, UserRole } from '../types/index.ts';
import {
  Sparkles,
  GraduationCap,
  Briefcase,
  ShieldCheck,
  Cpu,
  LogIn,
  ChevronDown,
  Award,
  Layers,
} from 'lucide-react';

interface NavbarProps {
  currentUser: User;
  hasGeminiKey: boolean;
  onSwitchUser: (userId: string) => void;
  onOpenGoogleAuth: () => void;
  activeRole: UserRole;
  onSelectRole: (role: UserRole) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  hasGeminiKey,
  onSwitchUser,
  onOpenGoogleAuth,
  activeRole,
  onSelectRole,
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);

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
                  Student Career Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                AI Placement & Skill Matching Hub for Students
              </p>
            </div>
          </div>

          {/* Student Status Center Banner */}
          <div className="hidden md:flex items-center space-x-3 px-3 py-1.5 bg-slate-50 rounded-xl border border-slate-200 text-xs">
            <span className="flex items-center space-x-1.5 text-indigo-700 font-semibold">
              <Award className="w-3.5 h-3.5 text-indigo-600" />
              <span>Campus Placement Portal</span>
            </span>
            <span className="text-slate-300">·</span>
            <span className="text-slate-600">Class of 2026</span>
            <span className="text-slate-300">·</span>
            <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 text-[11px]">
              Placement Readiness: 86/100
            </span>
          </div>

          {/* Right Controls */}
          <div className="flex items-center space-x-3">
            {/* Gemini Live Indicator */}
            <div className="hidden lg:flex items-center space-x-1.5 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-[11px] text-slate-600">
              <Cpu className={`w-3.5 h-3.5 ${hasGeminiKey ? 'text-emerald-500' : 'text-amber-500'}`} />
              <span className="font-mono">Gemini 3.8 Flash</span>
              <span className={`w-1.5 h-1.5 rounded-full ${hasGeminiKey ? 'bg-emerald-500' : 'bg-amber-400 animate-pulse'}`} />
            </div>

            {/* View Switcher: Student First with ability to view recruiter/admin */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(prev => !prev)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${
                  activeRole === 'student'
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {activeRole === 'student' && <GraduationCap className="w-3.5 h-3.5 text-indigo-600" />}
                {activeRole === 'recruiter' && <Briefcase className="w-3.5 h-3.5 text-indigo-600" />}
                {activeRole === 'admin' && <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />}
                <span className="capitalize">{activeRole} View</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>

              {showRoleMenu && (
                <div
                  className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150"
                  onMouseLeave={() => setShowRoleMenu(false)}
                >
                  <div className="px-2 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Application Workspace
                  </div>
                  <button
                    onClick={() => {
                      onSelectRole('student');
                      onSwitchUser('user_alex');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeRole === 'student'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <GraduationCap className="w-4 h-4 text-indigo-600" />
                    <div>
                      <div>Student Portal (Primary)</div>
                      <div className="text-[10px] text-slate-400 font-normal">Alex Chen · CS & AI Major</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectRole('recruiter');
                      onSwitchUser('user_sarah');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeRole === 'recruiter'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-slate-600" />
                    <div>
                      <div>Recruiter Candidate Portal</div>
                      <div className="text-[10px] text-slate-400 font-normal">Candidate ranking & jobs</div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      onSelectRole('admin');
                      onSwitchUser('user_admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full text-left px-2.5 py-2 rounded-lg text-xs font-medium flex items-center space-x-2 transition-colors ${
                      activeRole === 'admin'
                        ? 'bg-indigo-50 text-indigo-700 font-bold'
                        : 'text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-slate-600" />
                    <div>
                      <div>Placement Analytics & Trends</div>
                      <div className="text-[10px] text-slate-400 font-normal">Dean of Placements</div>
                    </div>
                  </button>
                </div>
              )}
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
          </div>
        </div>
      </div>
    </header>
  );
};
