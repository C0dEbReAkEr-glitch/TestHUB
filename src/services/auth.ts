import { Domain } from '../types';

interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: 'student' | 'faculty' | 'admin';
  domain: Domain[];
  section?: 'A' | 'B';
}

class AuthService {
  private currentUser: AuthUser | null = null;
  private listeners: ((user: AuthUser | null) => void)[] = [];
  private API_BASE_URL = 'http://localhost:3001/api';

  getCurrentUser(): AuthUser | null {
    return this.currentUser;
  }

  onAuthStateChanged(callback: (user: AuthUser | null) => void) {
    this.listeners.push(callback);
    callback(this.currentUser); // Call immediately with current state
    
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  async signIn(email: string, password: string): Promise<AuthUser> {
    const response = await fetch(`${this.API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      // try to extract structured error, else throw generic
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.message || 'Login failed');
    }

    interface LoginResponse {
      user: AuthUser;
      token: string;
      [key: string]: unknown;
    }

    const userData = (await response.json()) as LoginResponse;
    this.currentUser = userData.user;
    this.notifyListeners();

    // Store session
    localStorage.setItem('authToken', userData.token);
    localStorage.setItem('currentUser', JSON.stringify(userData.user));

    return userData.user;
  }

  async signUp(userData: {
    email: string;
    password: string;
    name: string;
    role: 'student' | 'faculty';
    domain: Domain[];
    section?: 'A' | 'B';
  }): Promise<AuthUser> {
    const response = await fetch('http://localhost:3001/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });

    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || errBody.message || 'Registration failed');
    }

    interface RegisterResponse {
      user: AuthUser;
      token: string;
      [key: string]: unknown;
    }

    const result = (await response.json()) as RegisterResponse;
    this.currentUser = result.user;
    this.notifyListeners();

    // Store session
    localStorage.setItem('authToken', result.token);
    localStorage.setItem('currentUser', JSON.stringify(result.user));

    return result.user;
  }

  async signOut(): Promise<void> {
    this.currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    this.notifyListeners();
  }

  async updatePassword(newPassword: string): Promise<void> {
    if (!this.currentUser) throw new Error('No user logged in');
    
    const response = await fetch(`${this.API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('authToken')}`
      },
      body: JSON.stringify({ newPassword })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Password update failed');
    }
  }

  // Initialize auth state from localStorage
  initializeAuth(): void {
    const token = localStorage.getItem('authToken');
    const userStr = localStorage.getItem('currentUser');
    
    if (token && userStr) {
      try {
        this.currentUser = JSON.parse(userStr);
        this.notifyListeners();
      } catch (error) {
        console.error('Error parsing stored user data:', error);
        this.signOut();
      }
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach(listener => listener(this.currentUser));
  }
}

export const authService = new AuthService();

// Initialize auth on app start
authService.initializeAuth();