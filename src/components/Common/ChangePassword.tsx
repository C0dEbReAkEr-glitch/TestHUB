import { useState } from "react";
import { authService } from "../../services/auth";
import { Lock, Eye, EyeOff, Check, Shield } from "lucide-react";

export default function ChangePassword() {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ type: "error", text: "New passwords do not match." });
      setLoading(false);
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage({
        type: "error",
        text: "Password must be at least 6 characters long.",
      });
      setLoading(false);
      return;
    }

    try {
      await authService.updatePassword(formData.newPassword);
      setMessage({ type: "success", text: "Password updated successfully!" });
      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      setMessage({
        type: "error",
        text: error.message || "Failed to update password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field: "current" | "new" | "confirm") => {
    setShowPasswords((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="max-w-md mx-auto px-4 sm:px-0">
      <div className="bg-surface border border-borderLight rounded-2xl shadow-medium p-8">
        {/* Header */}
        <div className="flex items-center mb-6 space-x-3">
          <Shield className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold text-textPrimary">
            Change Password
          </h3>
        </div>

        {/* Message */}
        {message.text && (
          <div
            className={`mb-5 p-4 rounded-xl border flex items-center gap-2 text-sm font-medium ${
              message.type === "success"
                ? "bg-green-50 border-green-200 text-success"
                : "bg-red-50 border-red-200 text-error"
            }`}
          >
            {message.type === "success" && <Check className="h-4 w-4" />}
            <span>{message.text}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {[
            { label: "Current Password", field: "current", value: formData.currentPassword },
            { label: "New Password", field: "new", value: formData.newPassword },
            { label: "Confirm New Password", field: "confirm", value: formData.confirmPassword },
          ].map(({ label, field, value }) => (
            <div key={field}>
              <label className="block text-sm font-medium text-textSecondary mb-2">
                {label}
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-textSecondary/50" />
                <input
                  type={showPasswords[field as keyof typeof showPasswords] ? "text" : "password"}
                  value={value}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      [`${field}Password`]: e.target.value,
                    }))
                  }
                  className="w-full pl-10 pr-12 py-3 rounded-xl border border-borderMuted bg-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary text-sm text-textPrimary placeholder:text-textSecondary/50 transition-all"
                  placeholder={`Enter ${label.toLowerCase()}`}
                  required
                />
                <button
                  type="button"
                  onClick={() =>
                    togglePasswordVisibility(field as "current" | "new" | "confirm")
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary/60 hover:text-textPrimary transition-colors"
                >
                  {showPasswords[field as keyof typeof showPasswords] ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>
          ))}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-3 rounded-xl font-medium text-sm hover:bg-primaryHover focus:ring-2 focus:ring-primary focus:ring-offset-2 shadow-soft transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>

        {/* Tip */}
        <p className="text-xs text-textSecondary mt-6 text-center">
          🔒 Use a strong password with a mix of letters, numbers, and symbols.
        </p>
      </div>
    </div>
  );
}
