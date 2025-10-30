import React, { useState } from 'react';
import { Brain, Download, Save, Loader, Sparkles, RefreshCw } from 'lucide-react';
import { api } from '../../services/api';
import { User, Domain, SUBJECTS } from '../../types';

interface AIQuestionGeneratorProps {
  user: User;
}

interface GeneratedQuestion {
  question: string;
  type: 'multiple-choice' | 'true-false' | 'fill-blank';
  options?: string[];
  correctAnswer: number;
  correctAnswerText?: string;
  explanation?: string;
}

export default function AIQuestionGenerator({ user }: AIQuestionGeneratorProps) {
  const [prompt, setPrompt] = useState('');
  const [selectedDomain, setSelectedDomain] = useState<Domain>(user.domain[0]);
  const [selectedSubject, setSelectedSubject] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [questionType, setQuestionType] = useState<'multiple-choice' | 'true-false' | 'fill-blank' | 'mixed'>('multiple-choice');
  const [questionCount, setQuestionCount] = useState(5);
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [savedCount, setSavedCount] = useState(0);
  const [aiProvider, setAiProvider] = useState<'ollama' | 'gemini'>('ollama');

  const availableSubjects = SUBJECTS.filter(s => s.domain === selectedDomain);

  // Enhanced AI Question Generation with Ollama and Gemini
  const generateQuestions = async () => {
    if (!prompt.trim() || !selectedSubject) {
      alert('Please provide a prompt and select a subject');
      return;
    }

    setLoading(true);
    setSavedCount(0);

    try {
      const questions = await generateQuestionsWithAI();
      setGeneratedQuestions(questions);
      alert(`Successfully generated ${questions.length} questions!`);
    } catch (error: any) {
      console.error('Error generating questions:', error);
      let errorMessage = 'Error generating questions:\n\n';

      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        if (aiProvider === 'ollama') {
          errorMessage += '❌ Cannot connect to Ollama\n\n';
          errorMessage += 'Please ensure:\n';
          errorMessage += '1. Ollama is installed and running\n';
          errorMessage += '2. Run: ollama serve\n';
          errorMessage += '3. Run: ollama pull phi3\n';
          errorMessage += '4. Ollama is running on http://localhost:11434';
        } else {
          errorMessage += '❌ Network error with Gemini API\n\n';
          errorMessage += 'Please check your internet connection and API key.';
        }
      } else {
        errorMessage += error.message || 'Unknown error occurred';
      }

      alert(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const generateQuestionsWithAI = async (): Promise<GeneratedQuestion[]> => {
    try {
      if (aiProvider === 'ollama') {
        return await generateWithOllama();
      } else {
        return await generateWithGemini();
      }
    } catch (error) {
      console.error('AI generation failed:', error);
      throw error;
    }
  };

  const generateWithOllama = async (): Promise<GeneratedQuestion[]> => {
    const questions: GeneratedQuestion[] = [];

    const determineType = (index: number): string => {
      if (questionType !== 'mixed') return questionType;
      const types = ['multiple-choice', 'true-false', 'fill-blank'];
      return types[index % types.length];
    };

    for (let i = 0; i < questionCount; i++) {
      try {
        const currentType = determineType(i);

        let systemPrompt = `You are an expert ${selectedSubject} educator. Generate ONE high-quality ${currentType} question for ${selectedDomain} students at ${difficulty} level.

Topic: ${prompt}

CRITICAL: Respond ONLY with valid JSON. No explanations, no markdown, just JSON.

`;

        if (currentType === 'multiple-choice') {
          systemPrompt += `Format:
{
  "question": "Clear, specific question about the topic",
  "type": "multiple-choice",
  "options": ["Correct answer", "Plausible distractor 1", "Plausible distractor 2", "Plausible distractor 3"],
  "correctAnswer": 0,
  "explanation": "Why the answer is correct"
}`;
        } else if (currentType === 'true-false') {
          systemPrompt += `Format:
{
  "question": "A clear statement that can be true or false",
  "type": "true-false",
  "options": ["True", "False"],
  "correctAnswer": 0,
  "explanation": "Explanation of the answer"
}`;
        } else {
          systemPrompt += `Format:
{
  "question": "Question with a ________ blank to fill",
  "type": "fill-blank",
  "correctAnswerText": "the exact answer",
  "explanation": "Why this is the answer"
}`;
        }

        const response = await fetch('http://localhost:11434/api/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'phi3',
            prompt: systemPrompt,
            stream: false,
            format: 'json',
            options: {
              temperature: 0.3,
              num_predict: 600,
              top_p: 0.9
            }
          })
        }).catch(err => {
          throw new Error('Failed to fetch - Ollama is not running or not accessible');
        });

        if (!response.ok) {
          const errorText = await response.text();
          if (response.status === 404) {
            throw new Error('Model "phi3" not found. Please run: ollama pull phi3');
          }
          throw new Error(`Ollama API error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        let generatedText = data.response.trim();

        generatedText = generatedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

        const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('No valid JSON found in response');
        }

        const questionData = JSON.parse(jsonMatch[0]);

        if (!questionData.question || !questionData.type) {
          throw new Error('Invalid question format');
        }

        questions.push({
          question: questionData.question,
          type: questionData.type,
          options: questionData.options || [],
          correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
          correctAnswerText: questionData.correctAnswerText || '',
          explanation: questionData.explanation || ''
        });

        await new Promise(resolve => setTimeout(resolve, 500));

      } catch (error: any) {
        console.error(`Error generating question ${i + 1} with Ollama:`, error);
        throw new Error(`Failed to generate question ${i + 1} with Ollama: ${error.message}`);
      }
    }

    if (questions.length === 0) {
      throw new Error('No questions were generated successfully');
    }

    return questions;
  };

  const generateWithGemini = async (): Promise<GeneratedQuestion[]> => {
    const questions: GeneratedQuestion[] = [];

    try {
      const geminiApiKey = window.prompt('Please enter your Gemini API key:');
      if (!geminiApiKey || !geminiApiKey.trim()) {
        throw new Error('Gemini API key is required. You can get one from https://makersuite.google.com/app/apikey');
      }

      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(geminiApiKey.trim());
      const model = genAI.getGenerativeModel({
        model: 'gemini-pro',
        generationConfig: {
          temperature: 0.4,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      const questionTypeInstructions = questionType === 'mixed'
        ? 'Mix of multiple-choice, true-false, and fill-in-the-blank'
        : questionType;

      const systemPrompt = `You are an expert ${selectedSubject} educator. Create exactly ${questionCount} high-quality ${questionTypeInstructions} questions for ${selectedDomain} students at ${difficulty} difficulty level.

Topic: ${prompt}

CRITICAL: Respond with ONLY a valid JSON array. No markdown, no code blocks, just pure JSON.

Format for multiple-choice:
{
  "question": "Your question here",
  "type": "multiple-choice",
  "options": ["Correct answer", "Wrong option 1", "Wrong option 2", "Wrong option 3"],
  "correctAnswer": 0,
  "explanation": "Why this is correct"
}

Format for true-false:
{
  "question": "Statement to evaluate",
  "type": "true-false",
  "options": ["True", "False"],
  "correctAnswer": 0 or 1,
  "explanation": "Explanation"
}

Format for fill-blank:
{
  "question": "Question with ________ blank",
  "type": "fill-blank",
  "correctAnswerText": "the answer",
  "explanation": "Why this is correct"
}

Requirements:
- Questions must be accurate and factually correct
- Distractors must be plausible but clearly wrong
- Cover different aspects of the topic
- Be specific and unambiguous

Return as JSON array: [...]`;

      const result = await model.generateContent(systemPrompt);
      const response = await result.response;
      let text = response.text().trim();

      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No valid JSON array found in Gemini response');
      }

      const questionsData = JSON.parse(jsonMatch[0]);

      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error('Invalid response format from Gemini');
      }

      questionsData.forEach((questionData: any, index: number) => {
        if (!questionData.question || !questionData.type) {
          console.warn(`Skipping invalid question at index ${index}`);
          return;
        }

        questions.push({
          question: questionData.question,
          type: questionData.type,
          options: questionData.options || [],
          correctAnswer: questionData.correctAnswer !== undefined ? questionData.correctAnswer : 0,
          correctAnswerText: questionData.correctAnswerText || '',
          explanation: questionData.explanation || ''
        });
      });

      if (questions.length === 0) {
        throw new Error('No valid questions were generated');
      }

    } catch (error: any) {
      console.error('Error with Gemini question generation:', error);
      throw new Error(`Failed to generate questions with Gemini: ${error.message}`);
    }

    return questions;
  };


  const saveQuestion = async (question: GeneratedQuestion, index: number) => {
    try {
      console.log('Saving individual question:', question);
      
      const response = await api.createQuestion({
        question: question.question,
        type: question.type,
        options: question.options,
        correctAnswer: question.correctAnswer,
        correctAnswerText: question.correctAnswerText,
        domain: selectedDomain,
        subject: selectedSubject,
        difficulty: difficulty,
        timeLimit: 0,
        createdBy: user.id,
        createdByRole: 'faculty'
      });

      console.log('Question saved successfully:', response);
      setSavedCount(prev => prev + 1);
      alert('Question saved successfully!');
    } catch (error) {
      console.error('Error saving question:', error);
      alert('Error saving question: ' + (error.message || 'Unknown error'));
    }
  };

  const saveAllQuestions = async () => {
    if (generatedQuestions.length === 0) {
      alert('No questions to save');
      return;
    }

    setLoading(true);
    let saved = 0;
    let errors = 0;

    for (const question of generatedQuestions) {
      try {
        console.log('Saving question to database:', question);
        
        const response = await api.createQuestion({
          question: question.question,
          type: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          correctAnswerText: question.correctAnswerText,
          domain: selectedDomain,
          subject: selectedSubject,
          difficulty: difficulty,
          timeLimit: 0,
          createdBy: user.id,
          createdByRole: 'faculty'
        });
        
        console.log('Question saved with response:', response);
        saved++;
      } catch (error) {
        console.error('Error saving question:', error);
        errors++;
      }
    }

    setSavedCount(saved);
    setLoading(false);
    
    if (errors > 0) {
      alert(`${saved} questions saved successfully, ${errors} failed to save.`);
    } else {
      alert(`All ${saved} questions saved successfully to question bank!`);
    }
  };

  const exportQuestions = () => {
    if (generatedQuestions.length === 0) return;

    const csvContent = [
      ['Question', 'Type', 'Option A', 'Option B', 'Option C', 'Option D', 'Correct Answer', 'Correct Answer Text', 'Domain', 'Subject', 'Difficulty'],
      ...generatedQuestions.map(q => [
        q.question,
        q.type,
        q.options?.[0] || '',
        q.options?.[1] || '',
        q.options?.[2] || '',
        q.options?.[3] || '',
        q.type === 'fill-blank' ? '' : (q.options ? q.options[q.correctAnswer] : ''),
        q.correctAnswerText || '',
        selectedDomain,
        selectedSubject,
        difficulty
      ])
    ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ai-generated-questions-${selectedSubject}-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* AI Generator Header */}
      <div className="bg-gradient-to-r from-purple-500 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center space-x-3 mb-4">
          <Brain className="h-8 w-8" />
          <div>
            <h3 className="text-xl font-semibold">AI Question Generator</h3>
            <p className="text-purple-100">Generate questions using Ollama (Local) or Gemini AI</p>
          </div>
        </div>
      </div>

      {/* Setup Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
        <div className="text-sm text-blue-800 space-y-2">
          <div>
            <strong>Ollama (Local):</strong>
            <ol className="list-decimal ml-5 mt-1">
              <li>Install Ollama from <a href="https://ollama.ai" target="_blank" rel="noopener noreferrer" className="underline">ollama.ai</a></li>
              <li>Open terminal and run: <code className="bg-blue-100 px-2 py-1 rounded">ollama pull phi3</code></li>
              <li>Start Ollama: <code className="bg-blue-100 px-2 py-1 rounded">ollama serve</code></li>
              <li>Keep it running while generating questions</li>
            </ol>
          </div>
          <div>
            <strong>Gemini AI:</strong>
            <ol className="list-decimal ml-5 mt-1">
              <li>Get API key from <a href="https://makersuite.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="underline">Google AI Studio</a></li>
              <li>You'll be prompted to enter it when generating questions</li>
            </ol>
          </div>
        </div>
      </div>

      {/* Generator Form */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              AI Provider
            </label>
            <select
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value as 'ollama' | 'gemini')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="ollama">Ollama (Local)</option>
              <option value="gemini">Gemini AI</option>
            </select>
          </div>

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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
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
              Question Type
            </label>
            <select
              value={questionType}
              onChange={(e) => setQuestionType(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="multiple-choice">Multiple Choice</option>
              <option value="true-false">True/False</option>
              <option value="fill-blank">Fill in the Blank</option>
              <option value="mixed">Mixed Types</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Count
            </label>
            <input
              type="number"
              value={questionCount}
              onChange={(e) => setQuestionCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
              min="1"
              max="10"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            AI Prompt (Topics)
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
            rows={4}
            placeholder="Enter topics or specific areas you want questions about... e.g., 'Object-oriented programming concepts, inheritance, polymorphism'"
          />
          <p className="text-sm text-gray-500 mt-1">
            Be specific about the topics you want questions on. The AI will generate relevant questions based on your input.
          </p>
        </div>

        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Sparkles className="h-4 w-4" />
            <span>AI-Powered Question Generation - {aiProvider === 'ollama' ? 'Local Ollama' : 'Gemini AI'}</span>
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setGeneratedQuestions([]);
                setSavedCount(0);
              }}
              className="flex items-center space-x-2 bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 transition-colors"
            >
              <RefreshCw className="h-4 w-4" />
              <span>Clear</span>
            </button>
            
            <button
              onClick={generateQuestions}
              disabled={loading || !prompt.trim() || !selectedSubject}
              className="flex items-center space-x-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Generated Questions */}
      {generatedQuestions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-medium text-gray-900">
              Generated Questions ({generatedQuestions.length})
            </h3>
            <div className="flex space-x-3">
              <button
                onClick={exportQuestions}
                className="flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Download className="h-4 w-4" />
                <span>Export CSV</span>
              </button>
              <button
                onClick={saveAllQuestions}
                disabled={loading}
                className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <Loader className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                <span>Save All to Question Bank</span>
              </button>
            </div>
          </div>

          <div className="space-y-6">
            {generatedQuestions.map((question, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <h4 className="font-medium text-gray-900">
                        {index + 1}. {question.question}
                      </h4>
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        question.type === 'multiple-choice' ? 'bg-blue-100 text-blue-800' :
                        question.type === 'true-false' ? 'bg-green-100 text-green-800' :
                        'bg-purple-100 text-purple-800'
                      }`}>
                        {question.type.replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => saveQuestion(question, index)}
                    className="ml-4 flex items-center space-x-1 bg-blue-100 text-blue-700 px-3 py-1 rounded-md hover:bg-blue-200 transition-colors"
                  >
                    <Save className="h-3 w-3" />
                    <span>Save</span>
                  </button>
                </div>

                {question.type === 'multiple-choice' && question.options && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
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
                            <span className="text-green-600 text-sm font-medium">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'true-false' && question.options && (
                  <div className="grid grid-cols-2 gap-3 mb-4">
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
                          <span className="font-medium">{option}</span>
                          {optIndex === question.correctAnswer && (
                            <span className="text-green-600 text-sm font-medium">✓</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {question.type === 'fill-blank' && (
                  <div className="p-3 rounded-lg border border-green-200 bg-green-50 mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-green-800">Correct Answer:</span>
                      <span className="text-green-700">{question.correctAnswerText}</span>
                    </div>
                  </div>
                )}

                {question.explanation && (
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Explanation:</strong> {question.explanation}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {savedCount > 0 && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">
                ✅ {savedCount} question{savedCount > 1 ? 's' : ''} saved to question bank successfully!
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}