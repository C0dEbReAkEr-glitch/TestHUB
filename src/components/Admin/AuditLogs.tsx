import { useState, useEffect } from "react";
import {
  FileText,
  User,
  Calendar,
  Filter,
  Loader2,
  ArrowDownCircle,
} from "lucide-react";

interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  details: string;
  ip_address: string;
  created_at: string;
}

export default function AuditLogs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadAuditLogs();
  }, []);

  const loadAuditLogs = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) return;
      const response = await fetch("http://localhost:3001/api/admin/audit-logs", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setLogs(await response.json());
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const filteredLogs = logs.filter(
    (log) =>
      log.action.toLowerCase().includes(filter.toLowerCase()) ||
      log.user_email.toLowerCase().includes(filter.toLowerCase()) ||
      log.details.toLowerCase().includes(filter.toLowerCase())
  );

  const getActionBadge = (action: string) => {
    const base =
      "px-2.5 py-1 rounded-full text-xs font-medium border transition-all";
    switch (action) {
      case "LOGIN":
        return `${base} bg-green-50 border-success/40 text-success`;
      case "REGISTER":
        return `${base} bg-blue-50 border-blue-400/40 text-blue-500`;
      case "ADMIN_PASSWORD_CHANGE":
        return `${base} bg-warning/10 border-warning/30 text-warning`;
      case "DELETE_USER":
        return `${base} bg-error/10 border-error/30 text-error`;
      default:
        return `${base} bg-muted border-borderMuted text-textSecondary`;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[70vh] text-textSecondary">
        <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
        <p className="text-sm">Fetching audit logs...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-3 sm:px-6 md:px-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-textPrimary tracking-tight">
            Audit Logs
          </h1>
          <p className="text-textSecondary text-sm mt-1">
            Every action. Tracked. Transparent.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative w-full sm:w-72">
            <Filter className="absolute left-3 top-2.5 h-4 w-4 text-textSecondary" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Search logs..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-muted border border-borderLight text-sm text-textPrimary placeholder-textSecondary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent shadow-soft transition-all"
            />
          </div>

          <button
            onClick={() => console.log("Export clicked")}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary text-white rounded-xl shadow-soft hover:bg-primaryHover transition-all text-sm"
          >
            <ArrowDownCircle className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-surface rounded-2xl border border-borderLight shadow-medium overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <FileText className="h-14 w-14 text-borderMuted mb-4" />
            <h3 className="text-lg font-medium text-textPrimary">
              No logs found
            </h3>
            <p className="text-textSecondary text-sm">
              Try adjusting your search or check again later.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm text-textSecondary">
              <thead className="bg-muted/50 text-xs uppercase text-textPrimary font-extrabold tracking-wider">
                <tr>
                  <th className="px-6 py-3 text-left font-medium">Timestamp</th>
                  <th className="px-6 py-3 text-left font-medium">User</th>
                  <th className="px-6 py-3 text-left font-medium">Action</th>
                  <th className="px-6 py-3 text-left font-medium">Details</th>
                  <th className="px-6 py-3 text-left font-medium">IP Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-borderLight">
                {filteredLogs.map((log, index) => (
                  <tr
                    key={log.id}
                    className={`transition-all duration-150 hover:bg-muted/70 ${
                      index % 2 === 0 ? "bg-white" : "bg-muted"
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-textPrimary">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-secondary" />
                        <span>
                          {new Date(log.created_at).toLocaleString(undefined, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-primary" />
                        <span className="font-medium text-textPrimary">
                          {log.user_email}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={getActionBadge(log.action)}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-textSecondary max-w-xs truncate">
                      {log.details || "—"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-textSecondary">
                      {log.ip_address || "N/A"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
