import React, { useState } from "react";
import { authService } from "../../services/auth";
import { Eye, EyeOff, Mail, Lock, LogIn, AlertCircle } from "lucide-react";

export default function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await authService.signIn(email, password);
    } catch (error: any) {
      setError(error.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8 text-center">
        <h2 className="text-xl font-bold text-textPrimary mb-1">
          Sign in to access your dashboard
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Error Message */}
        {error && (
          <div className="bg-error/10 border border-error/40 text-error px-4 py-3.5 rounded-xl flex items-start space-x-3 animate-shake">
            <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium">Authentication Failed</p>
              <p className="text-sm mt-0.5">{error}</p>
            </div>
          </div>
        )}

        {/* Email */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-textPrimary ml-1">
            Email Address
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full pl-12 pr-4 py-3 border border-borderStrong rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-muted/50"
              placeholder="your_email@jimsipu.edu"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-textPrimary ml-1">
            Password
          </label>
          <div className="relative group">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-textSecondary group-focus-within:text-primary transition-colors" />
            </div>
            <input
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full pl-12 pr-12 py-3 border border-borderStrong rounded-lg text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-muted/50"
              placeholder="Enter your password"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-textSecondary hover:text-primary transition-colors focus:outline-none"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Remember Me + Forgot Password */}
        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-muted text-primary focus:ring-2 focus:ring-primary cursor-pointer"
            />
            <span className="text-textSecondary hover:text-textPrimary transition-colors">
              Remember me
            </span>
          </label>
          <button
            type="button"
            className="text-primary hover:text-primaryHover font-medium transition-colors"
          >
            Forgot password?
          </button>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary text-white py-3.5 px-4 rounded-lg font-semibold hover:bg-primaryHover focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-60 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-soft flex items-center justify-center space-x-2"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Signing In...</span>
            </>
          ) : (
            <>
              <LogIn className="h-5 w-5" />
              <span>Sign In</span>
            </>
          )}
        </button>
      </form>

      {/* Footer Help */}
      <div className=" pt-8 text-center space-y-3">
        <p className="text-textSecondary text-sm">
          First time here?{" "}
          <button className="text-primary font-semibold hover:text-primaryHover underline underline-offset-2">
            Learn how to access
          </button>
        </p>
        <div className="flex items-center justify-center space-x-2 text-xs text-success">
          <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
          <span>System Status: Online</span>
        </div>
      </div>

      {/* Shake Animation */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-8px); }
          75% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
}
