import React from "react";
import { authService } from "../services/auth";
import { LogOut } from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
}

export default function Layout({ children }: LayoutProps) {
  const user = authService.getCurrentUser();

  const handleSignOut = async () => {
    try {
      await authService.signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-muted via-background to-surface text-textPrimary">
      {/* Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/50 border-b border-borderLight shadow-soft">
        {/* Subtle Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-primary/10 to-secondary/20"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap md:flex-nowrap justify-between items-center h-auto md:h-16 py-3 gap-3 md:gap-0">
            {/* Logo + Title */}
            <div className="flex items-center space-x-3 flex-shrink-0">
              <div className="p-2 rounded-lg bg-white/40 border border-white/30 backdrop-blur-sm">
                <img src="./jims_logo.png" alt="JIMS" className="object-contain w-20 h-8"/>
              </div>
              <div className="flex flex-col">
                <h1 className="text-base sm:text-lg font-semibold text-textPrimary tracking-tight">
                  JIMS TestHub
                </h1>
                <p className="text-xs text-textSecondary">
                  Rohini Sector-5
                </p>
              </div>
            </div>

            {/* User Info */}
            {user && (
              <div className="flex flex-col sm:flex-row items-center sm:space-x-4 space-y-2 sm:space-y-0 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSignOut}
                  className="flex items-center justify-center space-x-1 px-3 py-2 text-sm font-medium rounded-lg bg-error/10 text-error hover:bg-error/20 transition-all w-full sm:w-auto"
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
      <main className="flex-1 w-full py-4 sm:py-8 bg-gradient-to-br from-background via-surface/60 to-background text-textPrimary relative overflow-hidden">
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 text-center text-xs sm:text-sm text-white">
          © {new Date().getFullYear()}{" "}
          <span className="font-medium">JIMS TestHub</span> — Jagan Institute of
          Management Studies, Rohini Sector-5
        </div>
      </footer>
    </div>
  );
}
