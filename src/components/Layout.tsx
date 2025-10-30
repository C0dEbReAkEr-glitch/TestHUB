import React from 'react';
import { authService } from '../services/auth';
import { LogOut, User, BookOpen } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children, title = 'JIMS TestHub' }: LayoutProps) {
  const user = authService.getCurrentUser();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="fixed inset-0 z-0"
        style={{
          backgroundImage: 'url(/jims.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="bg-white/95 backdrop-blur-sm shadow-lg border-b border-blue-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-3">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-xl font-bold text-gray-900">JIMS TestHub</h1>
                  <p className="text-xs text-gray-600">Rohini Sector-5</p>
                </div>
              </div>
              
              {user && (
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-5 w-5 text-gray-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {user.email}
                    </span>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="flex items-center space-x-1 px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 min-h-[calc(100vh-12rem)]">
            <div className="p-6">
              {title && (
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
                  <div className="h-1 w-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-full mt-2"></div>
                </div>
              )}
              {children}
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="bg-white/95 backdrop-blur-sm border-t border-blue-200 mt-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="text-center text-sm text-gray-600">
              <p>&copy; 2024 JIMS TestHub - Jagan Institute of Management Studies, Rohini Sector-5</p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}