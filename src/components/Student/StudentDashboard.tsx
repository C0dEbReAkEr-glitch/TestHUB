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
          const domain0 = Array.isArray(user.domain) && user.domain.length > 0 ? user.domain[0] : undefined;
          if (domain0) {
            const sectionStr = user.section ?? '';
            const availableTests = await api.getTestsForStudent(domain0, sectionStr);
            setTests(availableTests);

            const completedSet = new Set<string>();
            for (const test of availableTests) {
              try {
                const response = await fetch(`http://localhost:3001/api/test-completion/${test.id}/${user.id}`);
                if (response.ok) {
                  const data = await response.json();
                  if (data.hasCompleted) completedSet.add(test.id);
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
      alert('You have already attempted this quiz.');
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
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-primary border-t-transparent"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-textSecondary">User data not found. Please try logging in again.</p>
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
      <div className="space-y-8">
        {/* Profile Header */}
        <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 text-white shadow-medium">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-semibold">{user.name}</h3>
              <p className="text-sm opacity-90">{user.domain.join(', ')} • Section {user.section}</p>
              <p className="text-xs opacity-80">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold">{tests.length}</div>
              <div className="text-sm opacity-90">Available Tests</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-2 bg-muted p-1 rounded-xl shadow-soft">
          {[
            { id: 'tests' as const, label: 'Available Tests', icon: BookOpen },
            { id: 'progress' as const, label: 'Progress Report', icon: Trophy },
            { id: 'settings' as const, label: 'Settings', icon: Settings },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-all duration-200 ${
                activeTab === id
                  ? 'bg-surface text-primary shadow-medium'
                  : 'text-textSecondary hover:text-textPrimary hover:bg-background'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'tests' && (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {tests.length === 0 ? (
              <div className="col-span-full text-center py-12">
                <BookOpen className="h-16 w-16 text-borderMuted mx-auto mb-4" />
                <h3 className="text-lg font-medium text-textPrimary mb-2">No Tests Available</h3>
                <p className="text-textSecondary">Check back later for new tests from your faculty.</p>
              </div>
            ) : (
              tests.map((test) => (
                <div
                  key={test.id}
                  className="bg-surface border border-borderLight rounded-2xl p-6 shadow-soft hover:shadow-medium transition-all duration-200"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-textPrimary mb-1">{test.title}</h3>
                      <p className="text-sm text-textSecondary">{test.subject}</p>
                    </div>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                      {test.domain}
                    </span>
                  </div>

                  <div className="space-y-2 mb-6 text-sm text-textSecondary">
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-primary" />
                      <span>{test.duration} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-primary" />
                      <span>{test.questions.length} questions</span>
                    </div>
                    <div className="flex items-center">
                      <Trophy className="h-4 w-4 mr-2 text-primary" />
                      <span>{test.totalMarks} marks</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleStartTest(test)}
                    disabled={completedTests.has(test.id)}
                    className={`w-full flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                      completedTests.has(test.id)
                        ? 'bg-borderMuted text-white cursor-not-allowed'
                        : 'bg-primary text-white hover:bg-primaryHover'
                    }`}
                  >
                    <Play className="h-4 w-4" />
                    <span>{completedTests.has(test.id) ? 'Already Submitted' : 'Start Test'}</span>
                  </button>

                  {completedTests.has(test.id) && (
                    <div className="mt-2 text-center">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/20">
                        ✓ Exam Submitted
                      </span>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'progress' && <ProgressReport studentId={user.id} />}
        {activeTab === 'settings' && <ChangePassword />}
      </div>
    </Layout>
  );
}
