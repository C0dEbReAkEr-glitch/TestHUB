import { useState } from "react";
import { authService } from "../../services/auth";
import Layout from "../Layout";
import UserManagement from "./UserManagement";
import AuditLogs from "./AuditLogs";
import SystemSettings from "./SystemSettings";
import ChangePassword from "../Common/ChangePassword";

export default function AdminDashboard() {
  const user = authService.getCurrentUser();
  const [activeTab, setActiveTab] = useState<
    "users" | "audit" | "settings" | "password"
  >("users");

  if (!user || user.role !== "admin") {
    return (
      <Layout>
        <div className="text-center py-12">
          <p className="text-textSecondary">
            Access denied. Admin privileges required.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Admin Dashboard - ${user.name}`}>
      <div className="space-y-4">
        {/* Admin Info Card */}
        <div className="rounded-xl bg-gradient-to-r from-primary/90 via-primary/80 to-secondary/90 text-white p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="text-2xl font-semibold tracking-tight">
                {user.name}
              </h3>
              <p className="text-sm text-white/80">System Administrator</p>
              <p className="text-sm text-white/70">{user.email}</p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold drop-shadow-sm">Admin</div>
              <div className="text-white/80 text-sm">Control Panel</div>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="grid lg:grid-cols-4 grid-cols-2 bg-surface p-2 rounded-xl shadow-inner border border-">
          {[
            { id: "users", label: "User Management" },
            { id: "audit", label: "Audit Logs" },
            { id: "settings", label: "System Settings" },
            { id: "password", label: "Change Password" },
          ].map(({ id, label }) => {
            const active = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-md border border-primary/30 font-bold"
                    : "text-textSecondary hover:text-primary hover:bg-white"
                }`}
              >
                <span>{label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <div className="animate-fadeIn">
          {activeTab === "users" && <UserManagement />}
          {activeTab === "audit" && <AuditLogs />}
          {activeTab === "settings" && <SystemSettings />}
          {activeTab === "password" && <ChangePassword />}
        </div>
      </div>
    </Layout>
  );
}
