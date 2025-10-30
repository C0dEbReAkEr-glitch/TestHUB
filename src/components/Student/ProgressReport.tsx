import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TestAttempt } from '../../types';
import { Trophy, Clock, Calendar, TrendingUp } from 'lucide-react';

interface ProgressReportProps {
  studentId: string;
}

export default function ProgressReport({ studentId }: ProgressReportProps) {
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProgress = async () => {
      try {
        const progressData = await api.getStudentProgress(studentId);
        setAttempts(progressData);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [studentId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (attempts.length === 0) {
    return (
      <div className="text-center py-12">
        <Trophy className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Test Attempts Yet</h3>
        <p className="text-gray-600">Start taking tests to see your progress here.</p>
      </div>
    );
  }

  const totalAttempts = attempts.length;
  const averageScore = attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalQuestions) * 100, 0) / totalAttempts;
  const bestScore = Math.max(...attempts.map(attempt => (attempt.score / attempt.totalQuestions) * 100));

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm">Total Tests</p>
              <p className="text-2xl font-bold">{totalAttempts}</p>
            </div>
            <Trophy className="h-8 w-8 text-blue-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm">Average Score</p>
              <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-200" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm">Best Score</p>
              <p className="text-2xl font-bold">{bestScore.toFixed(1)}%</p>
            </div>
            <Trophy className="h-8 w-8 text-purple-200" />
          </div>
        </div>
      </div>

      {/* Test History */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Test History</h3>
        </div>
        <div className="divide-y divide-gray-200">
          {attempts.map((attempt) => {
            const percentage = (attempt.score / attempt.totalQuestions) * 100;
            const timeSpentMinutes = Math.floor(attempt.timeSpent / 60);
            
            return (
              <div key={attempt.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="text-sm font-medium text-gray-900">Test #{attempt.testId}</h4>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>{new Date(attempt.completedAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{timeSpentMinutes} min</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-semibold text-gray-900">
                      {attempt.score}/{attempt.totalQuestions}
                    </div>
                    <div className={`text-sm font-medium ${
                      percentage >= 80 ? 'text-green-600' :
                      percentage >= 60 ? 'text-yellow-600' : 'text-red-600'
                    }`}>
                      {percentage.toFixed(1)}%
                    </div>
                  </div>
                </div>
                
                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${
                        percentage >= 80 ? 'bg-green-500' :
                        percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}