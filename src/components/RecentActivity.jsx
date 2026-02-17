import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Loader2, RefreshCcw, AlertCircle } from "lucide-react";
import apiClient from "../lib/api";

const RANGE_OPTIONS = {
  "7days": { label: "7 Hari Terakhir", days: 7 },
  "30days": { label: "30 Hari Terakhir", days: 30 },
  "90days": { label: "90 Hari Terakhir", days: 90 },
};

const COLORS = {
  assigned: "#6B7FE8",
  completed: "#16A34A",
};

const formatAdminAxisLabel = (value) => {
  if (!value) return "";
  const cleaned = value
    .toString()
    .replace(/^Admin\s+/i, "")
    .replace(/^Fakultas\s+/i, "Fak. ")
    .trim();

  const maxLen = 14;
  if (cleaned.length <= maxLen) return cleaned;
  return `${cleaned.slice(0, maxLen - 1)}…`;
};

const CustomXAxisTick = ({ x, y, payload }) => {
  const label = formatAdminAxisLabel(payload?.value);
  return (
    <g transform={`translate(${x},${y})`}>
      <text x={0} y={0} dy={18} textAnchor="end" fill="#6B7280" fontSize={11} transform="rotate(-45)">
        {label}
      </text>
    </g>
  );
};

const resolveAssignedUserName = (assignment) => {
  return (
    assignment?.assigned_to_user?.name ||
    assignment?.assignedToUser?.name ||
    assignment?.assigned_to_user_name ||
    "(Tanpa Nama)"
  );
};

const resolveAssignmentTimestamp = (assignment) => {
  return assignment?.assigned_at || assignment?.created_at || assignment?.updated_at || null;
};

const isCompletedReport = (assignment) => {
  const status = assignment?.report?.report_status || assignment?.report_status;
  return status === "Selesai";
};

export function RecentActivity() {
  const [timeRange, setTimeRange] = useState("7days");
  const currentRange = RANGE_OPTIONS[timeRange] ?? RANGE_OPTIONS["7days"];

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [assignments, setAssignments] = useState([]);
  const [admins, setAdmins] = useState([]);

  const fetchAllAssignments = async () => {
    setLoading(true);
    setError("");

    try {
      const pageSize = 50;
      let page = 1;
      let lastPage = 1;
      const items = [];

      while (page <= lastPage) {
        const response = await apiClient.get("/assignments", {
          params: { per_page: pageSize, page },
        });

        const payload = response.data;
        const pageItems = Array.isArray(payload?.data) ? payload.data : [];
        items.push(...pageItems);
        lastPage = Number(payload?.last_page || 1);
        page += 1;
        if (page > 50) {
          break;
        }
      }

      setAssignments(items);
    } catch (err) {
      setError("Gagal memuat data assignment untuk grafik admin");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllAdmins = async () => {
    try {
      const roles = ["super_admin", "admin_unit"];
      const all = [];

      for (const role of roles) {
        let page = 1;
        let lastPage = 1;

        while (page <= lastPage) {
          const response = await apiClient.get("/users", {
            params: { role, per_page: 50, page },
          });

          const payload = response.data?.data;
          const items = Array.isArray(payload?.data) ? payload.data : [];
          all.push(...items);
          lastPage = Number(payload?.last_page || 1);
          page += 1;
          if (page > 50) {
            break;
          }
        }
      }

      setAdmins(all);
    } catch {
      // Optional: chart still works without full admin roster
      setAdmins([]);
    }
  };

  useEffect(() => {
    fetchAllAssignments();
    fetchAllAdmins();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const chartData = useMemo(() => {
    const list = Array.isArray(assignments) ? assignments : [];
    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setDate(now.getDate() - (Math.max(1, currentRange.days) - 1));

    const filtered = list.filter((assignment) => {
      const ts = resolveAssignmentTimestamp(assignment);
      if (!ts) return false;
      const date = new Date(ts);
      return date >= fromDate && date <= now;
    });

    const buckets = new Map();

    const adminList = Array.isArray(admins) ? admins : [];
    adminList
      .filter(Boolean)
      .forEach((admin) => {
        const name = admin?.name || "(Tanpa Nama)";
        if (!buckets.has(name)) {
          buckets.set(name, { name, assigned: 0, completed: 0 });
        }
      });

    filtered.forEach((assignment) => {
      const name = resolveAssignedUserName(assignment);
      const entry = buckets.get(name) || { name, assigned: 0, completed: 0 };
      entry.assigned += 1;
      if (isCompletedReport(assignment)) {
        entry.completed += 1;
      }
      buckets.set(name, entry);
    });

    return Array.from(buckets.values()).sort((a, b) => {
      if (b.assigned !== a.assigned) return b.assigned - a.assigned;
      return (a.name || "").localeCompare(b.name || "", "id-ID");
    });
  }, [assignments, admins, currentRange.days]);

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || payload.length === 0) {
      return null;
    }
    const assignedValue = payload.find((p) => p.dataKey === "assigned")?.value ?? 0;
    const completedValue = payload.find((p) => p.dataKey === "completed")?.value ?? 0;

    return (
      <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-4">
        <p className="text-sm text-[#2D3748] mb-2">{label}</p>
        <p className="text-sm text-[#111827]">Total ditugaskan: <span className="font-semibold">{assignedValue}</span></p>
        <p className="text-sm text-[#111827] mt-1">Selesai: <span className="font-semibold">{completedValue}</span></p>
      </div>
    );
  };

  const chartIsEmpty = !loading && chartData.length === 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="inline-flex">
          <h2 className="text-foreground bg-white rounded-2xl px-4 py-2 shadow-sm">Persebaran & Penyelesaian Tiket</h2>
        </div>
        <div className="flex flex-wrap gap-3">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[170px] bg-white border-gray-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Rentang Waktu" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_OPTIONS).map(([key, option]) => (
                <SelectItem value={key} key={key}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button
            type="button"
            onClick={fetchAllAssignments}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#003D82] text-sm font-semibold border border-white/70 shadow-sm hover:border-[#003D82] hover:bg-[#F0F4FF] transition"
            aria-label="Segarkan data grafik admin"
          >
            <RefreshCcw size={16} /> Segarkan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {loading ? (
          <div className="h-[320px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#6366F1]" size={32} />
          </div>
        ) : error ? (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        ) : chartIsEmpty ? (
          <div className="h-[320px] flex items-center justify-center text-sm text-[#9CA3AF]">
            Belum ada data assignment pada rentang ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 10, right: 24, left: 8, bottom: 44 }} barCategoryGap={18}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
              <XAxis dataKey="name" stroke="#9CA3AF" interval={0} height={60} tick={<CustomXAxisTick />} />
              <YAxis stroke="#9CA3AF" tick={{ fill: "#6B7280" }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Bar name="Ditugaskan" dataKey="assigned" fill={COLORS.assigned} radius={[8, 8, 8, 8]} barSize={16} />
              <Bar name="Selesai" dataKey="completed" fill={COLORS.completed} radius={[8, 8, 8, 8]} barSize={16} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
