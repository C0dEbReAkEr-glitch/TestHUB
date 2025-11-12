const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/mcq_platform', {
    });
    console.log('MongoDB connected successfully');
    await createDefaultAdmin();
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Separate User Schemas for different roles
const studentSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'student' },
  domain: { type: String, enum: ['BCA', 'MCA', 'PGDM'], required: true },
  section: { type: String, enum: ['A', 'B'], required: true },
  enrollmentNumber: { type: String, unique: true },
  phoneNumber: String,
  address: String,
  dateOfBirth: Date,
  createdAt: { type: Date, default: Date.now }
});

const facultySchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'faculty' },
  domains: [{ type: String, enum: ['BCA', 'MCA', 'PGDM'] }],
  employeeId: { type: String, unique: true },
  department: String,
  qualification: String,
  experience: Number,
  phoneNumber: String,
  createdAt: { type: Date, default: Date.now }
});

const adminSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, default: 'admin' },
  domains: [{ type: String, enum: ['BCA', 'MCA', 'PGDM'] }],
  permissions: [String],
  createdAt: { type: Date, default: Date.now }
});

// Question Schema
const questionSchema = new mongoose.Schema({
  question: { type: String, required: true },
  type: { type: String, enum: ['multiple-choice', 'true-false', 'fill-blank'], required: true },
  options: [String],
  correctAnswer: { type: Number, required: true },
  correctAnswerText: String,
  domain: { type: String, enum: ['BCA', 'MCA', 'PGDM'], required: true },
  subject: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  timeLimit: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdByRole: { type: String, enum: ['faculty', 'admin'], required: true },
  tags: [String],
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

// Test Schema
const testSchema = new mongoose.Schema({
  title: { type: String, required: true },
  domain: { type: String, enum: ['BCA', 'MCA', 'PGDM'], required: true },
  subject: { type: String, required: true },
  section: { type: String, enum: ['A', 'B', 'both'], required: true },
  questions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }],
  randomizeQuestions: { type: Boolean, default: false },
  questionPoolSize: Number,
  duration: { type: Number, required: true },
  timePerQuestion: Number,
  totalMarks: { type: Number, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, required: true },
  createdByRole: { type: String, enum: ['faculty', 'admin'], required: true },
  scheduledDate: Date,
  scheduledTime: String,
  isScheduled: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  maxAttempts: { type: Number, default: 1 },
  passingScore: Number,
  instructions: String,
  createdAt: { type: Date, default: Date.now }
});

// Test Attempt Schema with enhanced violation tracking
const testAttemptSchema = new mongoose.Schema({
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'Test', required: true },
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
  studentName: { type: String, required: true },
  answers: { type: Map, of: Number },
  textAnswers: { type: Map, of: String },
  score: { type: Number, required: true },
  totalQuestions: { type: Number, required: true },
  timeSpent: { type: Number, required: true },
  tabSwitchCount: { type: Number, default: 0 },
  warningCount: { type: Number, default: 0 },
  violations: [{
    type: String,
    timestamp: { type: Date, default: Date.now },
    description: String
  }],
  terminationReason: String,
  isCompleted: { type: Boolean, default: true },
  wasTerminated: { type: Boolean, default: false },
  ipAddress: String,
  userAgent: String,
  browserInfo: String,
  completedAt: { type: Date, default: Date.now }
});

// Audit Log Schema
const auditLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId },
  userEmail: String,
  userRole: { type: String, enum: ['student', 'faculty', 'admin'] },
  action: { type: String, required: true },
  details: String,
  ipAddress: String,
  userAgent: String,
  createdAt: { type: Date, default: Date.now }
});

// Models
const Student = mongoose.model('Student', studentSchema);
const Faculty = mongoose.model('Faculty', facultySchema);
const Admin = mongoose.model('Admin', adminSchema);
const Question = mongoose.model('Question', questionSchema);
const Test = mongoose.model('Test', testSchema);
const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
const AuditLog = mongoose.model('AuditLog', auditLogSchema);

// Create default admin user
const createDefaultAdmin = async () => {
  try {
    const existingAdmin = await Admin.findOne({ email: 'admin@jims.edu' });
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await Admin.create({
        email: 'admin@jims.edu',
        name: 'System Administrator',
        password: hashedPassword,
        role: 'admin',
        domains: ['BCA', 'MCA', 'PGDM'],
        permissions: ['all']
      });
      console.log('Default admin user created: admin@jims.edu / admin123');
    }
  } catch (error) {
    console.error('Error creating default admin:', error);
  }
};

// User operations
const createUser = async (userData) => {
  try {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    let user;
    
    if (userData.role === 'student') {
      // Allow frontend to send domain as an array (e.g. ["BCA"]) or a string.
      // If an array is provided, use the first element as the student's domain.
      let studentDomain = userData.domain;
      if (Array.isArray(userData.domain)) {
        studentDomain = userData.domain.length > 0 ? userData.domain[0] : null;
      }

      user = await Student.create({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        domain: studentDomain,
        section: userData.section,
        enrollmentNumber: userData.enrollmentNumber || `ENR${Date.now()}`
      });
    } else if (userData.role === 'faculty') {
      user = await Faculty.create({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        domains: Array.isArray(userData.domain) ? userData.domain : [userData.domain],
        employeeId: userData.employeeId || `EMP${Date.now()}`
      });
    } else if (userData.role === 'admin') {
      user = await Admin.create({
        email: userData.email,
        name: userData.name,
        password: hashedPassword,
        domains: Array.isArray(userData.domain) ? userData.domain : [userData.domain],
        permissions: userData.permissions || ['all']
      });
    }
    
    console.log('User created with ID:', user._id);
    return user._id.toString();
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

const getUserByEmail = async (email) => {
  try {
    let user = await Student.findOne({ email });
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'student',
        domain: [user.domain],
        section: user.section,
        createdAt: user.createdAt
      };
    }
    
    user = await Faculty.findOne({ email });
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'faculty',
        domain: user.domains,
        createdAt: user.createdAt
      };
    }
    
    user = await Admin.findOne({ email });
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'admin',
        domain: user.domains,
        createdAt: user.createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by email:', error);
    throw error;
  }
};

const getUserById = async (id) => {
  try {
    let user = await Student.findById(id);
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'student',
        domain: [user.domain],
        section: user.section,
        createdAt: user.createdAt
      };
    }
    
    user = await Faculty.findById(id);
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'faculty',
        domain: user.domains,
        createdAt: user.createdAt
      };
    }
    
    user = await Admin.findById(id);
    if (user) {
      return {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: 'admin',
        domain: user.domains,
        createdAt: user.createdAt
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
};

const verifyPassword = async (email, password) => {
  try {
    let user = await Student.findOne({ email }) || 
               await Faculty.findOne({ email }) || 
               await Admin.findOne({ email });
    
    if (!user) return false;
    return bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

const updatePassword = async (userId, newPassword) => {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    let result = await Student.findByIdAndUpdate(userId, { password: hashedPassword }) ||
                 await Faculty.findByIdAndUpdate(userId, { password: hashedPassword }) ||
                 await Admin.findByIdAndUpdate(userId, { password: hashedPassword });
    
    return !!result;
  } catch (error) {
    console.error('Error updating password:', error);
    throw error;
  }
};

// Question operations
const createQuestion = async (questionData) => {
  try {
    console.log('Creating question:', questionData);
    
    if (!questionData.question || !questionData.domain || !questionData.subject || !questionData.createdBy) {
      throw new Error('Missing required fields: question, domain, subject, or createdBy');
    }
    
    if (!['multiple-choice', 'true-false', 'fill-blank'].includes(questionData.type)) {
      throw new Error('Invalid question type');
    }
    
    if (questionData.type === 'multiple-choice' && (!questionData.options || questionData.options.length < 2)) {
      throw new Error('Multiple choice questions must have at least 2 options');
    }
    
    if (questionData.type === 'true-false' && (!questionData.options || questionData.options.length !== 2)) {
      questionData.options = ['True', 'False'];
    }
    
    if (questionData.type === 'fill-blank' && !questionData.correctAnswerText) {
      throw new Error('Fill-in-the-blank questions must have correctAnswerText');
    }
    
    const question = await Question.create({
      question: questionData.question,
      type: questionData.type,
      options: questionData.options || [],
      correctAnswer: questionData.correctAnswer,
      correctAnswerText: questionData.correctAnswerText || null,
      domain: questionData.domain,
      subject: questionData.subject,
      difficulty: questionData.difficulty,
      timeLimit: questionData.timeLimit || 0,
      createdBy: questionData.createdBy,
      createdByRole: questionData.createdByRole || 'faculty'
    });
    
    console.log('Question created with ID:', question._id);
    return question._id.toString();
  } catch (error) {
    console.error('Error creating question:', error);
    throw error;
  }
};

const getQuestionsByDomainAndSubject = async (domain, subject) => {
  try {
    console.log('Getting questions for:', { domain, subject });
    const questions = await Question.find({ domain, subject, isActive: true }).sort({ createdAt: -1 });
    
    const formattedQuestions = questions.map(q => ({
      id: q._id.toString(),
      question: q.question,
      type: q.type,
      options: q.options || [],
      correctAnswer: q.correctAnswer,
      correctAnswerText: q.correctAnswerText,
      domain: q.domain,
      subject: q.subject,
      difficulty: q.difficulty,
      timeLimit: q.timeLimit,
      createdBy: q.createdBy.toString(),
      createdAt: q.createdAt
    }));
    
    console.log('Found questions:', formattedQuestions.length);
    return formattedQuestions;
  } catch (error) {
    console.error('Error getting questions:', error);
    throw error;
  }
};

// Test operations
const createTest = async (testData) => {
  try {
    console.log('Creating test:', testData);
    const test = await Test.create({
      title: testData.title,
      domain: testData.domain,
      subject: testData.subject,
      section: testData.section,
      questions: testData.questions.map(q => q.id || q._id),
      randomizeQuestions: testData.randomizeQuestions,
      questionPoolSize: testData.questionPoolSize || null,
      duration: testData.duration,
      timePerQuestion: testData.timePerQuestion || null,
      totalMarks: testData.totalMarks,
      createdBy: testData.createdBy,
      createdByRole: testData.createdByRole || 'faculty',
      scheduledDate: testData.scheduledDate || null,
      scheduledTime: testData.scheduledTime || null,
      isScheduled: testData.isScheduled,
      isActive: testData.isActive,
      maxAttempts: testData.maxAttempts || 1
    });
    console.log('Test created with ID:', test._id);
    return test._id.toString();
  } catch (error) {
    console.error('Error creating test:', error);
    throw error;
  }
};

const getTestsForStudent = async (domain, section) => {
  try {
    console.log('Getting tests for student:', { domain, section });
    const tests = await Test.find({
      domain,
      $or: [{ section }, { section: 'both' }],
      isActive: true
    }).populate('questions').sort({ createdAt: -1 });
    
    const formattedTests = tests.map(t => ({
      id: t._id.toString(),
      title: t.title,
      domain: t.domain,
      subject: t.subject,
      section: t.section,
      questions: t.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.correctAnswerText,
        domain: q.domain,
        subject: q.subject,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      })),
      randomizeQuestions: t.randomizeQuestions,
      questionPoolSize: t.questionPoolSize,
      duration: t.duration,
      timePerQuestion: t.timePerQuestion,
      totalMarks: t.totalMarks,
      createdBy: t.createdBy.toString(),
      scheduledDate: t.scheduledDate,
      scheduledTime: t.scheduledTime,
      isScheduled: t.isScheduled,
      createdAt: t.createdAt,
      isActive: t.isActive,
      maxAttempts: t.maxAttempts
    }));
    
    console.log('Found tests for student:', formattedTests.length);
    return formattedTests;
  } catch (error) {
    console.error('Error getting tests for student:', error);
    throw error;
  }
};

const getTestById = async (testId) => {
  try {
    console.log('Getting test by ID:', testId);
    const test = await Test.findById(testId).populate('questions');
    if (!test) {
      console.log('Test not found:', testId);
      return null;
    }
    
    const formattedTest = {
      id: test._id.toString(),
      title: test.title,
      domain: test.domain,
      subject: test.subject,
      section: test.section,
      questions: test.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.correctAnswerText,
        domain: q.domain,
        subject: q.subject,
        difficulty: q.difficulty,
        timeLimit: q.timeLimit
      })),
      randomizeQuestions: test.randomizeQuestions,
      questionPoolSize: test.questionPoolSize,
      duration: test.duration,
      timePerQuestion: test.timePerQuestion,
      totalMarks: test.totalMarks,
      createdBy: test.createdBy.toString(),
      scheduledDate: test.scheduledDate,
      scheduledTime: test.scheduledTime,
      isScheduled: test.isScheduled,
      createdAt: test.createdAt,
      isActive: test.isActive,
      maxAttempts: test.maxAttempts
    };
    
    console.log('Found test:', formattedTest);
    return formattedTest;
  } catch (error) {
    console.error('Error getting test by ID:', error);
    throw error;
  }
};

const getFacultyTests = async (facultyId) => {
  try {
    console.log('Getting faculty tests for:', facultyId);
    const tests = await Test.find({ createdBy: facultyId }).populate('questions').sort({ createdAt: -1 });
    
    const formattedTests = tests.map(t => ({
      id: t._id.toString(),
      title: t.title,
      domain: t.domain,
      subject: t.subject,
      section: t.section,
      questions: t.questions.map(q => ({
        id: q._id.toString(),
        question: q.question,
        type: q.type,
        options: q.options || [],
        correctAnswer: q.correctAnswer,
        correctAnswerText: q.correctAnswerText
      })),
      randomizeQuestions: t.randomizeQuestions,
      questionPoolSize: t.questionPoolSize,
      duration: t.duration,
      timePerQuestion: t.timePerQuestion,
      totalMarks: t.totalMarks,
      createdBy: t.createdBy.toString(),
      scheduledDate: t.scheduledDate,
      scheduledTime: t.scheduledTime,
      isScheduled: t.isScheduled,
      createdAt: t.createdAt,
      isActive: t.isActive,
      maxAttempts: t.maxAttempts
    }));
    
    console.log('Found faculty tests:', formattedTests.length);
    return formattedTests;
  } catch (error) {
    console.error('Error getting faculty tests:', error);
    throw error;
  }
};

const updateTestStatus = async (testId, isActive) => {
  try {
    const result = await Test.findByIdAndUpdate(testId, { isActive });
    return !!result;
  } catch (error) {
    console.error('Error updating test status:', error);
    throw error;
  }
};

// Test attempt operations with enhanced violation tracking
const saveTestAttempt = async (attemptData) => {
  try {
    console.log('Saving test attempt:', attemptData);
    // Upsert: ensure only one attempt per (testId, studentId)
    const filter = { testId: attemptData.testId, studentId: attemptData.studentId };

    const update = {
      testId: attemptData.testId,
      studentId: attemptData.studentId,
      studentName: attemptData.studentName,
      answers: attemptData.answers,
      textAnswers: attemptData.textAnswers,
      score: attemptData.score,
      totalQuestions: attemptData.totalQuestions,
      timeSpent: attemptData.timeSpent,
      tabSwitchCount: attemptData.tabSwitchCount || 0,
      warningCount: attemptData.warningCount || 0,
      // Merge violations: prefer new array if provided
      violations: attemptData.violations || [],
      terminationReason: attemptData.terminationReason || null,
      isCompleted: typeof attemptData.isCompleted === 'boolean' ? attemptData.isCompleted : true,
      wasTerminated: !!attemptData.wasTerminated,
      ipAddress: attemptData.ipAddress || null,
      userAgent: attemptData.userAgent || null,
      browserInfo: attemptData.browserInfo || null,
      completedAt: Date.now()
    };

    const options = { upsert: true, new: true, setDefaultsOnInsert: true };

    const attempt = await TestAttempt.findOneAndUpdate(filter, update, options);

    console.log('Test attempt upserted with ID:', attempt._id);
    return attempt._id.toString();
  } catch (error) {
    console.error('Error saving test attempt:', error);
    throw error;
  }
};

const getTestResults = async (testId) => {
  try {
    console.log('Getting test results for:', testId);
    const attempts = await TestAttempt.find({ testId }).sort({ score: -1, completedAt: 1 });
    
    const formattedAttempts = attempts.map(a => ({
      id: a._id.toString(),
      testId: a.testId.toString(),
      studentId: a.studentId.toString(),
      studentName: a.studentName,
      answers: Object.fromEntries(a.answers),
      textAnswers: a.textAnswers ? Object.fromEntries(a.textAnswers) : null,
      score: a.score,
      totalQuestions: a.totalQuestions,
      timeSpent: a.timeSpent,
      tabSwitchCount: a.tabSwitchCount,
      warningCount: a.warningCount,
      violations: a.violations,
      terminationReason: a.terminationReason,
      isCompleted: a.isCompleted,
      wasTerminated: a.wasTerminated,
      completedAt: a.completedAt
    }));
    
    console.log('Found test results:', formattedAttempts.length);
    return formattedAttempts;
  } catch (error) {
    console.error('Error getting test results:', error);
    throw error;
  }
};

const getStudentProgress = async (studentId) => {
  try {
    console.log('Getting student progress for:', studentId);
    const attempts = await TestAttempt.find({ studentId }).sort({ completedAt: -1 });
    
    const formattedAttempts = attempts.map(a => ({
      id: a._id.toString(),
      testId: a.testId.toString(),
      studentId: a.studentId.toString(),
      studentName: a.studentName,
      answers: Object.fromEntries(a.answers),
      textAnswers: a.textAnswers ? Object.fromEntries(a.textAnswers) : null,
      score: a.score,
      totalQuestions: a.totalQuestions,
      timeSpent: a.timeSpent,
      tabSwitchCount: a.tabSwitchCount,
      warningCount: a.warningCount,
      violations: a.violations,
      terminationReason: a.terminationReason,
      isCompleted: a.isCompleted,
      wasTerminated: a.wasTerminated,
      completedAt: a.completedAt
    }));
    
    console.log('Found student progress:', formattedAttempts.length);
    return formattedAttempts;
  } catch (error) {
    console.error('Error getting student progress:', error);
    throw error;
  }
};

const checkTestCompletion = async (testId, studentId) => {
  try {
    const attempt = await TestAttempt.findOne({ testId, studentId });
    
    if (!attempt) return { hasCompleted: false, attempt: null };
    
    return {
      hasCompleted: true,
      attempt: {
        id: attempt._id.toString(),
        score: attempt.score,
        totalQuestions: attempt.totalQuestions,
        completedAt: attempt.completedAt,
        wasTerminated: attempt.wasTerminated,
        violations: attempt.violations
      }
    };
  } catch (error) {
    console.error('Error checking test completion:', error);
    throw error;
  }
};

// Admin operations
const getAllUsers = async () => {
  try {
    const students = await Student.find().sort({ createdAt: -1 });
    const faculty = await Faculty.find().sort({ createdAt: -1 });
    
    const formattedStudents = students.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      domain: u.domain,
      section: u.section,
      enrollmentNumber: u.enrollmentNumber,
      created_at: u.createdAt
    }));
    
    const formattedFaculty = faculty.map(u => ({
      id: u._id.toString(),
      email: u.email,
      name: u.name,
      role: u.role,
      domains: u.domains,
      employeeId: u.employeeId,
      created_at: u.createdAt
    }));
    
    return { students: formattedStudents, faculty: formattedFaculty };
  } catch (error) {
    console.error('Error getting all users:', error);
    throw error;
  }
};

const deleteUser = async (userId) => {
  try {
    let result = await Student.findByIdAndDelete(userId) ||
                 await Faculty.findByIdAndDelete(userId) ||
                 await Admin.findByIdAndDelete(userId);
    return !!result;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
};

// Audit log operations
const createAuditLog = async (logData) => {
  try {
    const log = await AuditLog.create({
      userId: logData.userId,
      userEmail: logData.userEmail,
      userRole: logData.userRole,
      action: logData.action,
      details: logData.details,
      ipAddress: logData.ipAddress,
      userAgent: logData.userAgent
    });
    return log._id.toString();
  } catch (error) {
    console.error('Error creating audit log:', error);
    throw error;
  }
};

const getAuditLogs = async () => {
  try {
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(1000);
    return logs.map(log => ({
      id: log._id.toString(),
      user_id: log.userId ? log.userId.toString() : null,
      user_email: log.userEmail,
      user_role: log.userRole,
      action: log.action,
      details: log.details,
      ip_address: log.ipAddress,
      user_agent: log.userAgent,
      created_at: log.createdAt
    }));
  } catch (error) {
    console.error('Error getting audit logs:', error);
    throw error;
  }
};

module.exports = {
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
};