import LoginForm from "./LoginForm";
import JIMSInfo from "../jimsinfo";

export default function AuthPage() {
  return (
    <div className="h-screen flex flex-col lg:flex-row lg:overflow-hidden bg-background text-textPrimary">
      {/* Left Section - Branding & Info */}
      <div className="flex-1 relative flex flex-col bg-primary text-white">
        {/* Subtle overlay gradient for depth */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/90 via-primary to-secondary/40 pointer-events-none" />

        {/* Centered content */}
        <div className="relative z-10 flex flex-col items-center lg:items-start justify-center text-center lg:text-left px-8 lg:px-20 flex-grow space-y-10">
          {/* Logo + Title */}
          <div className="flex flex-col items-center lg:items-start space-y-4">
            <img
              src="/jims_logo.png"
              alt="JIMS Logo"
              className="w-80 h-24 object-contain bg-white rounded-xl p-3 shadow-soft"
            />
            <div>
              <h1 className="text-4xl font-bold tracking-tight">JIMS TestHub</h1>
              <p className="text-white/90 text-sm">
                Jagan Institute of Management Studies
              </p>
            </div>
          </div>

          {/* Decorative Accent */}
          <div className="hidden lg:block">
            <div className="w-24 h-1 bg-gradient-to-r from-white/80 to-secondary rounded-full" />
          </div>
        </div>

        {/* Info section pinned near bottom for layout balance */}
        <div className="hidden lg:block relative z-10 px-8 lg:px-20 pb-12">
          <JIMSInfo />
        </div>
      </div>

      {/* Right Section - Login */}
      <div className="flex-1 flex flex-col justify-center items-center px-8 lg:px-20 py-4 bg-surface relative">
        {/* Soft inset shadow to separate panels */}
        <div className="absolute inset-0 shadow-[inset_0_0_20px_rgba(0,0,0,0.04)] pointer-events-none" />

        <div className="relative z-10 w-full max-w-sm bg-formBackground backdrop-blur-xl rounded-2xl border border-borderPrimary shadow-medium p-8">
          <LoginForm />
        </div>

        {/* Mobile Info Below Form */}
        <div className="bg-primary lg:hidden relative z-10 mt-8 w-screen p-8">
          <JIMSInfo />
        </div>
      </div>
    </div>
  );
}
