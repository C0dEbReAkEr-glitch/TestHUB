import { useState, useEffect } from 'react';
import { authService } from '../../services/auth';
import { api } from '../../services/api';
import { Test, User, Domain } from '../../types';
import { BookOpen, Clock, Trophy, Play, Settings } from 'lucide-react';
import Layout from '../Layout';
import TestInterface from './TestInterface';
import ProgressReport from './ProgressReport';
import ChangePassword from '../Common/ChangePassword';

export default function StudentDashboard() {
  const user = authService.getCurrentUser();
  const [tests, setTests] = useState<Test[]>([]);
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [completedTests, setCompletedTests] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'tests' | 'progress' | 'settings'>('tests');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      if (user) {
        try {
          // Load tests for the first domain and section (guard values)
          const domain0 = Array.isArray(user.domain) && user.domain.length > 0 ? user.domain[0] : undefined;
          if (domain0) {
            const sectionStr = user.section ?? '';
            const availableTests = await api.getTestsForStudent(domain0, sectionStr);
            setTests(availableTests);
            
            // Check completion status for each test
            const completedSet = new Set<string>();
            for (const test of availableTests) {
              console.log('Checking completion for test:', test.id);
              try {
                const response = await fetch(`http://localhost:3001/api/test-completion/${test.id}/${user.id}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.hasCompleted) {
                    completedSet.add(test.id);
                  }
                }
              } catch (error) {
                console.error('Error checking test completion:', error);
              }
            }
            setCompletedTests(completedSet);
          }
        } catch (error) {
          console.error('Error loading data:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadData();
  }, [user]);

  const handleStartTest = (test: Test) => {
    if (completedTests.has(test.id)) {
      alert('You have already attempted this quiz. You can only attempt each quiz once.');
      return;
    }
    setSelectedTest(test);
  };

  const handleTestComplete = (testId: string) => {
    setCompletedTests(prev => new Set([...prev, testId]));
    setSelectedTest(null);
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">User data not found. Please try logging in again.</p>
        </div>
      </Layout>
    );
  }

  if (selectedTest) {
    const studentUser: User = {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      domain: (Array.isArray(user.domain) ? user.domain : []) as Domain[],
      section: (user.section as 'A' | 'B') || 'A',
      createdAt: ((user as any).createdAt as string) || new Date().toISOString()
    };

    return <TestInterface test={selectedTest} user={studentUser} onComplete={() => handleTestComplete(selectedTest.id)} />;
  }

  return (
    <Layout title={`Welcome, ${user.name}`}>
      <div className="space-y-6">
        {/* User Info Card */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-blue-100">{user.domain.join(', ')} - Section {user.section}</p>
              <p className="text-blue-200 text-sm">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{tests.length}</div>
              <div className="text-blue-100 text-sm">Available Tests</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'tests' as const, label: 'Available Tests', icon: BookOpen },
            { id: 'progress' as const, label: 'Progress Report', icon: Trophy },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }: { id: 'tests' | 'progress' | 'settings'; label: string; icon: React.ComponentType<any> }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
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
        {activeTab === 'tests' && (
          <div className="space-y-4">
            {tests.length === 0 ? (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Available</h3>
                <p className="text-gray-600">Check back later for new tests from your faculty.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {tests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-1">{test.title}</h3>
                        <p className="text-sm text-gray-600">{test.subject}</p>
                      </div>
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {test.domain}
                      </span>
                    </div>
                    
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="h-4 w-4 mr-2" />
                        <span>{test.duration} minutes</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>{test.questions.length} questions</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Trophy className="h-4 w-4 mr-2" />
                        <span>{test.totalMarks} marks</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleStartTest(test)}
                      className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                        completedTests.has(test.id)
                          ? 'bg-gray-400 text-white cursor-not-allowed'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                      disabled={completedTests.has(test.id)}
                    >
                      <Play className="h-4 w-4" />
                      <span>{completedTests.has(test.id) ? 'Already Submitted' : 'Start Test'}</span>
                    </button>
                    {completedTests.has(test.id) && (
                      <div className="mt-2 text-center">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          ✓ Exam Submitted - Results Only
                        </span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'progress' && <ProgressReport studentId={user.id} />}
        {activeTab === 'settings' && <ChangePassword />}
      </div>
    </Layout>
  );
}