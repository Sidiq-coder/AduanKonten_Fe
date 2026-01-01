import { useMemo, useState } from "react";
import { FileText, Clock, CheckCircle2, XCircle, TrendingUp, Loader2, Activity } from "lucide-react";
import { useReportStatistics } from "../hooks/useTickets";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";

const RANGE_OPTIONS = {
  "7days": { label: "7 Hari Terakhir", days: 7 },
  "30days": { label: "30 Hari Terakhir", days: 30 },
  "90days": { label: "3 Bulan Terakhir", days: 90 },
};

const PRIORITY_CONFIG = [
  { key: "urgent", label: "Urgent", bar: "bg-red-500" },
  { key: "high", label: "Tinggi", bar: "bg-orange-500" },
  { key: "medium", label: "Sedang", bar: "bg-amber-500" },
  { key: "low", label: "Rendah", bar: "bg-emerald-500" },
];

export function FakultasTicketOverview({ fakultasName }) {
  const [timeRange, setTimeRange] = useState("7days");
  const currentRange = RANGE_OPTIONS[timeRange] ?? RANGE_OPTIONS["7days"];
  const { stats, loading, error } = useReportStatistics({ range: currentRange.days });

  const priorityDistribution = useMemo(() => {
    return PRIORITY_CONFIG.map((priority) => {
      const count = stats?.by_priority?.[priority.key] ?? 0;
      const percent = stats?.total ? Math.round((count / stats.total) * 100) : 0;
      return { ...priority, count, percent };
    });
  }, [stats]);
    
    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
                Gagal memuat statistik tiket
            </div>
        );
    }
    
    const statItems = [
        {
            label: "Total Tiket",
            value: stats?.total || "0",
            description: `Tiket ${fakultasName}`,
            icon: FileText,
            bgColor: "bg-gradient-to-br from-[#BBDEFB] to-[#90CAF9]",
            iconColor: "text-[#003D82]",
        },
        {
            label: "Sedang Diproses",
            value: stats?.in_progress || "0",
            description: "Sedang ditangani",
            icon: Clock,
            bgColor: "bg-gradient-to-br from-[#FFE082] to-[#FFD54F]",
            iconColor: "text-[#F57C00]",
        },
        {
            label: "Selesai",
            value: stats?.resolved || "0",
            description: "Berhasil diselesaikan",
            icon: CheckCircle2,
            bgColor: "bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7]",
            iconColor: "text-[#388E3C]",
        },
        {
            label: "Ditolak",
            value: stats?.rejected || "0",
            description: "Tidak dapat diproses",
            icon: XCircle,
            bgColor: "bg-gradient-to-br from-[#FFCDD2] to-[#EF9A9A]",
            iconColor: "text-[#C62828]",
        },
    ];
    return (<div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-white text-2xl font-semibold">Ringkasan Tiket {fakultasName}</h2>
          <p className="text-sm text-white/80">Periode {currentRange.label.toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-card border border-border px-3 py-2 rounded-lg">
            <TrendingUp size={16} className="text-primary"/>
            <span>Update Otomatis</span>
          </div>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[200px] bg-card border-border rounded-lg h-10">
              <SelectValue placeholder="Pilih rentang" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RANGE_OPTIONS).map(([key, option]) => (
                <SelectItem key={key} value={key}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {statItems.map((stat) => (<div key={stat.label} className="bg-card rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-300 border border-border">
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-sm text-muted-foreground">{stat.label}</span>
                <div className="text-3xl text-foreground mt-2 mb-1.5">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.description}</div>
              </div>
              <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center shadow-sm flex-shrink-0`}>
                <stat.icon size={22} className={stat.iconColor} strokeWidth={2.5}/>
              </div>
            </div>
          </div>))}
      </div>

      <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
            <Activity size={18} />
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Distribusi Prioritas Tiket</p>
            <p className="text-base text-foreground font-medium">{stats?.total || 0} tiket aktif milik {fakultasName}</p>
          </div>
        </div>
        <div className="grid gap-3">
          {priorityDistribution.map((item) => (
            <div key={item.key} className="rounded-xl border border-gray-100 bg-gray-50/60 px-4 py-3">
              <div className="flex items-center justify-between text-sm font-medium text-foreground">
                <span>{item.label}</span>
                <span className="text-muted-foreground">{item.count} tiket · {item.percent}%</span>
              </div>
              <div className="mt-2 text-xs text-muted-foreground">
                Kontribusi prioritas terhadap tiket {fakultasName}
              </div>
              <div className="mt-3 h-3 rounded-full border border-gray-200 bg-white overflow-hidden">
                <div
                  className="h-full bg-gray-900 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.02)] transition-all duration-500"
                  style={{ width: `${item.percent > 0 ? Math.max(item.percent, 2) : 0}%` }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>);
}
