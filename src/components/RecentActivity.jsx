import { useEffect, useMemo, useState } from "react";
import { AreaChart, Area, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { useAuditLogs, useAuditLogStatistics } from "../hooks/useAuditLogs";
import { Loader2, RefreshCcw, AlertCircle } from "lucide-react";

const RANGE_OPTIONS = {
    "7days": { label: "7 Hari Terakhir", days: 7 },
    "30days": { label: "30 Hari Terakhir", days: 30 },
    "90days": { label: "90 Hari Terakhir", days: 90 },
};

const CHART_COLORS = {
    total: "#6B7FE8",
    palette: ["#2563EB", "#F97316", "#22C55E", "#EF4444", "#A855F7", "#0EA5E9"],
};

const CHART_TYPES = [
    { value: "line", label: "Grafik Garis" },
    { value: "area", label: "Grafik Area" },
    { value: "bar", label: "Grafik Batang" },
];

const toDateInputValue = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const buildRangeParams = (days) => {
    const safeDays = Math.max(1, days);
    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - (safeDays - 1));

    return {
        date_from: toDateInputValue(start),
        date_to: toDateInputValue(now),
    };
};

const normalizeActionKey = (action) => {
    if (!action) {
        return "other";
    }
    return action
        .toString()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, '') || "other";
};

const getChartLabel = (date, useFullDate) => {
    const formatter = new Intl.DateTimeFormat("id-ID", useFullDate ? { day: "numeric", month: "short" } : { weekday: "short" });
    return formatter.format(date);
};

const buildChartSeries = (activities, rangeParams, rangeDays) => {
    if (!rangeParams) {
        return [];
    }

    const startDate = new Date(rangeParams.date_from);
    const endDate = new Date(rangeParams.date_to);
    const buckets = new Map();

    activities.forEach((activity) => {
        if (!activity?.created_at) {
            return;
        }
        const createdAt = new Date(activity.created_at);
        const isoDate = toDateInputValue(createdAt);
        const bucket = buckets.get(isoDate) || { total: 0, actions: {} };
        bucket.total += 1;
        const actionKey = normalizeActionKey(activity.action);
        bucket.actions[actionKey] = (bucket.actions[actionKey] || 0) + 1;
        buckets.set(isoDate, bucket);
    });

    const cursor = new Date(startDate);
    const results = [];
    const useFullDate = rangeDays > 14;

    while (cursor <= endDate) {
        const isoDate = toDateInputValue(cursor);
        const bucket = buckets.get(isoDate) || { total: 0, actions: {} };
        results.push({
            date: isoDate,
            name: getChartLabel(cursor, useFullDate),
            total: bucket.total,
            ...bucket.actions,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return results;
};

const formatFullTimestamp = (value) => {
  if (!value) {
    return "";
  }
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
};

export function RecentActivity() {
    const [chartType, setChartType] = useState("line");
    const [timeRange, setTimeRange] = useState("7days");
    const [actionFilter, setActionFilter] = useState("all");

    const currentRange = RANGE_OPTIONS[timeRange] ?? RANGE_OPTIONS["7days"];
    const [rangeParams, setRangeParams] = useState(() => buildRangeParams(currentRange.days));

    useEffect(() => {
      setRangeParams(buildRangeParams(currentRange.days));
    }, [currentRange.days]);

    const { statistics, loading: statsLoading, error: statsError, fetchStatistics } = useAuditLogStatistics(rangeParams);
    const { logs, loading: logsLoading, error: logsError, fetchLogs } = useAuditLogs(1, 5);

    const actionColorMap = useMemo(() => {
        const base = { total: CHART_COLORS.total };
        (statistics?.by_action ?? []).forEach((item, index) => {
            base[normalizeActionKey(item.action)] = CHART_COLORS.palette[index % CHART_COLORS.palette.length];
        });
        return base;
    }, [statistics?.by_action]);

    const actionOptions = useMemo(() => {
        const options = [{ value: "all", label: "Semua Aksi" }];
        (statistics?.by_action ?? []).forEach((item) => {
            options.push({ value: normalizeActionKey(item.action), label: `${item.action} (${item.count})` });
        });
        return options;
    }, [statistics?.by_action]);

    const chartData = useMemo(() => buildChartSeries(statistics?.recent_activities ?? [], rangeParams, currentRange.days), [statistics?.recent_activities, rangeParams, currentRange.days]);

    const dataKey = actionFilter === "all" ? "total" : actionFilter;
    const strokeColor = actionColorMap[dataKey] ?? CHART_COLORS.palette[0];
    const gradientId = `color-${dataKey}`;

    const CustomTooltip = ({ active, payload, label }) => {
        if (!active || !payload || payload.length === 0) {
            return null;
        }
        const entry = payload[0];
        return (<div className="bg-white border border-gray-100 rounded-xl shadow-lg p-4">
        <p className="text-sm text-[#2D3748] mb-2">{label}</p>
        <p className="text-xs text-gray-500">{entry.name}</p>
        <p className="text-lg font-semibold text-[#111827] mt-2">{entry.value} aktivitas</p>
      </div>);
    };

    const handleRefresh = () => {
      const nextRange = buildRangeParams(currentRange.days);
      setRangeParams(nextRange);
      fetchStatistics(nextRange);
      fetchLogs();
    };

    const chartIsEmpty = !statsLoading && chartData.length === 0;

    return (<div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="inline-flex">
          <h2 className="text-foreground bg-white rounded-2xl px-4 py-2 shadow-sm">Aktivitas Terkini</h2>
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

          <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[190px] bg-white border-gray-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Jenis Aksi" />
            </SelectTrigger>
            <SelectContent>
              {actionOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={chartType} onValueChange={setChartType}>
            <SelectTrigger className="w-[170px] bg-white border-gray-200 rounded-xl shadow-sm">
              <SelectValue placeholder="Tipe Grafik" />
            </SelectTrigger>
            <SelectContent>
              {CHART_TYPES.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  {type.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <button type="button" onClick={handleRefresh} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white text-[#003D82] text-sm font-semibold border border-white/70 shadow-sm hover:border-[#003D82] hover:bg-[#F0F4FF] transition" aria-label="Segarkan data aktivitas">
            <RefreshCcw size={16} /> Segarkan
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        {statsLoading ? (
          <div className="h-[320px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#6366F1]" size={32} />
          </div>
        ) : statsError ? (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span>Gagal memuat statistik aktivitas</span>
          </div>
        ) : chartIsEmpty ? (
          <div className="h-[320px] flex items-center justify-center text-sm text-[#9CA3AF]">
            Belum ada aktivitas pada rentang ini
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            {chartType === "area" ? (
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={strokeColor} stopOpacity={0.4} />
                    <stop offset="95%" stopColor={strokeColor} stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#6B7280' }} label={{ value: "Aktivitas", angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={2.5} fillOpacity={1} fill={`url(#${gradientId})`} />
              </AreaChart>
            ) : chartType === "bar" ? (
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#6B7280' }} label={{ value: "Aktivitas", angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey={dataKey} fill={strokeColor} radius={[10, 10, 0, 0]} />
              </BarChart>
            ) : (
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" tick={{ fill: '#6B7280' }} />
                <YAxis stroke="#9CA3AF" tick={{ fill: '#6B7280' }} label={{ value: "Aktivitas", angle: -90, position: 'insideLeft', fill: '#6B7280' }} />
                <Tooltip content={<CustomTooltip />} />
                <Line type="monotone" dataKey={dataKey} stroke={strokeColor} strokeWidth={3} dot={{ fill: strokeColor, r: 5 }} activeDot={{ r: 7 }} />
              </LineChart>
            )}
          </ResponsiveContainer>
        )}
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[#1F2937] text-lg">Log Terbaru</h3>
          <span className="text-sm text-[#6B7280]">Menampilkan {logs.length} aktivitas terakhir</span>
        </div>

        {logsLoading ? (
          <div className="h-[180px] flex items-center justify-center">
            <Loader2 className="animate-spin text-[#6366F1]" size={28} />
          </div>
        ) : logsError ? (
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle size={20} />
            <span>Gagal memuat log terbaru</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-[#9CA3AF]">Belum ada aktivitas yang tercatat</div>
        ) : (
          <div className="space-y-4">
            {logs.map((log) => (
              <div key={log.id} className="border border-gray-100 rounded-xl p-4 hover:border-[#6366F1]/40 transition">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-[#111827]">{log.action}</p>
                    <p className="text-xs text-[#6B7280]">{log.table_name || 'Tidak diketahui'} • #{log.record_id || '-'}</p>
                  </div>
                </div>
                <div className="mt-3 text-xs text-[#6B7280] flex flex-wrap gap-3">
                  <span>oleh <span className="text-[#111827] font-medium">{log.user?.name || 'Sistem'}</span></span>
                  <span className="hidden sm:inline">•</span>
                  <span>{formatFullTimestamp(log.created_at)}</span>
                  {log.ip_address ? (<>
                    <span className="hidden sm:inline">•</span>
                    <span>IP {log.ip_address}</span>
                  </>) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>);
}
