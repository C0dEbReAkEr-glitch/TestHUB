import { useState } from 'react';
import { Settings, Database, Download, Upload, AlertTriangle } from 'lucide-react';

export default function SystemSettings() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const handleBackup = async () => {
    setBackupLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Database backup completed successfully!');
    } catch (error) {
      alert('Backup failed. Please try again.');
    } finally {
      setBackupLoading(false);
    }
  };

  const handleRestore = async () => {
    if (!confirm('Are you sure you want to restore the database? This will overwrite all current data.')) {
      return;
    }
    
    setRestoreLoading(true);
    try {
      // Simulate restore process
      await new Promise(resolve => setTimeout(resolve, 3000));
      alert('Database restore completed successfully!');
    } catch (error) {
      alert('Restore failed. Please try again.');
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Database Management */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Database className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-medium text-gray-900">Database Management</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Backup Database</h4>
            <p className="text-sm text-gray-600 mb-4">
              Create a backup of the current database including all users, tests, and results.
            </p>
            <button
              onClick={handleBackup}
              disabled={backupLoading}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {backupLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Download className="h-4 w-4" />
              )}
              <span>{backupLoading ? 'Creating Backup...' : 'Create Backup'}</span>
            </button>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">Restore Database</h4>
            <p className="text-sm text-gray-600 mb-4">
              Restore database from a previous backup. This will overwrite all current data.
            </p>
            <button
              onClick={handleRestore}
              disabled={restoreLoading}
              className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {restoreLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <Upload className="h-4 w-4" />
              )}
              <span>{restoreLoading ? 'Restoring...' : 'Restore Database'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* System Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Settings className="h-6 w-6 text-red-600" />
          <h3 className="text-lg font-medium text-gray-900">System Information</h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Application Details</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Version:</dt>
                <dd className="text-sm font-medium text-gray-900">1.0.0</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Environment:</dt>
                <dd className="text-sm font-medium text-gray-900">Development</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Database:</dt>
                <dd className="text-sm font-medium text-gray-900">MongoDB</dd>
              </div>
            </dl>
          </div>
          
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Security Settings</h4>
            <dl className="space-y-2">
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Authentication:</dt>
                <dd className="text-sm font-medium text-green-600">JWT Enabled</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Password Hashing:</dt>
                <dd className="text-sm font-medium text-green-600">bcrypt</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-sm text-gray-600">Anti-Cheating:</dt>
                <dd className="text-sm font-medium text-green-600">Active</dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* Warning Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
          <div>
            <h4 className="text-sm font-medium text-yellow-800">Important Notice</h4>
            <p className="text-sm text-yellow-700 mt-1">
              Always create a backup before making any system changes. Database operations cannot be undone.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}