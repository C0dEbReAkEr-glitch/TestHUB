const API_BASE_URL = 'http://localhost:3001/api';

export const api = {
  // User operations
  createUser: async (userData: any) => {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  getUserByEmail: async (email: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}`);
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error('Failed to get user');
    }
    return response.json();
  },

  updatePassword: async (email: string, newPassword: string) => {
    const response = await fetch(`${API_BASE_URL}/users/${encodeURIComponent(email)}/password`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ newPassword })
    });
    if (!response.ok) throw new Error('Failed to update password');
    return response.json();
  },

  // Question operations
  createQuestion: async (questionData: any) => {
    const response = await fetch(`${API_BASE_URL}/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(questionData)
    });
    if (!response.ok) throw new Error('Failed to create question');
    return response.json();
  },

  getQuestionsByDomainAndSubject: async (domain: string, subject: string) => {
    const response = await fetch(`${API_BASE_URL}/questions/${domain}/${encodeURIComponent(subject)}`);
    if (!response.ok) throw new Error('Failed to get questions');
    return response.json();
  },

  // Test operations
  createTest: async (testData: any) => {
    const response = await fetch(`${API_BASE_URL}/tests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });
    if (!response.ok) throw new Error('Failed to create test');
    return response.json();
  },

  getTestsForStudent: async (domain: string, section: string) => {
    const response = await fetch(`${API_BASE_URL}/tests/${domain}/${section}`);
    if (!response.ok) throw new Error('Failed to get tests');
    return response.json();
  },

  getFacultyTests: async (facultyId: string) => {
    const response = await fetch(`${API_BASE_URL}/faculty-tests/${facultyId}`);
    if (!response.ok) throw new Error('Failed to get faculty tests');
    return response.json();
  },

  updateTestStatus: async (testId: string, isActive: boolean) => {
    const response = await fetch(`${API_BASE_URL}/tests/${testId}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive })
    });
    if (!response.ok) throw new Error('Failed to update test status');
    return response.json();
  },

  // Test attempt operations
  saveTestAttempt: async (attemptData: any) => {
    const response = await fetch(`${API_BASE_URL}/test-attempts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(attemptData)
    });
    if (!response.ok) throw new Error('Failed to save test attempt');
    return response.json();
  },

  getTestResults: async (testId: string) => {
    const response = await fetch(`${API_BASE_URL}/test-results/${testId}`);
    if (!response.ok) throw new Error('Failed to get test results');
    return response.json();
  },

  getStudentProgress: async (studentId: string) => {
    const response = await fetch(`${API_BASE_URL}/student-progress/${studentId}`);
    if (!response.ok) throw new Error('Failed to get student progress');
    return response.json();
  }
};