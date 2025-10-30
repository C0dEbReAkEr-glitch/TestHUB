import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { TestAttempt } from '../../types';
import { Download, Users, Trophy, BarChart3 } from 'lucide-react';
import * as XLSX from 'xlsx';

export default function TestResults() {
  const [selectedTestId, setSelectedTestId] = useState('');
  const [results, setResults] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(false);

  // loadResults was inlined into useEffect to avoid stale dependency warnings

  useEffect(() => {
    (async () => {
      if (!selectedTestId) return;
      setLoading(true);
      try {
        const testResults = await api.getTestResults(selectedTestId);
        setResults(testResults);
      } catch (error) {
        console.error('Error loading results:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [selectedTestId]);

  const downloadResults = () => {
    if (results.length === 0) return;

    const data = results.map((result, index) => ({
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
    
    XLSX.writeFile(wb, `test-results-${selectedTestId}-${Date.now()}.xlsx`);
  };

  const averageScore = results.length > 0 
    ? results.reduce((sum, result) => sum + (result.score / result.totalQuestions) * 100, 0) / results.length
    : 0;

  const highestScore = results.length > 0 
    ? Math.max(...results.map(result => (result.score / result.totalQuestions) * 100))
    : 0;

  return (
    <div className="space-y-6">
      {/* Test Selection */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
          {results.length > 0 && (
            <button
              onClick={downloadResults}
              className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download Excel</span>
            </button>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Test
          </label>
          <input
            type="text"
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter Test ID"
          />
          <p className="text-sm text-gray-500 mt-1">
            Enter the Test ID to view results. You can find Test IDs from your created tests.
          </p>
        </div>
      </div>

      {/* Statistics */}
      {results.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm">Total Students</p>
                <p className="text-2xl font-bold">{results.length}</p>
              </div>
              <Users className="h-8 w-8 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm">Average Score</p>
                <p className="text-2xl font-bold">{averageScore.toFixed(1)}%</p>
              </div>
              <BarChart3 className="h-8 w-8 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm">Highest Score</p>
                <p className="text-2xl font-bold">{highestScore.toFixed(1)}%</p>
              </div>
              <Trophy className="h-8 w-8 text-purple-200" />
            </div>
          </div>
        </div>
      )}

      {/* Results Table */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : results.length === 0 ? (
        selectedTestId && (
          <div className="text-center py-12">
            <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Found</h3>
            <p className="text-gray-600">No students have attempted this test yet.</p>
          </div>
        )
      ) : (
        <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h4 className="text-lg font-medium text-gray-900">Student Results</h4>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Completed At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => {
                  const percentage = (result.score / result.totalQuestions) * 100;
                  const timeSpentMinutes = Math.floor(result.timeSpent / 60);
                  
                  return (
                    <tr key={result.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 && (
                            <Trophy className={`h-4 w-4 mr-2 ${
                              index === 0 ? 'text-yellow-500' :
                              index === 1 ? 'text-gray-400' : 'text-orange-600'
                            }`} />
                          )}
                          <span className="text-sm font-medium text-gray-900">
                            {index + 1}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {result.studentName}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {result.score}/{result.totalQuestions}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          percentage >= 80 ? 'bg-green-100 text-green-800' :
                          percentage >= 60 ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {percentage.toFixed(1)}%
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {timeSpentMinutes} min
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(result.completedAt).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}