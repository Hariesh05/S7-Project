import React, { useState, useEffect } from 'react';
import { StudentProfile, User } from '../../types/index.ts';
import { PlacementReadinessCard } from './PlacementReadinessCard.tsx';
import { DigitalTwinSimulator } from './DigitalTwinSimulator.tsx';
import { ResumeUploader } from './ResumeUploader.tsx';
import { StudentProfileEditor } from './StudentProfileEditor.tsx';
import { CertificationsManager } from './CertificationsManager.tsx';
import { ResumeEvidenceMap } from './ResumeEvidenceMap.tsx';
import { LiveSkillKnowledgeGraph } from './LiveSkillKnowledgeGraph.tsx';
import { JobRecommendations } from './JobRecommendations.tsx';
import { SkillGapRoadmap } from './SkillGapRoadmap.tsx';
import { ATSScanner } from './ATSScanner.tsx';
import { MockInterviewRoom } from './MockInterviewRoom.tsx';
import { ApplicationsView } from './ApplicationsView.tsx';

import {
  Sparkles,
  LayoutDashboard,
  FileText,
  Network,
  Briefcase,
  Compass,
  FileSearch,
  Mic,
  Send,
  TrendingUp,
  Award,
  ArrowRight,
  UserRound,
  ClipboardCheck,
  Github,
  ExternalLink,
} from 'lucide-react';

interface StudentDashboardProps {
  currentUser: User;
}

export const StudentDashboard: React.FC<StudentDashboardProps> = ({ currentUser }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [careerRoles, setCareerRoles] = useState<any[]>([]);
  const [skillsTaxonomy, setSkillsTaxonomy] = useState<any[]>([]);
  const [skillEdges, setSkillEdges] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<
    'overview' | 'profile' | 'certifications' | 'resume' | 'evidence' | 'graph' | 'jobs' | 'roadmap' | 'ats' | 'interview' | 'applications'
  >('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStudentData();
  }, [currentUser]);

  const fetchStudentData = async () => {
    setLoading(true);
    try {
      const [profileRes, rolesRes, graphRes] = await Promise.all([
        fetch('/api/student/profile'),
        fetch('/api/student/career-recommendations'),
        fetch('/api/student/skill-graph'),
      ]);

      const pData = await profileRes.json();
      const rData = await rolesRes.json();
      const graphData = await graphRes.json();

      setProfile(pData);
      setCareerRoles(rData);
      setSkillsTaxonomy(graphData.nodes || []);
      setSkillEdges(graphData.edges || []);
    } catch (err) {
      console.error('Error fetching student data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !profile) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-xs text-slate-500">
        <div className="w-8 h-8 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        Loading your AI Career Digital Twin...
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Student Profile Kicker Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <img
            src={currentUser.avatarUrl}
            alt={currentUser.name}
            className="w-14 h-14 rounded-2xl object-cover border-2 border-indigo-100 shadow-xs"
          />
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl font-black text-slate-900 tracking-tight">{currentUser.name}</h1>
            </div>
            <p className="text-xs text-slate-600 font-medium mt-0.5">{profile.headline}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 mt-1">
              {profile.university && <span>{profile.university}</span>}
              {profile.cgpa > 0 && <span>CGPA: <strong className="text-slate-800">{profile.cgpa}</strong></span>}
              <span>{profile.skills.length} Profile Skills</span>
              {profile.github?.username && (
                <a
                  href={profile.github.profileUrl || `https://github.com/${profile.github.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 hover:bg-slate-200 font-semibold transition-colors"
                >
                  <Github className="w-3 h-3" />
                  <span>@{profile.github.username}</span>
                  {profile.github.publicRepos ? <span className="text-[10px] text-slate-500 font-normal">({profile.github.publicRepos} repos)</span> : null}
                </a>
              )}
              {profile.leetcode?.username && (
                <a
                  href={profile.leetcode.profileUrl || `https://leetcode.com/u/${profile.leetcode.username}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100 font-semibold transition-colors"
                >
                  <span className="font-mono text-[10px] font-bold">LC:</span>
                  <span>@{profile.leetcode.username}</span>
                  {profile.leetcode.totalSolved ? <span className="text-[10px] text-amber-700 font-normal">({profile.leetcode.totalSolved} solved)</span> : null}
                </a>
              )}
              {profile.topCertifications && profile.topCertifications.length > 0 && (
                <button
                  type="button"
                  onClick={() => setActiveTab('certifications')}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100 font-semibold transition-colors"
                >
                  <Award className="w-3 h-3 text-indigo-600" />
                  <span>{profile.topCertifications.length} Top Certs</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick Career Target tags */}
        <div className="text-right flex flex-col items-start md:items-end">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Target Career Trajectories
          </span>
          <div className="flex flex-wrap gap-1.5">
            {profile.targetRoles.map(role => (
              <span
                key={role}
                className="text-xs px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 font-medium"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-1 border-b border-slate-200 overflow-x-auto pb-px">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'profile' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserRound className="w-4 h-4" />
          <span>Profile</span>
        </button>
        <button
          onClick={() => setActiveTab('certifications')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'certifications' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Award className="w-4 h-4" />
          <span>Top Certifications</span>
          {profile.topCertifications && profile.topCertifications.length > 0 ? (
            <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-bold">
              {profile.topCertifications.length}/3
            </span>
          ) : null}
        </button>
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'overview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Career Copilot & Twin</span>
        </button>

        <button
          onClick={() => setActiveTab('resume')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'resume'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Resume & Skill Extraction</span>
        </button>

        {/* <button
          onClick={() => setActiveTab('graph')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'graph'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Knowledge Graph (DAG)</span>
        </button> */}

        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'evidence' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ClipboardCheck className="w-4 h-4" />
          <span>Resume Evidence Map</span>
        </button>

        <button
          onClick={() => setActiveTab('jobs')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'jobs'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Recommended Jobs</span>
        </button>

        <button
          onClick={() => setActiveTab('roadmap')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'roadmap'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Learning Roadmap & Gaps</span>
        </button>

        <button
          onClick={() => setActiveTab('ats')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'ats'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileSearch className="w-4 h-4" />
          <span>ATS Scanner & Optimizer</span>
        </button>

        <button
          onClick={() => setActiveTab('interview')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'interview'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Mic className="w-4 h-4" />
          <span>AI Mock Interview</span>
        </button>

        <button
          onClick={() => setActiveTab('applications')}
          className={`flex items-center space-x-2 py-3 px-3.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
            activeTab === 'applications'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Applications</span>
        </button>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Hero Placement Readiness Score Card */}
          <PlacementReadinessCard
            scoreData={profile.placementReadiness}
            onOpenMockInterview={() => setActiveTab('interview')}
            onOpenATSScanner={() => setActiveTab('ats')}
          />

          {/* AI Career Digital Twin Simulator */}
          <DigitalTwinSimulator
            currentScore={profile.placementReadiness.overall}
            availableSkills={[...new Set(careerRoles.flatMap(role => role.criticalMissingSkills || []))]}
            onSimulate={() => {}}
          />

          {/* Career Role Recommendations */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-5 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Recommended Career Roles</h3>
                <p className="text-xs text-slate-500">
                  Match scores are calculated from your saved skills and active job requirements.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('jobs')}
                className="text-xs text-indigo-600 font-semibold hover:underline flex items-center space-x-1"
              >
                <span>Browse Matched Postings</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {careerRoles.length ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-5">
              {careerRoles.map((role, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 hover:bg-white hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                        {role.matchScore}% Match
                      </span>
                      <span className="text-[10px] text-emerald-700 font-bold uppercase">
                        {role.demandLevel} Demand
                      </span>
                    </div>

                    <h4 className="text-sm font-bold text-slate-900">{role.title}</h4>
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{role.description}</p>

                    <div className="mt-3 text-xs font-semibold text-slate-800">
                      Listed compensation: {role.averageSalary}
                    </div>
                  </div>

                  <div className="pt-3 mt-3 border-t border-slate-200/60 text-[10px] text-slate-500">
                    <span className="font-semibold text-slate-700 block mb-0.5">Core Overlap:</span>
                    <span>{role.topOverlappingSkills.join(', ')}</span>
                  </div>
                </div>
              ))}
            </div> : <p className="py-8 text-center text-sm text-slate-500">No active jobs yet. Recommendations will appear when recruiters post roles.</p>}
          </div>
        </div>
      )}

      {activeTab === 'profile' && (
        <StudentProfileEditor
          profile={profile}
          onProfileUpdated={updated => setProfile(updated)}
          onOpenResume={() => setActiveTab('resume')}
        />
      )}

      {activeTab === 'certifications' && (
        <CertificationsManager
          profile={profile}
          onProfileUpdated={updated => setProfile(updated)}
          onNavigateToJobs={() => setActiveTab('jobs')}
        />
      )}

      {activeTab === 'resume' && (
        <ResumeUploader
          profile={profile}
          onProfileUpdated={updated => setProfile(updated)}
        />
      )}

      {activeTab === 'graph' && (
        <LiveSkillKnowledgeGraph
          skills={skillsTaxonomy}
          edges={skillEdges}
          studentProfile={profile}
        />
      )}

      {activeTab === 'evidence' && <ResumeEvidenceMap onOpenResume={() => setActiveTab('resume')} />}

      {activeTab === 'jobs' && <JobRecommendations profile={profile} currentUser={currentUser} />}

      {activeTab === 'roadmap' && <SkillGapRoadmap />}

      {activeTab === 'ats' && <ATSScanner profile={profile} />}

      {activeTab === 'interview' && <MockInterviewRoom profile={profile} />}

      {activeTab === 'applications' && <ApplicationsView />}
    </div>
  );
};
