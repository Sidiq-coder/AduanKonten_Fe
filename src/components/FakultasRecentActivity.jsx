import { useState, useMemo } from "react";
import { Activity, Filter, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { useReportStatistics } from "../hooks/useTickets";

const RANGE_OPTIONS = {
    "7days": { label: "7 Hari Terakhir", days: 7 },
    "30days": { label: "30 Hari Terakhir", days: 30 },
    "90days": { label: "3 Bulan Terakhir", days: 90 },
};

const STATUS_CONFIG = [
    { key: "submitted", label: "Terkirim", color: "#003D82" },
    { key: "in_progress", label: "Sedang Diproses", color: "#F57C00" },
    { key: "resolved", label: "Selesai", color: "#388E3C" },
    { key: "rejected", label: "Ditolak", color: "#C62828" },
];

const formatTimelineLabel = (isoDate, fallback, useFullDate) => {
    if (!isoDate) {
        return fallback ?? "-";
    }

    const parsedDate = new Date(`${isoDate}T00:00:00`);
    if (Number.isNaN(parsedDate.getTime())) {
        return fallback ?? isoDate;
    }

    const formatter = new Intl.DateTimeFormat("id-ID", useFullDate ? { day: "numeric", month: "short" } : { weekday: "short" });
    return formatter.format(parsedDate);
};

export function FakultasRecentActivity({ fakultasName }) {
    const [timeRange, setTimeRange] = useState("7days");
    const [statusFilter, setStatusFilter] = useState("all");

    const currentRange = RANGE_OPTIONS[timeRange] ?? RANGE_OPTIONS["7days"];
    const { stats, loading, error } = useReportStatistics({ range: currentRange.days });

    const chartData = useMemo(() => {
        if (!stats?.timeline) {
            return [];
        }

        return stats.timeline.map((entry) => ({
            date: formatTimelineLabel(entry.date, entry.label, currentRange.days > 7),
            submitted: entry.submitted ?? 0,
            in_progress: entry.in_progress ?? 0,
            resolved: entry.resolved ?? 0,
            rejected: entry.rejected ?? 0,
        }));
    }, [stats?.timeline, currentRange.days]);

    const activeStatuses = statusFilter === "all"
        ? STATUS_CONFIG
        : STATUS_CONFIG.filter((status) => status.key === statusFilter);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (<div className="bg-white border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm text-foreground mb-2">{label}</p>
          {payload.map((entry, index) => (<div key={index} className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }}></div>
              <span className="text-muted-foreground">{entry.name}:</span>
              <span className="text-foreground">{entry.value} tiket</span>
            </div>))}
        </div>);
        }
        return null;
    };

    const renderChart = () => (
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0"/>
            <XAxis dataKey="date" stroke="#64748B" style={{ fontSize: "12px" }}/>
            <YAxis stroke="#64748B" style={{ fontSize: "12px" }}/>
            <Tooltip content={<CustomTooltip />}/>
            <Legend wrapperStyle={{ fontSize: "14px" }} iconType="circle"/>
            {activeStatuses.map((status) => (<Line key={status.key} type="monotone" dataKey={status.key} stroke={status.color} strokeWidth={2.5} name={status.label} dot={{ fill: status.color, r: 4 }} activeDot={{ r: 6 }}/>))}
          </LineChart>
        </ResponsiveContainer>
    );

    return (<div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <Activity size={24} className="text-primary"/>
          <h2 className="text-foreground">Aktivitas Tiket {fakultasName}</h2>
        </div>
        
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-muted-foreground"/>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[170px] bg-card border-border rounded-lg h-10">
                <SelectValue placeholder="Semua Status"/>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Status</SelectItem>
                <SelectItem value="submitted">Terkirim</SelectItem>
                <SelectItem value="in_progress">Sedang Diproses</SelectItem>
                <SelectItem value="resolved">Selesai</SelectItem>
                <SelectItem value="rejected">Ditolak</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[170px] bg-card border-border rounded-lg h-10">
              <SelectValue placeholder="7 Hari Terakhir"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">7 Hari Terakhir</SelectItem>
              <SelectItem value="30days">30 Hari Terakhir</SelectItem>
              <SelectItem value="90days">3 Bulan Terakhir</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <div className="h-[350px]">
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <Loader2 className="animate-spin text-primary" size={32}/>
            </div>
          ) : error ? (
            <div className="h-full flex items-center justify-center text-sm text-red-600 bg-red-50 rounded-lg">
              Gagal memuat data grafik
            </div>
          ) : chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
              Belum ada aktivitas pada rentang waktu ini
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </div>);
}
