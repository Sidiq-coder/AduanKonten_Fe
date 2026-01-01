import { AlertTriangle, CheckCircle2, Clock, User, Loader2, Shield } from "lucide-react";
import { Badge } from "./ui/badge";
import { useTickets } from "../hooks/useTickets";

const PRIORITY_BADGES = {
    urgent: "border border-red-200 bg-red-50 text-red-700",
    high: "border border-orange-200 bg-orange-50 text-orange-700",
    medium: "border border-amber-200 bg-amber-50 text-amber-700",
    low: "border border-emerald-200 bg-emerald-50 text-emerald-700",
};

const STATUS_PROGRESS = {
    Diterima: 20,
    Diproses: 60,
    Selesai: 100,
    Ditolak: 100,
};

const priorityWeight = { urgent: 1, high: 2, medium: 3, low: 4 };

const getBadgeClass = (priority) => PRIORITY_BADGES[priority] ?? PRIORITY_BADGES.low;

export function FakultasPriorityTickets({ fakultasName }) {
    const { tickets, loading, error } = useTickets({ per_page: 50 });

    if (loading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 text-sm text-red-700">
                Gagal memuat data prioritas fakultas
            </div>
        );
    }

    const openTickets = (tickets ?? []).filter((ticket) => ticket.report_status !== 'Selesai' && ticket.report_status !== 'Ditolak');

    const sortedByPriority = (list) => {
        return [...list].sort((a, b) => (priorityWeight[a.priority] ?? 99) - (priorityWeight[b.priority] ?? 99));
    };

    const activeTickets = sortedByPriority(openTickets.filter((ticket) => Boolean(ticket.assignment))).slice(0, 3);
    const pendingTickets = sortedByPriority(openTickets.filter((ticket) => !ticket.assignment)).slice(0, 3);

    const renderProgress = (ticket) => {
        const progress = STATUS_PROGRESS[ticket.report_status] ?? 30;
        return (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="text-foreground">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gray-900 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
        );
    };

    return (<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#C8E6C9] to-[#A5D6A7] rounded-lg flex items-center justify-center shadow-sm">
            <CheckCircle2 size={20} className="text-[#388E3C]"/>
          </div>
          <div>
            <h2 className="text-white text-lg font-semibold">Tugas Aktif</h2>
            <p className="text-xs text-white/70">Tiket prioritas yang sudah ditugaskan</p>
          </div>
        </div>

        {activeTickets.length === 0 ? (
          <div className=" bg-card border border-dashed border-muted rounded-xl p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Shield size={16} />
            Belum ada tiket prioritas yang sedang Anda tangani
          </div>
        ) : (
          <div className="space-y-4">
            {activeTickets.map((ticket) => (
              <div key={ticket.id} className="bg-card rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{ticket.ticket_id}</span>
                      <Badge className={getBadgeClass(ticket.priority)}>
                        {ticket.priority || 'low'}
                      </Badge>
                    </div>
                    <h4 className="text-foreground mb-3">{ticket.description?.substring(0, 70) || 'Tidak ada deskripsi'}</h4>
                  </div>
                  <AlertTriangle size={20} className={ticket.priority === 'urgent' ? 'text-[#C62828]' : 'text-[#F57C00]'} />
                </div>

                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
                  <User size={14}/>
                  <span>{ticket.assignment?.assigned_to_user?.name || 'Belum diketahui'}</span>
                  <span className="mx-2">•</span>
                  <Clock size={14}/>
                  <span>Masuk {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(ticket.created_at))}</span>
                </div>

                {renderProgress(ticket)}
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gradient-to-br from-[#E2E8F0] to-[#CBD5E1] rounded-lg flex items-center justify-center shadow-sm">
            <Clock size={20} className="text-[#64748B]"/>
          </div>
          <div>
            <h2 className="text-white text-lg font-semibold">Menunggu Penugasan</h2>
            <p className="text-xs text-white/70">Tiket prioritas yang belum memiliki admin {fakultasName}</p>
          </div>
        </div>

        {pendingTickets.length === 0 ? (
          <div className=" bg-card border border-dashed border-muted rounded-xl p-6 text-sm text-muted-foreground flex items-center gap-2">
            <Shield size={16} />
            Semua tiket prioritas sudah ditangani
          </div>
        ) : (
          <div className="space-y-4">
            {pendingTickets.map((ticket) => (
              <div key={ticket.id} className="bg-card rounded-xl p-5 shadow-sm border border-border hover:shadow-md transition-shadow duration-300">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-muted-foreground">{ticket.ticket_id}</span>
                      <Badge className={getBadgeClass(ticket.priority)}>
                        {ticket.priority || 'low'}
                      </Badge>
                    </div>
                    <h4 className="text-foreground mb-2">{ticket.description?.substring(0, 70) || 'Tidak ada deskripsi'}</h4>
                    <p className="text-sm text-muted-foreground mb-2">Menunggu admin untuk ditugaskan</p>
                    <p className="text-xs text-muted-foreground">Masuk {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(new Date(ticket.created_at))}</p>
                  </div>
                </div>
              </div>
            ))}

            <div className="bg-gradient-to-br from-[#E3F2FD] to-[#BBDEFB] rounded-xl p-4 border border-[#90CAF9]/30">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/60 rounded-lg flex items-center justify-center">
                  <AlertTriangle size={18} className="text-primary"/>
                </div>
                <div className="flex-1">
                  <h4 className="text-foreground text-sm mb-1">Perhatian</h4>
                  <p className="text-xs text-muted-foreground">
                    {pendingTickets.length} tiket prioritas membutuhkan admin {fakultasName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>);
}
