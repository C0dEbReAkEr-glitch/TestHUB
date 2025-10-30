import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Question, User, Domain, SUBJECTS } from '../../types';
import { Plus, BookOpen, Upload } from 'lucide-react';

interface QuestionBankProps {
  user: User;
}

export default function QuestionBank({ user }: QuestionBankProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<Domain>(user.domain[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(false);

  const [newQuestion, setNewQuestion] = useState({
    question: '',
    type: 'multiple-choice' as 'multiple-choice' | 'true-false' | 'fill-blank',
    options: ['', '', '', ''],
    correctAnswer: 0,
    correctAnswerText: '',
    domain: user.domain[0],
    subject: '',
    difficulty: 'medium' as 'easy' | 'medium' | 'hard',
    timeLimit: 0
  });

  const availableSubjects = SUBJECTS.filter(s => s.domain === selectedDomain);

  useEffect(() => {
    if (selectedDomain && selectedSubject) {
      loadQuestions();
    }
  }, [selectedDomain, selectedSubject]);

  const loadQuestions = async () => {
    setLoading(true);
    try {
      const questionData = await api.getQuestionsByDomainAndSubject(selectedDomain, selectedSubject);
      setQuestions(questionData);
    } catch (error) {
      console.error('Error loading questions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newQuestion.type === 'multiple-choice' && newQuestion.options.some(opt => opt.trim() === '')) {
      alert('Please fill all options');
      return;
    }
    
    if (newQuestion.type === 'fill-blank' && !newQuestion.correctAnswerText.trim()) {
      alert('Please provide the correct answer for fill-in-the-blank question');
      return;
    }

    try {
      await api.createQuestion({
        ...newQuestion,
        createdBy: user.id
      });
      
      setNewQuestion({
        question: '',
        type: 'multiple-choice',
        options: ['', '', '', ''],
        correctAnswer: 0,
        correctAnswerText: '',
        domain: user.domain[0],
        subject: '',
        difficulty: 'medium',
        timeLimit: 0
      });
      
      setShowAddForm(false);
      if (selectedDomain && selectedSubject) {
        loadQuestions();
      }
      
      alert('Question added successfully!');
    } catch (error) {
      console.error('Error adding question:', error);
      alert('Error adding question. Please try again.');
    }
  };

  const handleImportQuestions = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!selectedDomain || !selectedSubject) {
      alert('Please select domain and subject before importing');
      return;
    }

    const formData = new FormData();
    formData.append('file', file);
    formData.append('domain', selectedDomain);
    formData.append('subject', selectedSubject);
    formData.append('createdBy', user.id);

    setLoading(true);
    try {
      console.log('Importing questions for:', { domain: selectedDomain, subject: selectedSubject, createdBy: user.id });
      
      const response = await fetch('http://localhost:3001/api/questions/import', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        console.log('Import result:', result);
        
        if (result.errors && result.errors.length > 0) {
          alert(`${result.message}\n\nErrors:\n${result.errors.slice(0, 5).join('\n')}`);
        } else {
          alert(result.message || 'Questions imported successfully!');
        }
        
        // Reload questions to show imported ones
        loadQuestions();
      } else {
        const error = await response.json();
        console.error('Import failed:', error);
        alert(error.error || 'Import failed. Please check your file format.');
      }
    } catch (error) {
      console.error('Error importing questions:', error);
      alert('Import failed. Please try again.');
    } finally {
      setLoading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Domain
            </label>
            <select
              value={selectedDomain}
              onChange={(e) => {
                setSelectedDomain(e.target.value as Domain);
                setSelectedSubject('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select Subject</option>
              {availableSubjects.map(subject => (
                <option key={subject.name} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add Question Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Questions {selectedSubject && `- ${selectedSubject}`}
        </h3>
        <div className="flex space-x-3">
          <label className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors cursor-pointer">
            <Upload className="h-4 w-4" />
            <span>{loading ? 'Importing...' : 'Import CSV/Excel'}</span>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleImportQuestions}
              className="hidden"
              disabled={loading}
            />
          </label>
          <button
            onClick={() => setShowAddForm(true)}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Add Question</span>
          </button>
        </div>
      </div>

      {/* Add Question Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h4 className="text-lg font-medium text-gray-900 mb-4">Add New Question</h4>
          
          <form onSubmit={handleAddQuestion} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Domain
                </label>
                <select
                  value={newQuestion.domain}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, domain: e.target.value as Domain }))}
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
                  value={newQuestion.subject}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, subject: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                >
                  <option value="">Select Subject</option>
                  {SUBJECTS.filter(s => s.domain === newQuestion.domain).map(subject => (
                    <option key={subject.name} value={subject.name}>{subject.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Question Type
                </label>
                <select
                  value={newQuestion.type}
                  onChange={(e) => setNewQuestion(prev => ({ 
                    ...prev, 
                    type: e.target.value as 'multiple-choice' | 'true-false' | 'fill-blank',
                    options: e.target.value === 'true-false' ? ['True', 'False'] : ['', '', '', ''],
                    correctAnswer: 0
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="true-false">True/False</option>
                  <option value="fill-blank">Fill in the Blank</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Difficulty
                </label>
                <select
                  value={newQuestion.difficulty}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, difficulty: e.target.value as 'easy' | 'medium' | 'hard' }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="easy">Easy</option>
                  <option value="medium">Medium</option>
                  <option value="hard">Hard</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Time Limit (seconds) - Optional
                </label>
                <input
                  type="number"
                  value={newQuestion.timeLimit}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, timeLimit: parseInt(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                  placeholder="0 = No limit"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Question
              </label>
              <textarea
                value={newQuestion.question}
                onChange={(e) => setNewQuestion(prev => ({ ...prev, question: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
                placeholder="Enter your question here..."
                required
              />
            </div>

            {newQuestion.type === 'multiple-choice' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Options
                </label>
                <div className="space-y-2">
                  {newQuestion.options.map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                        className="text-blue-600"
                      />
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => {
                          const newOptions = [...newQuestion.options];
                          newOptions[index] = e.target.value;
                          setNewQuestion(prev => ({ ...prev, options: newOptions }));
                        }}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">Select the correct answer by clicking the radio button</p>
              </div>
            )}

            {newQuestion.type === 'true-false' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <div className="space-y-2">
                  {['True', 'False'].map((option, index) => (
                    <div key={index} className="flex items-center space-x-3">
                      <input
                        type="radio"
                        name="correctAnswer"
                        checked={newQuestion.correctAnswer === index}
                        onChange={() => setNewQuestion(prev => ({ ...prev, correctAnswer: index }))}
                        className="text-blue-600"
                      />
                      <span className="text-gray-700">{option}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {newQuestion.type === 'fill-blank' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Correct Answer
                </label>
                <input
                  type="text"
                  value={newQuestion.correctAnswerText}
                  onChange={(e) => setNewQuestion(prev => ({ ...prev, correctAnswerText: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter the correct answer"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Students will need to type this exact answer</p>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Add Question
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Questions List */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Questions Found</h3>
          <p className="text-gray-600">
            {selectedSubject ? 'Add questions for this subject to get started.' : 'Select a subject to view questions.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.id} className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 mb-2">
                    {index + 1}. {question.question}
                  </h4>
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {question.domain}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {question.difficulty}
                    </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      {question.type.replace('-', ' ')}
                    </span>
                    {question.timeLimit && question.timeLimit > 0 && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        {question.timeLimit}s limit
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              {question.type === 'multiple-choice' && question.options && (
                <div className="space-y-2">
                  {question.options.map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border ${
                        optIndex === question.correctAnswer
                          ? 'border-green-200 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{String.fromCharCode(65 + optIndex)}.</span>
                        <span>{option}</span>
                        {optIndex === question.correctAnswer && (
                          <span className="text-green-600 text-sm font-medium">(Correct)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'true-false' && (
                <div className="space-y-2">
                  {['True', 'False'].map((option, optIndex) => (
                    <div
                      key={optIndex}
                      className={`p-3 rounded-lg border ${
                        optIndex === question.correctAnswer
                          ? 'border-green-200 bg-green-50 text-green-800'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="font-medium">{option}</span>
                        {optIndex === question.correctAnswer && (
                          <span className="text-green-600 text-sm font-medium">(Correct)</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {question.type === 'fill-blank' && (
                <div className="p-3 rounded-lg border border-green-200 bg-green-50">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium text-green-800">Correct Answer:</span>
                    <span className="text-green-700">{question.correctAnswerText}</span>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}