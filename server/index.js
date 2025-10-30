const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const XLSX = require('xlsx');
const fs = require('fs');

const {
  connectDB,
  createUser,
  getUserByEmail,
  getUserById,
  verifyPassword,
  updatePassword,
  createQuestion,
  getQuestionsByDomainAndSubject,
  createTest,
  getTestsForStudent,
  getTestById,
  getFacultyTests,
  updateTestStatus,
  saveTestAttempt,
  getTestResults,
  getStudentProgress,
  checkTestCompletion,
  getAllUsers,
  deleteUser,
  createAuditLog,
  getAuditLogs
} = require('./database');

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = 'your-secret-key-change-in-production';

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' });
    }
    req.user = user;
    next();
  });
};

// Audit logging function
const logAudit = async (userId, userEmail, action, details, ipAddress) => {
  try {
    await createAuditLog({
      userId,
      userEmail,
      action,
      details,
      ipAddress
    });
  } catch (error) {
    console.error('Error logging audit:', error);
  }
};

// Authentication routes
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const isValidPassword = await verifyPassword(email, password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email, 
      role: user.role 
    }, JWT_SECRET, { expiresIn: '24h' });
    
    await logAudit(user.id, email, 'LOGIN', `${user.role} login`, req.ip);
    
    res.json({ 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        domain: user.domain,
        section: user.section
      }, 
      token 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const { id, email } = req.user;
    
    const success = await updatePassword(id, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Failed to update password' });
    }
    
    await logAudit(id, email, 'PASSWORD_CHANGE', 'Password updated', req.ip);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin create user
app.post('/api/admin/create-user', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }

  try {
    const { email, name, password, role, domain, section } = req.body;
    
    const userId = await createUser({
      email,
      name,
      password,
      role,
      domain,
      section
    });
    
    await logAudit(req.user.id, req.user.email, 'CREATE_USER', `Created ${role}: ${name}`, req.ip);
    res.json({ id: userId, message: `${role} created successfully` });
  } catch (error) {
    console.error('Create user error:', error);
    if (error.message && error.message.includes('UNIQUE constraint failed')) {
      res.status(400).json({ error: 'Email already exists' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Get user by email
app.get('/api/users/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const user = await getUserByEmail(email);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create question
app.post('/api/questions', async (req, res) => {
  try {
    const { question, type, options, correctAnswer, correctAnswerText, domain, subject, difficulty, timeLimit, createdBy } = req.body;
    
    console.log('Creating question:', { question, type, domain, subject, difficulty });
    
    const questionId = await createQuestion({
      question,
      type,
      options: options || [],
      correctAnswer,
      correctAnswerText,
      domain,
      subject,
      difficulty,
      timeLimit: timeLimit || 0,
      createdBy
    });
    
    console.log('Question created with ID:', questionId);
    res.json({ id: questionId, message: 'Question created successfully' });
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get questions by domain and subject
app.get('/api/questions/:domain/:subject', async (req, res) => {
  try {
    const { domain, subject } = req.params;
    console.log('Getting questions for:', { domain, subject });
    
    const questions = await getQuestionsByDomainAndSubject(domain, subject);
    console.log('Found questions:', questions.length);
    
    res.json(questions);
  } catch (error) {
    console.error('Error getting questions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Import questions from CSV/Excel
app.post('/api/questions/import', upload.single('file'), async (req, res) => {
  try {
    const { domain, subject, createdBy } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    console.log('Importing questions from file:', req.file.originalname);
    
    const workbook = XLSX.readFile(req.file.path);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    let importedCount = 0;
    
    for (const row of data) {
      try {
        let questionType = 'multiple-choice';
        let options = [];
        let correctAnswer = 0;
        let correctAnswerText = '';
        
        // Determine question type and process accordingly
        if (row['Type'] && row['Type'].toLowerCase() === 'true-false') {
          questionType = 'true-false';
          options = ['True', 'False'];
          correctAnswer = row['Correct Answer'] && row['Correct Answer'].toLowerCase() === 'true' ? 0 : 1;
        } else if (row['Type'] && row['Type'].toLowerCase() === 'fill-blank') {
          questionType = 'fill-blank';
          correctAnswerText = row['Correct Answer'] || '';
        } else {
          // Multiple choice
          options = [
            row['Option A'] || row['A'] || '',
            row['Option B'] || row['B'] || '',
            row['Option C'] || row['C'] || '',
            row['Option D'] || row['D'] || ''
          ].filter(opt => opt.trim() !== '');
          
          const correctAnswerLetter = (row['Correct Answer'] || 'A').toUpperCase();
          correctAnswer = correctAnswerLetter.charCodeAt(0) - 65; // Convert A,B,C,D to 0,1,2,3
        }
        
        await createQuestion({
          question: row['Question'] || row['question'] || '',
          type: questionType,
          options,
          correctAnswer,
          correctAnswerText,
          domain,
          subject,
          difficulty: (row['Difficulty'] || 'medium').toLowerCase(),
          timeLimit: parseInt(row['Time Limit']) || 0,
          createdBy
        });
        
        importedCount++;
      } catch (error) {
        console.error('Error importing question:', error);
      }
    }
    
    // Clean up uploaded file
    fs.unlinkSync(req.file.path);
    
    console.log(`Imported ${importedCount} questions`);
    res.json({ message: `${importedCount} questions imported successfully` });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({ error: 'Failed to import questions' });
  }
});

// Create test
app.post('/api/tests', async (req, res) => {
  try {
    const { title, domain, subject, section, questions, randomizeQuestions, questionPoolSize, duration, timePerQuestion, totalMarks, createdBy, isActive, scheduledDate, scheduledTime, isScheduled } = req.body;
    
    console.log('Creating test:', { title, domain, subject, questionsCount: questions.length });
    
    const testId = await createTest({
      title,
      domain,
      subject,
      section,
      questions,
      randomizeQuestions,
      questionPoolSize,
      duration,
      timePerQuestion,
      totalMarks,
      createdBy,
      scheduledDate,
      scheduledTime,
      isScheduled,
      isActive
    });
    
    console.log('Test created with ID:', testId);
    res.json({ 
      id: testId, 
      message: 'Test created successfully',
      testId: testId,
      title: title
    });
  } catch (error) {
    console.error('Error creating test:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get tests for student
app.get('/api/tests/:domain/:section', async (req, res) => {
  try {
    const { domain, section } = req.params;
    console.log('Getting tests for student:', { domain, section });
    
    const tests = await getTestsForStudent(domain, section);
    console.log('Found tests:', tests.length);
    
    res.json(tests);
  } catch (error) {
    console.error('Error getting tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get test by ID
app.get('/api/test/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    console.log('Getting test by ID:', testId);
    
    const test = await getTestById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    res.json(test);
  } catch (error) {
    console.error('Error getting test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Save test attempt
app.post('/api/test-attempts', async (req, res) => {
  try {
    const { testId, studentId, studentName, answers, textAnswers, score, totalQuestions, timeSpent, tabSwitchCount = 0, warningCount = 0, isCompleted = true } = req.body;
    
    console.log('Saving test attempt:', { testId, studentId, score, totalQuestions });
    
    const attemptId = await saveTestAttempt({
      testId,
      studentId,
      studentName,
      answers,
      textAnswers,
      score,
      totalQuestions,
      timeSpent,
      tabSwitchCount,
      warningCount,
      isCompleted
    });
    
    console.log('Test attempt saved with ID:', attemptId);
    res.json({ id: attemptId, message: 'Test attempt saved successfully' });
  } catch (error) {
    console.error('Error saving test attempt:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get test results
app.get('/api/test-results/:testId', async (req, res) => {
  try {
    const { testId } = req.params;
    console.log('Getting test results for:', testId);
    
    const results = await getTestResults(testId);
    console.log('Found results:', results.length);
    
    res.json(results);
  } catch (error) {
    console.error('Error getting test results:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get student progress
app.get('/api/student-progress/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    console.log('Getting student progress for:', studentId);
    
    const progress = await getStudentProgress(studentId);
    console.log('Found progress records:', progress.length);
    
    res.json(progress);
  } catch (error) {
    console.error('Error getting student progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get tests created by faculty
app.get('/api/faculty-tests/:facultyId', async (req, res) => {
  try {
    const { facultyId } = req.params;
    console.log('Getting faculty tests for:', facultyId);
    
    const tests = await getFacultyTests(facultyId);
    console.log('Found faculty tests:', tests.length);
    
    res.json(tests);
  } catch (error) {
    console.error('Error getting faculty tests:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update test status
app.put('/api/tests/:testId/status', async (req, res) => {
  try {
    const { testId } = req.params;
    const { isActive } = req.body;
    
    console.log('Updating test status:', { testId, isActive });
    
    const success = await updateTestStatus(testId, isActive);
    if (!success) {
      return res.status(404).json({ error: 'Test not found' });
    }
    
    res.json({ message: 'Test status updated successfully' });
  } catch (error) {
    console.error('Error updating test status:', error);
    res.status(400).json({ error: error.message });
  }
});

// Check if student has completed a test
app.get('/api/test-completion/:testId/:studentId', async (req, res) => {
  try {
    const { testId, studentId } = req.params;
    console.log('Checking test completion:', { testId, studentId });
    
    const completion = await checkTestCompletion(testId, studentId);
    console.log('Test completion status:', completion);
    
    res.json(completion);
  } catch (error) {
    console.error('Error checking test completion:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin routes
app.get('/api/admin/users', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const users = await getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error getting users:', error);
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/admin/change-user-password', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { userId, newPassword, userType } = req.body;
    
    const success = await updatePassword(userId, newPassword);
    if (!success) {
      return res.status(400).json({ error: 'Failed to update password' });
    }
    
    await logAudit(req.user.id, req.user.email, 'ADMIN_PASSWORD_CHANGE', `Changed password for ${userType}: ${userId}`, req.ip);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Admin password change error:', error);
    res.status(500).json({ error: error.message });
  }
});
app.get('/api/admin/audit-logs', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const logs = await getAuditLogs();
    res.json(logs);
  } catch (error) {
    console.error('Error getting audit logs:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/admin/users/:userId', authenticateToken, async (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  
  try {
    const { userId } = req.params;
    const { userType } = req.body;
    
    const success = await deleteUser(userId);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    await logAudit(req.user.id, req.user.email, 'DELETE_USER', `Deleted ${userType}: ${userId}`, req.ip);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});