import { useState } from "react";
import {
  Settings,
  Database,
  Download,
  Upload,
  AlertTriangle,
  Loader2,
  ShieldCheck,
  Server,
} from "lucide-react";

export default function SystemSettings() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert("✅ Database backup completed successfully!");
    } catch {
      alert("❌ Backup failed. Please try again.");
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (
      !confirm(
        "⚠️ Are you sure you want to restore the database? This will overwrite all current data."
      )
    )
      return;
    setRestoreLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 3000));
      alert("✅ Database restore completed successfully!");
    } catch {
      alert("❌ Restore failed. Please try again.");
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-10 px-4 sm:px-6 md:px-10">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-textPrimary tracking-tight">
          System Settings
        </h1>
        <p className="text-textSecondary text-sm mt-1">
          Manage your database and environment configuration with care.
        </p>
      </div>

      {/* Database Management */}
      <div className="bg-surface rounded-2xl border border-borderLight shadow-medium p-6 space-y-6">
        <div className="flex items-center space-x-3 mb-2">
          <Database className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-textPrimary">
            Database Management
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup */}
          <div className="bg-muted rounded-xl border border-borderLight p-5 flex flex-col justify-between shadow-soft hover:shadow-medium transition-shadow">
            <div>
              <h4 className="font-medium text-textPrimary mb-2">
                Backup Database
              </h4>
              <p className="text-sm text-textSecondary mb-4">
                Create a secure backup of all users, tests, and results. It’s
                recommended before major updates.
              </p>
            </div>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="flex items-center justify-center gap-2 bg-primary text-white py-2.5 rounded-xl font-medium text-sm hover:bg-primaryHover shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {backupLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{backupLoading ? "Creating Backup..." : "Create Backup"}</span>
            </button>
          </div>

          {/* Restore */}
          <div className="bg-muted rounded-xl border border-borderLight p-5 flex flex-col justify-between shadow-soft hover:shadow-medium transition-shadow">
            <div>
              <h4 className="font-medium text-textPrimary mb-2">
                Restore Database
              </h4>
              <p className="text-sm text-textSecondary mb-4">
                Restore from a previous backup. This will overwrite all current
                records — use with caution.
              </p>
            </div>
            <button
              onClick={handleRestore}
              disabled={restoreLoading}
              className="flex items-center justify-center gap-2 bg-error text-white py-2.5 rounded-xl font-medium text-sm hover:bg-red-700 shadow-soft disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              {restoreLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{restoreLoading ? "Restoring..." : "Restore Database"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-surface rounded-2xl border border-borderLight shadow-medium p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-primary" />
          <h3 className="text-lg font-semibold text-textPrimary">
            System Information
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* App Details */}
          <div className="bg-muted rounded-xl p-5 border border-borderLight shadow-soft">
            <div className="flex items-center mb-3">
              <Server className="h-5 w-5 text-secondary mr-2" />
              <h4 className="font-medium text-textPrimary">
                Application Details
              </h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-textSecondary">Version:</dt>
                <dd className="font-medium text-textPrimary">1.0.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-textSecondary">Environment:</dt>
                <dd className="font-medium text-textPrimary">Development</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-textSecondary">Database:</dt>
                <dd className="font-medium text-textPrimary">MongoDB</dd>
              </div>
            </dl>
          </div>

          {/* Security */}
          <div className="bg-muted rounded-xl p-5 border border-borderLight shadow-soft">
            <div className="flex items-center mb-3">
              <ShieldCheck className="h-5 w-5 text-primary mr-2" />
              <h4 className="font-medium text-textPrimary">
                Security Settings
              </h4>
            </div>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-textSecondary">Authentication:</dt>
                <dd className="font-medium text-success">JWT Enabled</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-textSecondary">Password Hashing:</dt>
                <dd className="font-medium text-success">bcrypt</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-textSecondary">Anti-Cheating:</dt>
                <dd className="font-medium text-success">Active</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="bg-warning/10 border border-warning/30 rounded-xl p-5 flex items-start space-x-3">
        <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
        <div>
          <h4 className="text-sm font-medium text-warning">
            Important Notice
          </h4>
          <p className="text-sm text-textSecondary mt-1">
            Always create a backup before making any major system changes. These
            operations cannot be undone.
          </p>
        </div>
      </div>
    </div>
  );
}
