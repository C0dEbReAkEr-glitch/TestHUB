import { useState } from 'react';
import { authService } from '../../services/auth';
import { Users, Settings, FileText, Shield } from 'lucide-react';
import Layout from '../Layout';
import UserManagement from './UserManagement';
import AuditLogs from './AuditLogs';
import SystemSettings from './SystemSettings';
import ChangePassword from '../Common/ChangePassword';

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<'users' | 'audit' | 'settings' | 'password'>('users');

  if (!user || user.role !== 'admin') {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-gray-600">Access denied. Admin privileges required.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Admin Dashboard - ${user.name}`}>
      <div className="space-y-6">
        {/* Admin Info Card */}
        <div className="bg-gradient-to-r from-red-600 to-purple-600 rounded-xl p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-red-100">System Administrator</p>
              <p className="text-red-200 text-sm">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">Admin</div>
              <div className="text-red-100 text-sm">Control Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'users', label: 'User Management', icon: Users },
            { id: 'audit', label: 'Audit Logs', icon: FileText },
            { id: 'settings', label: 'System Settings', icon: Settings },
            { id: 'password', label: 'Change Password', icon: Shield },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-md font-medium transition-all ${
                activeTab === id
                  ? 'bg-white text-red-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'users' && <UserManagement />}
        {activeTab === 'audit' && <AuditLogs />}
        {activeTab === 'settings' && <SystemSettings />}
        {activeTab === 'password' && <ChangePassword />}
      </div>
    </Layout>
  );
}