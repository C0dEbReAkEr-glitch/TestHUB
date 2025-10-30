import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { api } from '../../services/api';
import { User } from '../../types';
import { BookOpen, Plus, BarChart3, Settings, Brain, History } from 'lucide-react';
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
  const [activeTab, setActiveTab] = useState<'questions' | 'ai-generator' | 'tests' | 'history' | 'results' | 'settings'>('questions');
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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!facultyUser) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">User data not found. Please try logging in again.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Faculty Dashboard - ${facultyUser.name}`}>
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{facultyUser.name}</h3>
              <p className="text-purple-100">Faculty - {facultyUser.domain.join(', ')}</p>
              <p className="text-purple-200 text-sm">{facultyUser.email}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Faculty</div>
              <div className="text-purple-100 text-sm">Dashboard</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
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
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'questions' && <QuestionBank user={facultyUser} />}
        {activeTab === 'ai-generator' && <AIQuestionGenerator user={facultyUser} />}
        {activeTab === 'tests' && <CreateTest user={facultyUser} />}
        {activeTab === 'history' && <TestHistory user={facultyUser} />}
  {activeTab === 'results' && <TestResults />}
        {activeTab === 'settings' && <ChangePassword />}
      </div>
    </Layout>
  );
}