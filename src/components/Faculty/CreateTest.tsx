import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question, User, Domain, SUBJECTS } from '../../types';
import { Plus, Trash2, BookOpen } from 'lucide-react';

interface CreateTestProps {
  user: User;
}

export default function CreateTest({ user }: CreateTestProps) {
  const [testData, setTestData] = useState({
    title: '',
    domain: user.domain[0] as Domain,
    subject: '',
    section: 'both' as 'A' | 'B' | 'both',
    randomizeQuestions: false,
    questionPoolSize: 0,
    duration: 60,
    timePerQuestion: 0,
    scheduledDate: '',
    scheduledTime: '',
    isScheduled: false,
    selectedQuestions: [] as Question[]
  });

  const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdTestId, setCreatedTestId] = useState<string | null>(null);

  const availableSubjects = SUBJECTS.filter(s => s.domain === testData.domain);

  useEffect(() => {
    if (testData.domain && testData.subject) {
      loadQuestions();
    }
  }, [testData.domain, testData.subject]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const questions = await api.getQuestionsByDomainAndSubject(testData.domain, testData.subject);
      setAvailableQuestions(questions);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = (question: Question) => {
    if (!testData.selectedQuestions.find(q => q.id === question.id)) {
      setTestData(prev => ({
        ...prev,
        selectedQuestions: [...prev.selectedQuestions, question]
      }));
    }
  };

  const handleRemoveQuestion = (questionId: string) => {
    setTestData(prev => ({
      ...prev,
      selectedQuestions: prev.selectedQuestions.filter(q => q.id !== questionId)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (testData.selectedQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.createTest({
        title: testData.title,
        domain: testData.domain,
        subject: testData.subject,
        section: testData.section,
        questions: testData.selectedQuestions,
        randomizeQuestions: testData.randomizeQuestions,
        questionPoolSize: testData.questionPoolSize || undefined,
        duration: testData.duration,
        timePerQuestion: testData.timePerQuestion || undefined,
        totalMarks: testData.selectedQuestions.length,
        createdBy: user.id,
        scheduledDate: testData.scheduledDate || null,
        scheduledTime: testData.scheduledTime || null,
        isScheduled: testData.isScheduled,
        isActive: !testData.isScheduled // If scheduled, set inactive until scheduled time
      });

      setCreatedTestId(response.testId);

      // Reset form
      setTestData({
        title: '',
        domain: user.domain[0],
        subject: '',
        section: 'both',
        randomizeQuestions: false,
        questionPoolSize: 0,
        duration: 60,
        timePerQuestion: 0,
        scheduledDate: '',
        scheduledTime: '',
        isScheduled: false,
        selectedQuestions: []
      });

      alert(`Test created successfully!\nTest ID: ${response.testId}\nTitle: ${response.title}`);
    } catch (error) {
      console.error('Error creating test:', error);
      alert('Error creating test. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success Message with Test ID */}
      {createdTestId && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-medium text-green-800">Test Created Successfully!</h3>
              <div className="mt-1 text-sm text-green-700">
                <p><strong>Test ID:</strong> {createdTestId}</p>
                <p className="text-xs text-green-600 mt-1">Save this Test ID to view results later</p>
              </div>
            </div>
            <button
              onClick={() => setCreatedTestId(null)}
              className="ml-auto text-green-400 hover:text-green-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">Create New Test</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Test Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title
              </label>
              <input
                type="text"
                value={testData.title}
                onChange={(e) => setTestData(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter test title"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Duration (minutes)
              </label>
              <input
                type="number"
                value={testData.duration}
                onChange={(e) => setTestData(prev => ({ ...prev, duration: parseInt(e.target.value) }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time per Question (seconds) - Optional
              </label>
              <input
                type="number"
                value={testData.timePerQuestion}
                onChange={(e) => setTestData(prev => ({ ...prev, timePerQuestion: parseInt(e.target.value) || 0 }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
                placeholder="0 = No limit per question"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Domain
              </label>
              <select
                value={testData.domain}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  domain: e.target.value as Domain,
                  subject: '',
                  selectedQuestions: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {user.domain.map(domain => (
                  <option key={domain} value={domain}>{domain}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <select
                value={testData.subject}
                onChange={(e) => setTestData(prev => ({ 
                  ...prev, 
                  subject: e.target.value,
                  selectedQuestions: []
                }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Subject</option>
                {availableSubjects.map(subject => (
                  <option key={subject.name} value={subject.name}>{subject.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Section
              </label>
              <select
                value={testData.section}
                onChange={(e) => setTestData(prev => ({ ...prev, section: e.target.value as 'A' | 'B' | 'both' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="both">Both Sections</option>
                <option value="A">Section A</option>
                <option value="B">Section B</option>
              </select>
            </div>
          </div>

          {/* Question Randomization */}
          <div className="border-t pt-4">
            <h4 className="text-md font-medium text-gray-900 mb-4">Question Settings</h4>
            
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="randomizeQuestions"
                  checked={testData.randomizeQuestions}
                  onChange={(e) => setTestData(prev => ({ ...prev, randomizeQuestions: e.target.checked }))}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="randomizeQuestions" className="text-sm font-medium text-gray-700">
                  Randomize question order for each student
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Pool Size (Optional)
                </label>
                <input
                  type="number"
                  value={testData.questionPoolSize}
                  onChange={(e) => setTestData(prev => ({ ...prev, questionPoolSize: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  max={testData.selectedQuestions.length}
                  placeholder={`0 = Use all ${testData.selectedQuestions.length} questions`}
                />
                <p className="text-sm text-gray-500 mt-1">
                  If set, randomly select this many questions from the selected pool for each student
                </p>
              </div>
            </div>
          </div>

          {/* Scheduling Options */}
          <div className="border-t pt-4">
            <div className="flex items-center space-x-3 mb-4">
              <input
                type="checkbox"
                id="isScheduled"
                checked={testData.isScheduled}
                onChange={(e) => setTestData(prev => ({ ...prev, isScheduled: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isScheduled" className="text-sm font-medium text-gray-700">
                Schedule this test for later
              </label>
            </div>

            {testData.isScheduled && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Date
                  </label>
                  <input
                    type="date"
                    value={testData.scheduledDate}
                    onChange={(e) => setTestData(prev => ({ ...prev, scheduledDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min={new Date().toISOString().split('T')[0]}
                    required={testData.isScheduled}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="time"
                    value={testData.scheduledTime}
                    onChange={(e) => setTestData(prev => ({ ...prev, scheduledTime: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required={testData.isScheduled}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Selected Questions */}
          {testData.selectedQuestions.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-900 mb-4">
                Selected Questions ({testData.selectedQuestions.length})
              </h4>
              <div className="space-y-3 max-h-60 overflow-y-auto">
                {testData.selectedQuestions.map((question, index) => (
                  <div key={question.id} className="flex items-start justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        {index + 1}. {question.question}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                          {question.difficulty}
                        </span>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                          {question.type.replace('-', ' ')}
                        </span>
                        {question.timeLimit && question.timeLimit > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            {question.timeLimit}s limit
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(question.id)}
                      className="ml-3 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={submitting || testData.selectedQuestions.length === 0}
              className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>Create Test</span>
            </button>
          </div>
        </form>
      </div>

      {/* Available Questions */}
      {testData.subject && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-md font-medium text-gray-900 mb-4">
            Available Questions - {testData.subject}
          </h4>
          
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : availableQuestions.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-600">No questions available for this subject.</p>
              <p className="text-gray-500 text-sm">Add questions to the question bank first.</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {availableQuestions.map((question, index) => {
                const isSelected = testData.selectedQuestions.find(q => q.id === question.id);
                
                return (
                  <div
                    key={question.id}
                    className={`p-4 border rounded-lg transition-all ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 mb-2">
                          {index + 1}. {question.question}
                        </p>
                        <div className="flex items-center space-x-2">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            {question.difficulty}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => isSelected ? handleRemoveQuestion(question.id) : handleAddQuestion(question)}
                        className={`ml-3 px-3 py-1 text-sm font-medium rounded transition-colors ${
                          isSelected
                            ? 'bg-red-100 text-red-700 hover:bg-red-200'
                            : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        }`}
                      >
                        {isSelected ? 'Remove' : 'Add'}
                      </button>
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">
                        {question.type.replace('-', ' ')}
                      </span>
                      {question.timeLimit && question.timeLimit > 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                          {question.timeLimit}s
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}