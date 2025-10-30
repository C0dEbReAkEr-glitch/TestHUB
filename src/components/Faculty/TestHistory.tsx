import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Test, User } from '../../types';
import { Calendar, Clock, Users, Eye, ToggleLeft, ToggleRight, Download, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';

interface TestHistoryProps {
  user: User;
}

export default function TestHistory({ user }: TestHistoryProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTestResults, setSelectedTestResults] = useState<any[]>([]);
  const [showResults, setShowResults] = useState(false);
  const [selectedTestTitle, setSelectedTestTitle] = useState('');

  useEffect(() => {
    const loadTests = async () => {
      try {
        const facultyTests = await api.getFacultyTests(user.id);
        setTests(facultyTests);
      } catch (error) {
        console.error('Error loading tests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTests();
  }, [user.id]);

  const handleToggleStatus = async (testId: string, currentStatus: boolean) => {
    try {
      await api.updateTestStatus(testId, !currentStatus);
      setTests(prev => prev.map(test => 
        test.id === testId ? { ...test, isActive: !currentStatus } : test
      ));
    } catch (error) {
      console.error('Error updating test status:', error);
      alert('Error updating test status');
    }
  };

  const viewResults = async (testId: string, testTitle: string) => {
    try {
      const results = await api.getTestResults(testId);
      setSelectedTestResults(results);
      setSelectedTestTitle(testTitle);
      setShowResults(true);
    } catch (error) {
      console.error('Error loading test results:', error);
      alert('Error loading test results');
    }
  };

  const downloadResults = (_testId: string, testTitle: string) => {
    if (selectedTestResults.length === 0) return;

    const data = selectedTestResults.map((result, index) => ({
      'Rank': index + 1,
      'Student Name': result.studentName,
      'Score': result.score,
      'Total Questions': result.totalQuestions,
      'Percentage': ((result.score / result.totalQuestions) * 100).toFixed(1) + '%',
      'Time Spent (minutes)': Math.floor(result.timeSpent / 60),
      'Tab Switches': result.tabSwitchCount || 0,
      'Warnings': result.warningCount || 0,
      'Completed At': new Date(result.completedAt).toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Test Results');
    
    XLSX.writeFile(wb, `${testTitle}-results-${Date.now()}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (showResults) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowResults(false)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <span>← Back to Test History</span>
          </button>
          <button
            onClick={() => downloadResults(selectedTestResults[0]?.testId, selectedTestTitle)}
            className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Download className="h-4 w-4" />
            <span>Download Results</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Results for: {selectedTestTitle}
          </h3>
          
          {selectedTestResults.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No students have attempted this test yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {selectedTestResults.map((result, index) => {
                    const percentage = (result.score / result.totalQuestions) * 100;
                    return (
                      <tr key={result.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 text-sm font-medium text-gray-900">#{index + 1}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{result.studentName}</td>
                        <td className="px-6 py-4 text-sm text-gray-900">{result.score}/{result.totalQuestions}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            percentage >= 80 ? 'bg-green-100 text-green-800' :
                            percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {percentage.toFixed(1)}%
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-900">{Math.floor(result.timeSpent / 60)} min</td>
                        <td className="px-6 py-4 text-sm text-gray-900">
                          {new Date(result.completedAt).toLocaleDateString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-gray-900">Test History</h3>
        <div className="text-sm text-gray-600">
          Total Tests: {tests.length}
        </div>
      </div>

      {tests.length === 0 ? (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Tests Created Yet</h3>
          <p className="text-gray-600">Create your first test to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tests.map((test) => (
            <div key={test.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-semibold text-gray-900">{test.title}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      test.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {test.isActive ? 'Active' : 'Inactive'}
                    </span>
                    {test.isScheduled && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Scheduled
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600 mb-3">
                    <div><span className="font-medium">Domain:</span> {test.domain}</div>
                    <div><span className="font-medium">Subject:</span> {test.subject}</div>
                    <div><span className="font-medium">Section:</span> {test.section}</div>
                    <div><span className="font-medium">Duration:</span> {test.duration} min</div>
                  </div>

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="h-4 w-4" />
                      <span>{test.questions.length} questions</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(test.createdAt).toLocaleDateString()}</span>
                    </div>
                    {test.isScheduled && test.scheduledDate && (
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>
                          Scheduled: {new Date(test.scheduledDate).toLocaleDateString()}
                          {test.scheduledTime && ` at ${test.scheduledTime}`}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => viewResults(test.id, test.title)}
                    className="flex items-center space-x-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Eye className="h-4 w-4" />
                    <span>View Results</span>
                  </button>
                  
                  <button
                    onClick={() => handleToggleStatus(test.id, test.isActive)}
                    className={`flex items-center space-x-1 px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      test.isActive 
                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                        : 'bg-green-100 text-green-700 hover:bg-green-200'
                    }`}
                  >
                    {test.isActive ? (
                      <>
                        <ToggleRight className="h-4 w-4" />
                        <span>Deactivate</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-4 w-4" />
                        <span>Activate</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Test ID Display */}
              <div className="bg-gray-50 rounded-lg p-3 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Test ID</p>
                    <p className="text-lg font-mono text-blue-600">{test.id}</p>
                  </div>
                  <button
                    onClick={() => navigator.clipboard.writeText(test.id)}
                    className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                  >
                    Copy ID
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Use this ID to view test results and analytics
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}