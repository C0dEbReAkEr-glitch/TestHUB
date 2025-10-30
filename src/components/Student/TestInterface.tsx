import { useState, useEffect, useRef } from 'react';
import { Clock, AlertTriangle, Shield, ArrowLeft } from 'lucide-react';
import { Test, User, TestAttempt } from '../../types';
import { api } from '../../services/api';

interface TestInterfaceProps {
  test: Test;
  user: User;
  onComplete: () => void;
}

export default function TestInterface({ test, user, onComplete }: TestInterfaceProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [textAnswers, setTextAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(test.duration * 60);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [testStarted, setTestStarted] = useState(false);
  
  // Enhanced anti-cheating states
  const [_isFullscreen, setIsFullscreen] = useState(false);
  const [_tabSwitchCount, setTabSwitchCount] = useState(0);
  const [_warningCount, setWarningCount] = useState(0);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [testTerminated, setTestTerminated] = useState(false);
  const [violations, setViolations] = useState<string[]>([]);
  const [isVisible, setIsVisible] = useState(true);
  const [mouseLeaveCount, setMouseLeaveCount] = useState(0);
  
  const testContainerRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | undefined>(undefined);
  const startTimeRef = useRef<number>(Date.now());
  const violationCountRef = useRef<number>(0);
  const tabSwitchCountRef = useRef<number>(0);

  // Check if test has questions
  if (!test.questions || test.questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">No Questions Available</h2>
          <p className="text-gray-600 mb-6">
            This test doesn't have any questions yet. Please contact your instructor.
          </p>
          <button
            onClick={onComplete}
            className="flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Dashboard</span>
          </button>
        </div>
      </div>
    );
  }

  // Enhanced anti-cheating measures
  useEffect(() => {
    if (!testStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Block common shortcuts and function keys
      const blockedKeys = [
        'F12', 'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11',
        'PrintScreen', 'Insert', 'Delete'
      ];
      
      const blockedCombinations = [
        { ctrl: true, key: 'c' }, // Copy
        { ctrl: true, key: 'v' }, // Paste
        { ctrl: true, key: 'a' }, // Select All
        { ctrl: true, key: 's' }, // Save
        { ctrl: true, key: 'p' }, // Print
        { ctrl: true, key: 'r' }, // Refresh
        { ctrl: true, key: 'f' }, // Find
        { ctrl: true, key: 'h' }, // History
        { ctrl: true, key: 'j' }, // Downloads
        { ctrl: true, key: 'u' }, // View Source
        { ctrl: true, shift: true, key: 'I' }, // Dev Tools
        { ctrl: true, shift: true, key: 'J' }, // Console
        { ctrl: true, shift: true, key: 'C' }, // Inspect
        { alt: true, key: 'Tab' }, // Alt+Tab
        { alt: true, key: 'F4' }, // Alt+F4
        { meta: true, key: 'Tab' }, // Cmd+Tab (Mac)
      ];

      if (blockedKeys.includes(e.key) || 
          blockedCombinations.some(combo => 
            (combo.ctrl && e.ctrlKey || !combo.ctrl) &&
            (combo.shift && e.shiftKey || !combo.shift) &&
            (combo.alt && e.altKey || !combo.alt) &&
            (combo.meta && e.metaKey || !combo.meta) &&
            e.key.toLowerCase() === combo.key.toLowerCase()
          )) {
        e.preventDefault();
        e.stopPropagation();
        handleViolation('Blocked keyboard shortcut: ' + (e.ctrlKey ? 'Ctrl+' : '') + (e.shiftKey ? 'Shift+' : '') + (e.altKey ? 'Alt+' : '') + e.key);
        return false;
      }
    };

    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      handleViolation('Right-click menu blocked');
      return false;
    };

    const handleSelectStart = (e: Event) => {
      e.preventDefault();
      return false;
    };

    const handleDragStart = (e: DragEvent) => {
      e.preventDefault();
      return false;
    };

    const handleCopy = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Copy operation blocked');
      return false;
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      handleViolation('Paste operation blocked');
      return false;
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setIsVisible(false);
        handleTabSwitch();
      } else {
        setIsVisible(true);
      }
    };

    const handleBlur = () => {
      handleTabSwitch();
    };

    const handleFocus = () => {
      if (!document.fullscreenElement && testStarted) {
        handleViolation('Lost fullscreen mode');
      }
    };

    const handleMouseLeave = () => {
      const newCount = mouseLeaveCount + 1;
      setMouseLeaveCount(newCount);
      if (newCount > 5) {
        handleViolation('Excessive mouse movement outside test area');
      }
    };

    // Disable text selection
  document.body.style.userSelect = 'none';
  (document.body.style as any).webkitUserSelect = 'none';

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('contextmenu', handleContextMenu, true);
    document.addEventListener('selectstart', handleSelectStart, true);
    document.addEventListener('dragstart', handleDragStart, true);
    document.addEventListener('copy', handleCopy, true);
    document.addEventListener('paste', handlePaste, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
  document.body.style.userSelect = '';
  (document.body.style as any).webkitUserSelect = '';
      
      document.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('contextmenu', handleContextMenu, true);
      document.removeEventListener('selectstart', handleSelectStart, true);
      document.removeEventListener('dragstart', handleDragStart, true);
      document.removeEventListener('copy', handleCopy, true);
      document.removeEventListener('paste', handlePaste, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [testStarted, mouseLeaveCount]);

  // Fullscreen management
  useEffect(() => {
    const handleFullscreenChange = () => {
      const isCurrentlyFullscreen = !!document.fullscreenElement;
      setIsFullscreen(isCurrentlyFullscreen);
      
      if (!isCurrentlyFullscreen && testStarted) {
        handleViolation('Exited fullscreen mode');
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [testStarted]);

  // Mobile-specific anti-cheating
  useEffect(() => {
    if (!testStarted) return;

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 1) {
        e.preventDefault();
        handleViolation('Multi-touch gesture blocked');
      }
    };

    const handleOrientationChange = () => {
      handleViolation('Screen orientation changed');
    };

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    window.addEventListener('orientationchange', handleOrientationChange);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('orientationchange', handleOrientationChange);
    };
  }, [testStarted]);

  const enterFullscreen = async () => {
    try {
      if (testContainerRef.current && testContainerRef.current.requestFullscreen) {
        await testContainerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        // Fallback for browsers that don't support fullscreen
        console.log('Fullscreen not supported, continuing anyway');
      }
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
      // Continue anyway for mobile devices that don't support fullscreen
    }
    
    // Start test regardless of fullscreen success
    setTestStarted(true);
    startTimeRef.current = Date.now();
  };

  const handleTabSwitch = () => {
    tabSwitchCountRef.current += 1;
    const newCount = tabSwitchCountRef.current;
    setTabSwitchCount(newCount);
    
    const violationType = `Tab switch detected (#${newCount})`;
    handleViolation(violationType);
    
    if (newCount >= 3) {
      setTestTerminated(true);
      submitTest(true, 'Test terminated due to excessive tab switching (3 strikes)');
    }
  };

  const handleViolation = (violationType: string) => {
    violationCountRef.current += 1;
    const newViolationCount = violationCountRef.current;
    
    const timestamp = new Date().toLocaleTimeString();
    const violationRecord = `${timestamp}: ${violationType}`;
    const newViolations = [...violations, violationRecord];
    setViolations(newViolations);
    
    setWarningCount(newViolationCount);
    
    setWarningMessage(`${violationType} (Warning ${newViolationCount}/5)`);
    setShowWarning(true);
    
    setTimeout(() => {
      setShowWarning(false);
    }, 4000);

    // Auto-terminate after 5 violations
    if (newViolationCount >= 5) {
      setTestTerminated(true);
      submitTest(true, 'Test terminated due to excessive violations (5 strikes)');
    }
  };

  // Timer
  useEffect(() => {
    if (testStarted && timeLeft > 0 && !testTerminated) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
    } else if (timeLeft === 0 && testStarted) {
      submitTest(true, 'Time expired');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [timeLeft, testStarted, testTerminated]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleAnswerSelect = (questionId: string, answer: number | string) => {
    const currentQuestion = test.questions[currentQuestionIndex];
    
    if (currentQuestion.type === 'fill-blank') {
      setTextAnswers(prev => ({
        ...prev,
        [questionId]: answer as string
      }));
    } else {
      setAnswers(prev => ({
        ...prev,
        [questionId]: answer as number
      }));
    }
  };

  const submitTest = async (_autoSubmit = false, reason = '') => {
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    
    try {
      const score = calculateScore();
      const timeSpent = (test.duration * 60) - timeLeft;
      
      const attemptData: Omit<TestAttempt, 'id' | 'completedAt'> = {
        testId: test.id,
        studentId: user.id,
        studentName: user.name,
        answers,
        textAnswers,
        score,
        totalQuestions: test.questions.length,
        timeSpent,
        tabSwitchCount: tabSwitchCountRef.current,
        warningCount: violationCountRef.current,
        isCompleted: !testTerminated,
        violations: violations,
        terminationReason: testTerminated ? reason : undefined,
        wasTerminated: testTerminated,
        ipAddress: 'unknown',
        userAgent: navigator.userAgent,
        browserInfo: navigator.userAgent
      };

      await api.saveTestAttempt(attemptData);
      
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      }
      
      const message = testTerminated 
        ? `Test terminated: ${reason}\nPartial Score: ${score}/${test.questions.length}\nViolations: ${violationCountRef.current}`
        : `Test submitted successfully!\nYour Score: ${score}/${test.questions.length}`;
      
      alert(message);
      onComplete();
    } catch (err) {
      const error = err as Error;
      console.error('Failed to submit test:', error);
      alert('Error submitting test. Please try again.');
      setIsSubmitting(false);
    }
  };

  const calculateScore = () => {
    let correct = 0;
    test.questions.forEach((question) => {
      const questionId = question.id.toString();
      
      if (question.type === 'fill-blank') {
        const studentAnswer = textAnswers[questionId]?.toLowerCase().trim();
        const correctAnswer = question.correctAnswerText?.toLowerCase().trim();
        if (studentAnswer === correctAnswer) {
          correct++;
        }
      } else {
        if (answers[questionId] === question.correctAnswer) {
          correct++;
        }
      }
    });
    return correct;
  };

  if (!testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <Shield className="h-16 w-16 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Secure Test Mode</h2>
          <div className="text-left mb-6">
            <h3 className="font-semibold text-gray-800 mb-2">Test Details:</h3>
            <p className="text-sm text-gray-600 mb-1"><strong>Title:</strong> {test.title}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Subject:</strong> {test.subject}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Questions:</strong> {test.questions.length}</p>
            <p className="text-sm text-gray-600 mb-1"><strong>Duration:</strong> {test.duration} minutes</p>
            <p className="text-sm text-gray-600"><strong>Total Marks:</strong> {test.totalMarks}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-red-800 mb-2">⚠️ Strict Anti-Cheating Rules:</h3>
            <ul className="text-sm text-red-700 text-left space-y-1">
              <li>• Stay in fullscreen mode (if supported)</li>
              <li>• <strong>No tab switching (3 strikes = auto-submit)</strong></li>
              <li>• No copy/paste operations</li>
              <li>• No keyboard shortcuts</li>
              <li>• No right-click menu</li>
              <li>• No screen capture</li>
              <li>• All violations are logged</li>
              <li>• <strong>5 violations = test termination</strong></li>
            </ul>
          </div>
          <button
            onClick={enterFullscreen}
            className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
          >
            Start Secure Test
          </button>
        </div>
      </div>
    );
  }

  if (testTerminated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 to-red-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full text-center">
          <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-red-800 mb-4">Test Terminated</h2>
          <p className="text-red-600 mb-4">
            Your test has been terminated due to multiple violations of test rules.
          </p>
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="text-sm text-red-700 space-y-1">
              <p><strong>Tab switches:</strong> {tabSwitchCountRef.current}</p>
              <p><strong>Total violations:</strong> {violationCountRef.current}</p>
              <p><strong>Score achieved:</strong> {calculateScore()}/{test.questions.length}</p>
              <div className="mt-2">
                <p><strong>Violations:</strong></p>
                <div className="text-xs bg-red-100 p-2 rounded mt-1 max-h-20 overflow-y-auto">
                  {violations.map((violation, index) => (
                    <div key={index}>{violation}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={onComplete}
            className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = test.questions[currentQuestionIndex];

  return (
    <div 
      ref={testContainerRef}
      className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100"
      style={{ 
        userSelect: 'none',
        WebkitUserSelect: 'none',
        MozUserSelect: 'none',
        msUserSelect: 'none'
      }}
    >
      {/* Enhanced Security Header */}
      <div className="bg-red-600 text-white px-4 py-2 text-center text-sm font-semibold flex justify-between items-center">
        <span>🔒 SECURE TEST MODE</span>
        <span>Violations: {violationCountRef.current}/5 | Tab Switches: {tabSwitchCountRef.current}/3</span>
        <span>{isVisible ? '👁️ MONITORED' : '⚠️ HIDDEN'}</span>
      </div>

      {/* Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <AlertTriangle className="h-6 w-6 text-red-500 mr-2" />
              <h3 className="text-lg font-semibold text-gray-800">Security Violation Detected</h3>
            </div>
            <p className="text-gray-600 mb-4">{warningMessage}</p>
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-4">
              <p className="text-sm text-yellow-800">
                <strong>Warning:</strong> {violationCountRef.current >= 3 ? 'Next violation will terminate the test!' : `${5 - violationCountRef.current} violations remaining before termination.`}
              </p>
              {tabSwitchCountRef.current >= 2 && (
                <p className="text-sm text-red-800 mt-1">
                  <strong>Critical:</strong> {3 - tabSwitchCountRef.current} tab switch remaining before auto-termination!
                </p>
              )}
            </div>
            <button
              onClick={() => setShowWarning(false)}
              className="w-full px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            >
              I Understand - Continue Test
            </button>
          </div>
        </div>
      )}

      {/* Test Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl font-semibold text-gray-800">
                Question {currentQuestionIndex + 1} of {test.questions.length}
              </h1>
              <p className="text-sm text-gray-600">{test.title} - {test.subject}</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className={`flex items-center ${timeLeft < 300 ? 'text-red-600' : 'text-blue-600'}`}>
                <Clock className="h-5 w-5 mr-1" />
                <span className="font-mono text-lg">{formatTime(timeLeft)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-8">
            <h2 className="text-lg font-medium text-gray-800 mb-6 leading-relaxed">
              {currentQuestion.question}
            </h2>
            
            {currentQuestion.type === 'multiple-choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion.id.toString()] === optIndex
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={optIndex}
                      checked={answers[currentQuestion.id.toString()] === optIndex}
                      onChange={() => handleAnswerSelect(currentQuestion.id.toString(), optIndex)}
                      className="mr-3 text-indigo-600"
                    />
                    <span className="font-medium text-indigo-600 mr-3">{String.fromCharCode(65 + optIndex)}.</span>
                    <span className="text-gray-700">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'true-false' && (
              <div className="space-y-3">
                {['True', 'False'].map((option, optIndex) => (
                  <label
                    key={optIndex}
                    className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
                      answers[currentQuestion.id.toString()] === optIndex
                        ? 'border-indigo-500 bg-indigo-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <input
                      type="radio"
                      name={`question-${currentQuestionIndex}`}
                      value={optIndex}
                      checked={answers[currentQuestion.id.toString()] === optIndex}
                      onChange={() => handleAnswerSelect(currentQuestion.id.toString(), optIndex)}
                      className="mr-3 text-indigo-600"
                    />
                    <span className="text-gray-700 font-medium">{option}</span>
                  </label>
                ))}
              </div>
            )}

            {currentQuestion.type === 'fill-blank' && (
              <div>
                <input
                  type="text"
                  value={textAnswers[currentQuestion.id.toString()] || ''}
                  onChange={(e) => handleAnswerSelect(currentQuestion.id.toString(), e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
                  placeholder="Type your answer here..."
                />
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            <button
              onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="flex space-x-2">
              {test.questions.map((_, index) => {
                const questionId = test.questions[index].id.toString();
                const isAnswered = test.questions[index].type === 'fill-blank' 
                  ? textAnswers[questionId]?.trim() 
                  : answers[questionId] !== undefined;
                
                return (
                  <button
                    key={index}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-8 h-8 rounded-full text-sm font-medium transition-colors ${
                      index === currentQuestionIndex
                        ? 'bg-indigo-600 text-white'
                        : isAnswered
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>

            {currentQuestionIndex === test.questions.length - 1 ? (
              <button
                onClick={() => submitTest()}
                disabled={isSubmitting}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Test'}
              </button>
            ) : (
              <button
                onClick={() => setCurrentQuestionIndex(Math.min(test.questions.length - 1, currentQuestionIndex + 1))}
                className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Next
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}