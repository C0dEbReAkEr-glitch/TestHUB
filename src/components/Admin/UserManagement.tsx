import React, { useState, useEffect } from "react";
import { Users, UserPlus, Trash2, Eye, EyeOff, Key } from "lucide-react";
import { Domain } from "../../types";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  domains: string[];
  section?: string;
  created_at: string;
}

interface UserData {
  students: User[];
  faculty: User[];
}

export default function UserManagement() {
  const [users, setUsers] = useState<UserData>({ students: [], faculty: [] });
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "student" as "student" | "faculty",
    domains: [] as Domain[],
    section: "A" as "A" | "B",
  });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.error("No auth token found");
        return;
      }

      const response = await fetch("http://localhost:3001/api/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();

        // Normalize API response: accept { students: [], faculty: [] } or flat array
        let students: User[] = [];
        let faculty: User[] = [];

        if (Array.isArray(data)) {
          data.forEach((u: any) => {
            if (u && u.role === "faculty") faculty.push(u as User);
            else if (u) students.push(u as User);
          });
        } else if (data && typeof data === "object") {
          students = Array.isArray(data.students)
            ? data.students
            : Array.isArray(data.users)
            ? data.users.filter((u: any) => u.role !== "faculty")
            : [];
          faculty = Array.isArray(data.faculty)
            ? data.faculty
            : Array.isArray(data.users)
            ? data.users.filter((u: any) => u.role === "faculty")
            : [];
        }

        setUsers({ students, faculty });
      } else {
        const error = await response.json();
        console.error("Failed to load users:", error);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("authToken");
      // Build payload: students expect a single domain string; faculty expect an array of domains
      const payload: Record<string, unknown> = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        section: formData.section,
      };

      if (formData.role === "student") {
        payload.domain = formData.domains.length > 0 ? formData.domains[0] : "";
      } else {
        // faculty can have multiple domains
        payload.domain = formData.domains;
      }

      const response = await fetch(
        "http://localhost:3001/api/admin/create-user",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowCreateForm(false);
        setFormData({
          name: "",
          email: "",
          password: "",
          role: "student",
          domains: [],
          section: "A",
        });
        loadUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      alert("Error creating user. Please try again.");
    }
  };

  const handleDeleteUser = async (userId: string, userType: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this user? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        `http://localhost:3001/api/admin/users/${userId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ userType }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        loadUsers();
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete user");
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user. Please try again.");
    }
  };

  const handleChangePassword = async () => {
    if (!selectedUser || !newPassword.trim()) {
      alert("Please enter a new password");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }

    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(
        "http://localhost:3001/api/admin/change-user-password",
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            userId: selectedUser.id,
            newPassword,
            userType: selectedUser.role,
          }),
        }
      );

      if (response.ok) {
        const result = await response.json();
        alert(result.message);
        setShowPasswordModal(false);
        setSelectedUser(null);
        setNewPassword("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to change password");
      }
    } catch (error) {
      console.error("Error changing password:", error);
      alert("Error changing password. Please try again.");
    }
  };

  const handleDomainChange = (domain: Domain) => {
    setFormData((prev) => ({
      ...prev,
      domains: prev.domains.includes(domain)
        ? prev.domains.filter((d) => d !== domain)
        : [...prev.domains, domain],
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
  <div className="space-y-8">
    {/* Change Password Modal */}
    {showPasswordModal && selectedUser && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface p-6 rounded-2xl shadow-medium w-full max-w-md mx-4">
          <h3 className="text-xl font-semibold text-textPrimary mb-4">
            Change Password
          </h3>

          <div className="mb-4 space-y-1">
            <p className="text-sm text-textSecondary">
              <strong className="text-textPrimary">User:</strong> {selectedUser.name} ({selectedUser.email})
            </p>
            <p className="text-sm text-textSecondary">
              <strong className="text-textPrimary">Role:</strong> {selectedUser.role}
            </p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-textPrimary mb-1">
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 pr-10 border border-borderLight rounded-lg bg-muted focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter new password (min 6 characters)"
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-textSecondary hover:text-textPrimary"
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => {
                setShowPasswordModal(false);
                setSelectedUser(null);
                setNewPassword("");
              }}
              className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors"
            >
              Change Password
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Students Table */}
    <div className="bg-surface rounded-2xl shadow-soft border border-borderLight overflow-hidden">
      <div className="flex justify-between px-6 py-4 border-b border-borderLight">
        <h3 className="text-lg font-semibold text-textPrimary">
          Students ({users.students.length})
        </h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Create Student</span>
        </button>
      </div>

      {users.students.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-borderMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textPrimary mb-1">
            No Students Found
          </h3>
          <p className="text-textSecondary">
            Create student accounts to see them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-borderLight">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Student
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Domain & Section
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-borderLight">
              {users.students.map((student) => (
                <tr key={student.id} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-textPrimary">
                        {student.name}
                      </div>
                      <div className="text-sm text-textSecondary">
                        {student.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                    {Array.isArray(student.domains)
                      ? student.domains.join(", ")
                      : "No domain"}{" "}
                    - Section {student.section || "N/A"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                    {student.created_at || (student as any).createdAt
                      ? new Date(
                          student.created_at || (student as any).createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedUser(student);
                        setShowPasswordModal(true);
                      }}
                      className="text-primary hover:text-primaryHover"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(student.id, "student")}
                      className="text-error hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Faculty Table */}
    <div className="bg-surface rounded-2xl shadow-soft border border-borderLight overflow-hidden">
      <div className="flex justify-between px-6 py-4 border-b border-borderLight">
        <h3 className="text-lg font-semibold text-textPrimary">
          Faculty ({users.faculty.length})
        </h3>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 bg-primary text-white px-4 py-2 rounded-lg hover:bg-primaryHover transition-all"
        >
          <UserPlus className="h-4 w-4" />
          <span>Add Faculty</span>
        </button>
      </div>

      {users.faculty.length === 0 ? (
        <div className="text-center py-12">
          <Users className="h-16 w-16 text-borderMuted mx-auto mb-4" />
          <h3 className="text-lg font-medium text-textPrimary mb-1">
            No Faculty Found
          </h3>
          <p className="text-textSecondary">
            Create faculty accounts to see them here.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-borderLight">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Faculty
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Domains
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Created
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-textSecondary uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-surface divide-y divide-borderLight">
              {users.faculty.map((faculty) => (
                <tr key={faculty.id} className="hover:bg-muted transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-textPrimary">
                        {faculty.name}
                      </div>
                      <div className="text-sm text-textSecondary">
                        {faculty.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textPrimary">
                    {Array.isArray(faculty.domains)
                      ? faculty.domains.join(", ")
                      : "No domain"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-textSecondary">
                    {faculty.created_at || (faculty as any).createdAt
                      ? new Date(
                          faculty.created_at || (faculty as any).createdAt
                        ).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium flex gap-3">
                    <button
                      onClick={() => {
                        setSelectedUser(faculty);
                        setShowPasswordModal(true);
                      }}
                      className="text-primary hover:text-primaryHover"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteUser(faculty.id, "faculty")}
                      className="text-error hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>

    {/* Create User Modal */}
    {showCreateForm && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-surface p-6 rounded-2xl shadow-medium w-full max-w-md mx-4">
          <h3 className="text-xl font-semibold text-textPrimary mb-4">
            Create New User
          </h3>

          <form onSubmit={handleCreateUser} className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                className="w-full px-3 py-2 border border-borderLight rounded-lg bg-muted focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, email: e.target.value }))
                }
                className="w-full px-3 py-2 border border-borderLight rounded-lg bg-muted focus:ring-2 focus:ring-primary focus:outline-none"
                required
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, password: e.target.value }))
                }
                className="w-full px-3 py-2 border border-borderLight rounded-lg bg-muted focus:ring-2 focus:ring-primary focus:outline-none"
                minLength={6}
                required
              />
            </div>

            {/* Role */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Role
              </label>
              <select
                value={formData.role}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    role: e.target.value as "student" | "faculty",
                  }))
                }
                className="w-full px-3 py-2 border border-borderLight rounded-lg bg-muted focus:ring-2 focus:ring-primary"
              >
                <option value="student">Student</option>
                <option value="faculty">Faculty</option>
              </select>
            </div>

            {/* Domains */}
            <div>
              <label className="block text-sm font-medium text-textPrimary mb-1">
                Domain(s){" "}
                {formData.role === "faculty" && (
                  <span className="text-textSecondary">(Multiple allowed)</span>
                )}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["BCA", "MCA", "PGDM"] as Domain[]).map((domain) => (
                  <button
                    key={domain}
                    type="button"
                    onClick={() => {
                      if (formData.role === "student") {
                        setFormData((prev) => ({ ...prev, domains: [domain] }));
                      } else {
                        handleDomainChange(domain);
                      }
                    }}
                    className={`p-2 rounded-lg border-2 text-sm transition-all ${
                      formData.domains.includes(domain)
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-borderLight hover:border-primaryHover"
                    }`}
                  >
                    {domain}
                  </button>
                ))}
              </div>
            </div>

            {/* Section (if student) */}
            {formData.role === "student" && (
              <div>
                <label className="block text-sm font-medium text-textPrimary mb-1">
                  Section
                </label>
                <select
                  value={formData.section}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      section: e.target.value as "A" | "B",
                    }))
                  }
                  className="w-full px-3 py-2 border border-borderLight rounded-lg bg-muted focus:ring-2 focus:ring-primary"
                >
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                </select>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4">
              <button
                type="button"
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-textSecondary hover:text-textPrimary transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primaryHover transition-colors"
              >
                Create User
              </button>
            </div>
          </form>
        </div>
      </div>
    )}
  </div>
);

}
