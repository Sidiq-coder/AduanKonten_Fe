import { useMemo } from "react";
import { AlertTriangle, Flame, ShieldCheck, Loader2 } from "lucide-react";
import { useReportStatistics, useTickets } from "../hooks/useTickets";
import { Badge } from "./ui/badge";

const PRIORITY_META = [
        { key: "urgent", label: "Urgent", description: "Perlu tindakan <24 jam", icon: Flame, accent: "text-red-600", gradient: "bg-gradient-to-br from-red-100 to-red-50" },
        { key: "high", label: "Prioritas Tinggi", description: "Segera tindak lanjuti", icon: AlertTriangle, accent: "text-orange-600", gradient: "bg-gradient-to-br from-orange-100 to-orange-50" },
        { key: "medium", label: "Prioritas Sedang", description: "Jadwalkan pemeriksaan", icon: ShieldCheck, accent: "text-amber-600", gradient: "bg-gradient-to-br from-amber-100 to-amber-50" },
        { key: "low", label: "Prioritas Rendah", description: "Pantau secara berkala", icon: ShieldCheck, accent: "text-emerald-600", gradient: "bg-gradient-to-br from-emerald-100 to-emerald-50" },
];

const PRIORITY_BADGES = {
        urgent: "border border-red-200 bg-red-50 text-red-700",
        high: "border border-orange-200 bg-orange-50 text-orange-700",
        medium: "border border-amber-200 bg-amber-50 text-amber-700",
        low: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_META = {
        Diterima: { label: "Diterima", className: "bg-blue-50 text-blue-700" },
        Diproses: { label: "Diproses", className: "bg-amber-50 text-amber-700" },
        Selesai: { label: "Selesai", className: "bg-emerald-50 text-emerald-700" },
        Ditolak: { label: "Ditolak", className: "bg-rose-50 text-rose-700" },
};

const formatDate = (value) => {
        if (!value) {
                return "-";
        }
        return new Intl.DateTimeFormat("id-ID", { dateStyle: "medium" }).format(new Date(value));
};

export function PriorityTickets() {
        const { stats, loading: statsLoading, error: statsError } = useReportStatistics({ range: 30 });
        const { tickets: urgentTickets, loading: urgentLoading, error: urgentError } = useTickets({ priority: 'urgent', per_page: 5 });
        const { tickets: highTickets, loading: highLoading, error: highError } = useTickets({ priority: 'high', per_page: 5 });

        const prioritySummary = useMemo(() => {
                return PRIORITY_META.map((priority) => {
                        const total = stats?.by_priority?.[priority.key] ?? 0;
                        const percent = stats?.total ? Math.round((total / stats.total) * 100) : 0;
                        return { ...priority, total, percent };
                });
        }, [stats]);

        const renderTicketCard = (ticket) => {
                const badgeClass = PRIORITY_BADGES[ticket.priority] ?? PRIORITY_BADGES.low;
                const statusMeta = STATUS_META[ticket.report_status] ?? STATUS_META.Diterima;
                const assignmentName = ticket.assignment?.assigned_to_user?.name || 'Belum ditugaskan';

                return (
                        <div key={ticket.id} className="border border-gray-100 rounded-xl p-4 hover:border-primary/40 transition">
                                <div className="flex items-start justify-between gap-3">
                                        <div>
                                                <p className="text-xs text-muted-foreground mb-1">{ticket.ticket_id}</p>
                                                <p className="text-sm text-foreground font-medium mb-2">{ticket.description?.slice(0, 80) || 'Tidak ada deskripsi'}</p>
                                        </div>
                                        <Badge className={badgeClass}>{ticket.priority || 'low'}</Badge>
                                </div>
                                <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground">
                                        <span className={`px-2 py-0.5 rounded-full ${statusMeta.className}`}>{statusMeta.label}</span>
                                        <span>•</span>
                                        <span>Assigned: <span className="text-foreground">{assignmentName}</span></span>
                                        <span>•</span>
                                        <span>Dibuat {formatDate(ticket.created_at)}</span>
                                </div>
                        </div>
                );
        };

        const loadingLists = urgentLoading || highLoading;

        return (<div className="space-y-6">
            <div>
                <h2 className="text-[#1F2937]">Tiket Prioritas</h2>
                <p className="text-sm text-muted-foreground">Sorotan prioritas berdasarkan data backend</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {statsLoading ? (
                    <div className="col-span-full flex items-center justify-center py-12 bg-white rounded-2xl border border-gray-100">
                        <Loader2 className="animate-spin text-primary" size={32} />
                    </div>
                ) : statsError ? (
                    <div className="col-span-full text-sm text-red-600 bg-red-50 border border-red-100 rounded-2xl p-4">
                        Gagal memuat statistik prioritas
                    </div>
                ) : prioritySummary.map((item) => (
                    <div key={item.key} className={`rounded-2xl p-6 ${item.gradient} border border-white/60 shadow-sm`}>
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm text-muted-foreground">{item.label}</p>
                                <p className="text-3xl text-foreground mt-1">{item.total}</p>
                            </div>
                            <span className={`text-sm font-medium ${item.accent}`}>{item.percent}%</span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-3">{item.description}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-foreground text-lg">Antrian Urgent</h3>
                        <span className="text-sm text-muted-foreground">{urgentTickets.length} tiket</span>
                    </div>
                    {urgentError ? (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">Gagal memuat tiket urgent</div>
                    ) : loadingLists ? (
                        <div className="h-[160px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={28} />
                        </div>
                    ) : urgentTickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Tidak ada tiket urgent saat ini</p>
                    ) : (
                        <div className="space-y-4">
                            {urgentTickets.map(renderTicketCard)}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-foreground text-lg">Prioritas Tinggi</h3>
                        <span className="text-sm text-muted-foreground">{highTickets.length} tiket</span>
                    </div>
                    {highError ? (
                        <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">Gagal memuat tiket prioritas tinggi</div>
                    ) : loadingLists ? (
                        <div className="h-[160px] flex items-center justify-center">
                            <Loader2 className="animate-spin text-primary" size={28} />
                        </div>
                    ) : highTickets.length === 0 ? (
                        <p className="text-sm text-muted-foreground">Tidak ada tiket prioritas tinggi</p>
                    ) : (
                        <div className="space-y-4">
                            {highTickets.map(renderTicketCard)}
                        </div>
                    )}
                </div>
            </div>
        </div>);
}
