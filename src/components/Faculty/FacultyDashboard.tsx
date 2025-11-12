import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { api } from '../../services/api';
import { User } from '../../types';
import {
  BookOpen,
  Plus,
  BarChart3,
  Settings,
  Brain,
  History,
} from 'lucide-react';
import Layout from '../Layout';
import CreateTest from './CreateTest';
import TestResults from './TestResults';
import QuestionBank from './QuestionBank';
import AIQuestionGenerator from './AIQuestionGenerator';
import ChangePassword from '../Common/ChangePassword';
import TestHistory from './TestHistory';

export default function FacultyDashboard() {
  const authenticatedUser = authService.getCurrentUser();
  const [facultyUser, setFacultyUser] = useState<User | null>(null);
  const [activeTab, setActiveTab] = useState<
    'questions' | 'ai-generator' | 'tests' | 'history' | 'results' | 'settings'
  >('questions');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUserData = async () => {
      if (authenticatedUser?.email) {
        try {
          const userData = await api.getUserByEmail(authenticatedUser.email);
          setFacultyUser(userData);
        } catch (error) {
          console.error('Error loading user data:', error);
        } finally {
          setLoading(false);
        }
      }
    };
    loadUserData();
  }, [authenticatedUser]);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!facultyUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-textSecondary">
            User data not found. Please try logging in again.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Faculty Dashboard - ${facultyUser.name}`}>
      <div className="space-y-8">
        {/* 🌿 Faculty Info Header */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-medium">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold">{facultyUser.name}</h3>
              <p className="text-sm opacity-90">
                Faculty • {facultyUser.domain.join(', ')}
              </p>
              <p className="text-xs opacity-80">{facultyUser.email}</p>
            </div>
            <div className="text-right md:text-left">
              <div className="text-3xl font-bold">Faculty</div>
              <div className="text-sm opacity-90">Dashboard</div>
            </div>
          </div>
        </div>

        {/* 🧭 Navigation Tabs */}
        <div className="flex flex-wrap justify-between gap-2 bg-muted p-2 rounded-xl shadow-soft">
          {[
            { id: 'questions', label: 'Question Bank', icon: BookOpen },
            { id: 'ai-generator', label: 'AI Generator', icon: Brain },
            { id: 'tests', label: 'Create Test', icon: Plus },
            { id: 'history', label: 'Test History', icon: History },
            { id: 'results', label: 'Test Results', icon: BarChart3 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 min-w-[150px] flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-surface text-primary shadow-medium border border-borderPrimary'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-background'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* 📊 Active Tab Content */}
        <div className="bg-surface border border-borderLight rounded-2xl shadow-soft p-6 transition-all">
          {activeTab === 'questions' && <QuestionBank user={facultyUser} />}
          {activeTab === 'ai-generator' && (
            <AIQuestionGenerator user={facultyUser} />
          )}
          {activeTab === 'tests' && <CreateTest user={facultyUser} />}
          {activeTab === 'history' && <TestHistory user={facultyUser} />}
          {activeTab === 'results' && <TestResults />}
          {activeTab === 'settings' && <ChangePassword />}
        </div>
      </div>
    </Layout>
  );
}
