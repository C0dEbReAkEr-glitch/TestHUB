/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // 🌿 Core Brand Colors
        primary: "#16A34A",        // Fresh green (energizing, for primary buttons)
        primaryHover: "#15803D",   // Darker green for hover states
        secondary: "#F59E0B",      // Warm amber accent for highlights
        secondaryHover: "#D97706", // Hover shade for secondary

        // ⚪ Neutrals & Backgrounds
        background: "#FAFAF9",     // Soft off-white background
        surface: "#FFFFFF",        // Cards / containers
        muted: "#F4F4F5",          // Light gray for input backgrounds, dividers

        // 🖋 Text Colors
        textPrimary: "#1C1917",    // Deep warm gray for headings
        textSecondary: "#57534E",  // Muted text for secondary info

        // ✅ Feedback
        success: "#22C55E",        // Correct answer / success
        error: "#DC2626",          // Incorrect answer / error
        warning: "#FACC15",        // Alerts or time warnings

        // 🧱 Borders
        borderLight: "#E5E7EB",    // Light border for cards / dividers
        borderMuted: "#D6D3D1",    // Slightly darker neutral border
        borderStrong: "#78716C",   // Stronger contrast for outlines
        borderPrimary: "#16A34A",  // Green border variant
        borderSecondary: "#F59E0B",
        borderError: "#DC2626",    // Error border

        formBackground: '#ffffd4',
      },
      fontFamily: {
        sans: ["Poppins", "sans-serif"],
      },
      boxShadow: {
        soft: "0 4px 20px rgba(0, 0, 0, 0.05)",
        medium: "0 6px 24px rgba(0, 0, 0, 0.08)",
      },
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
