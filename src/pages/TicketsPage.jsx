import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, ChevronLeft, ChevronRight, Loader2, Download } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useTickets } from "../hooks/useTickets";
import { useFaculties } from "../hooks/useMasterData";
import { toast } from "sonner@2.0.3";
import apiClient from "../lib/api";

const statusConfig = {
    resolved: { label: "Selesai", color: "bg-[#D4F4E2] text-[#16A34A] border-[#A5E8C8]" },
    in_progress: { label: "Sedang Diproses", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]" },
  pending_validation: { label: "Menunggu Validasi", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]" },
    returned: { label: "Dikembalikan", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]" },
    submitted: { label: "Terkirim", color: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]" },
    rejected: { label: "Ditolak", color: "bg-[#FFCDD2] text-[#C62828] border-[#EF9A9A]" },
};
export function TicketsPage({ onViewTicket }) {
  const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [priorityFilter, setPriorityFilter] = useState("all");
    const [facultyFilter, setFacultyFilter] = useState("all");
    const [currentPage, setCurrentPage] = useState(1);
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    
    const filters = {
        search: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        assigned_unit_id: facultyFilter !== "all" && facultyFilter !== "unassigned" ? facultyFilter : undefined,
        assignment_state: facultyFilter === "unassigned" ? "unassigned" : undefined,
        page: currentPage,
        per_page: 10,
    };
    
    const { tickets, loading, error, pagination } = useTickets(filters);
    const { faculties } = useFaculties();

    const [ticketActionMeta, setTicketActionMeta] = useState({});
    
    useEffect(() => {
        if (error) {
            toast.error("Gagal memuat data tiket", {
                description: error
            });
        }
    }, [error]);

    useEffect(() => {
      let isCancelled = false;

      const loadActionsForVisibleTickets = async () => {
        const list = Array.isArray(tickets) ? tickets : [];
        const candidateTickets = list.filter((ticket) => {
          if (!ticket?.id) return false;
          if (ticket.report_status === "Selesai" || ticket.report_status === "Ditolak") return false;
          if (ticket.report_status === "Menunggu Validasi") return false;
          return !ticket.assignment;
        });

        if (candidateTickets.length === 0) {
          return;
        }

        try {
          const results = await Promise.all(
            candidateTickets.map(async (ticket) => {
              try {
                const response = await apiClient.get(`/reports/${ticket.id}/actions`);
                const actions = Array.isArray(response.data?.data) ? response.data.data : [];
                const latest = actions[0] || null;
                const latestReject = actions.find(
                  (action) => action?.action_type === "Ditolak" && typeof action?.notes === "string" && action.notes.trim().length > 0
                );
                return {
                  reportId: ticket.id,
                  latestActionType: latest?.action_type || "",
                  latestRejectNote: latestReject?.notes?.trim() || "",
                  latestRejectActorName: latestReject?.user?.name || latest?.user?.name || "",
                };
              } catch {
                return {
                  reportId: ticket.id,
                  latestActionType: "",
                  latestRejectNote: "",
                  latestRejectActorName: "",
                };
              }
            })
          );

          if (isCancelled) return;
          setTicketActionMeta((prev) => {
            const next = { ...prev };
            results.forEach((entry) => {
              if (!entry?.reportId) return;
              next[entry.reportId] = {
                latestActionType: entry.latestActionType,
                latestRejectNote: entry.latestRejectNote,
                latestRejectActorName: entry.latestRejectActorName,
              };
            });
            return next;
          });
        } catch {
          // ignore; list still renders without action meta
        }
      };

      loadActionsForVisibleTickets();
      return () => {
        isCancelled = true;
      };
    }, [tickets]);

    const extractFilename = (contentDisposition, fallback) => {
      if (!contentDisposition || typeof contentDisposition !== "string") return fallback;
      const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const value = decodeURIComponent(match?.[1] || match?.[2] || "");
      return value || fallback;
    };

    const buildExportParams = () => {
      const params = {};
      if (statusFilter !== "all") params.status = statusFilter;
      if (priorityFilter !== "all") params.priority = priorityFilter;
      return params;
    };

    const handleExport = async (format) => {
      const isExcel = format === "excel";
      const setIsExporting = isExcel ? setIsExportingExcel : setIsExportingPdf;
      const endpoint = isExcel ? "/reports/export/excel" : "/reports/export/pdf";
      const fallbackName = isExcel ? "laporan.xlsx" : "laporan.pdf";

      setIsExporting(true);
      try {
        const response = await apiClient.get(endpoint, {
          params: buildExportParams(),
          responseType: "blob",
          headers: {
            Accept: isExcel
              ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              : "application/pdf",
          },
        });

        const contentType = response.headers?.["content-type"] || (isExcel
          ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          : "application/pdf");
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        const disposition = response.headers?.["content-disposition"];
        const filename = extractFilename(disposition, fallbackName);

        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = filename;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        window.URL.revokeObjectURL(url);

        toast.success(`Export ${isExcel ? "Excel" : "PDF"} berhasil`, {
          description: "File sedang diunduh.",
        });
      } catch (err) {
        toast.error(`Gagal export ${isExcel ? "Excel" : "PDF"}`, {
          description: err?.response?.data?.message || err?.message || "Terjadi kesalahan saat export",
        });
      } finally {
        setIsExporting(false);
      }
    };

    return (<div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="white-card bg-white px-6 py-5 rounded-2xl shadow-sm space-y-1">
          <h1 className="text-foreground text-xl font-semibold">Daftar Tiket</h1>
          <p className="text-sm text-muted-foreground">Kelola dan pantau semua tiket pengaduan</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={isExportingExcel || isExportingPdf}
            className="rounded-xl border-gray-200 hover:bg-[#F8F9FE]"
          >
            {isExportingExcel ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={isExportingExcel || isExportingPdf}
            className="rounded-xl border-gray-200 hover:bg-[#F8F9FE]"
          >
            {isExportingPdf ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
        <div className="flex items-center gap-3 mb-5">
          <Filter size={20} className="text-[#6B7FE8]"/>
          <h3 className="text-[#2D3748]">Filter & Pencarian</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="lg:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]"/>
            <Input placeholder="Cari berdasarkan ID, nama, atau pekerjaan..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-11 bg-[#F9FAFB] border-gray-200 rounded-xl h-11 focus:bg-white transition-colors"/>
          </div>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white transition-colors">
              <SelectValue placeholder="Semua Status"/>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="Selesai">Selesai</SelectItem>
              <SelectItem value="Menunggu Validasi">Menunggu Validasi</SelectItem>
              <SelectItem value="Diproses">Sedang Diproses</SelectItem>
              <SelectItem value="Diterima">Terkirim</SelectItem>
              <SelectItem value="Ditolak">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          {/* Assignment target filter */}
          <Select value={facultyFilter} onValueChange={setFacultyFilter}>
            <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white transition-colors">
              <SelectValue placeholder="Ditugaskan ke"/>
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="all">Semua Penugasan</SelectItem>
              <SelectItem value="unassigned">Belum Ditugaskan</SelectItem>
              {faculties?.map((faculty) => (
                <SelectItem key={faculty.id} value={faculty.id.toString()}>{faculty.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Active Filters Summary */}
        {pagination && (pagination.total ?? tickets?.length ?? 0) > 0 && (
          <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm">
            <span className="text-[#6B7280]">Menampilkan:</span>
            <span className="text-[#6B7FE8]">{pagination.total ?? tickets?.length ?? 0} tiket ditemukan</span>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#F8F9FE] to-[#F3F4F6] border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">ID Tiket</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Nama</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Pekerjaan</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Ditugaskan</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Dibuat</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-[#6B7FE8]" size={32} />
                    <p className="text-[#6B7280]">Memuat data tiket...</p>
                  </td>
                </tr>
              ) : tickets && tickets.length > 0 ? (
                tickets.map((ticket) => (<tr key={ticket.id} className="hover:bg-[#F8F9FE] transition-colors">
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#6B7FE8]">{ticket.ticket_id}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#2D3748]">{ticket.reporter_name || ticket.name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#6B7280]">{ticket.reporter_type?.name || '-'}</span>
                  </td>
                  <td className="px-6 py-4">
                    {ticket.assignment ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#2563EB]">
                            {ticket.assignment.unit?.code ||
                              ticket.assignment.faculty?.code ||
                              ticket.assignment.assigned_to_user?.name?.slice(0, 2)?.toUpperCase() ||
                              "AD"}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-[#2D3748]">{ticket.assignment.assigned_to_user?.name || "Admin Unit"}</span>
                          <span className="text-xs text-[#9CA3AF]">{ticket.assignment.unit?.name || ticket.assignment.faculty?.name || "-"}</span>
                        </div>
                      </div>
                    ) : ticket.report_status === "Selesai" || ticket.report_status === "Ditolak" ? (
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#2563EB]">SA</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm text-[#2D3748]">Super Admin</span>
                          <span className="text-xs text-[#9CA3AF]">-</span>
                        </div>
                      </div>
                    ) : (
                      <span className="text-sm text-[#9CA3AF]">Belum Ditugaskan</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {(() => {
                      let statusKey = ticket.status || 'submitted';
                      if (ticket.report_status === 'Selesai') statusKey = 'resolved';
                      else if (ticket.report_status === 'Ditolak') statusKey = 'rejected';
                      else if (ticket.report_status === 'Menunggu Validasi') statusKey = 'pending_validation';
                      else if (ticket.report_status === 'Diproses' || ticket.assignment) statusKey = 'in_progress';
                      else if (ticket.report_status === 'Diterima') statusKey = 'submitted';

                      const actions = Array.isArray(ticket.actions) ? [...ticket.actions] : [];
                      actions.sort((a, b) => {
                        const timeA = a?.created_at ? new Date(a.created_at).getTime() : 0;
                        const timeB = b?.created_at ? new Date(b.created_at).getTime() : 0;
                        return timeB - timeA;
                      });
                      const listLatestRejectAction = actions.find(
                        (action) => action?.action_type === "Ditolak" && typeof action?.notes === "string" && action.notes.trim().length > 0
                      );

                      const fetchedMeta = ticketActionMeta?.[ticket.id];
                      const latestActionType = fetchedMeta?.latestActionType || actions[0]?.action_type || "";
                      const latestRejectNote = fetchedMeta?.latestRejectNote || listLatestRejectAction?.notes || "";
                      const latestRejectActorName =
                        fetchedMeta?.latestRejectActorName ||
                        listLatestRejectAction?.user?.name ||
                        actions[0]?.user?.name ||
                        "";

                      const isReturnedByAdmin =
                        !ticket.assignment &&
                        ticket.report_status !== "Ditolak" &&
                        ticket.report_status !== "Selesai" &&
                        ticket.report_status !== "Menunggu Validasi" &&
                        latestActionType === "Ditolak";
                      if (isReturnedByAdmin) {
                        statusKey = "returned";
                      }

                      const rejectReasonLabel =
                        ticket.report_status === "Ditolak"
                          ? (ticket.rejection_reason || latestRejectNote || "")
                          : (latestRejectNote || "");
                      const shouldShowRejectReason = typeof rejectReasonLabel === "string" && rejectReasonLabel.trim().length > 0;
                      
                      return (
                        <div>
                          <Badge className={`${statusConfig[statusKey]?.color || statusConfig.submitted.color} border px-3 py-1 text-xs rounded-lg`}>
                            {statusConfig[statusKey]?.label || ticket.report_status || 'Terkirim'}
                          </Badge>
                          {isReturnedByAdmin && latestRejectActorName && (
                            <p className="text-xs text-[#6B7280] mt-1 max-w-[260px] whitespace-normal break-words leading-snug">
                              Dikembalikan oleh: {latestRejectActorName}
                            </p>
                          )}
                          {shouldShowRejectReason && (
                            <p className="text-xs text-[#6B7280] mt-1 max-w-[260px] whitespace-normal break-words leading-snug">
                              Alasan: {rejectReasonLabel}
                            </p>
                          )}
                        </div>
                      );
                    })()}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-[#6B7280]">
                      {new Date(ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <Button variant="ghost" size="sm" onClick={() => {
                      if (onViewTicket) {
                        onViewTicket(ticket.id);
                      }
                      else {
                        navigate(ticket.id.toString());
                      }
                    }} className="text-[#6B7FE8] hover:text-[#5A6DD7] hover:bg-[#F8F9FE] rounded-lg">
                      <Eye size={16} className="mr-1.5"/>
                      Lihat
                    </Button>
                  </td>
                </tr>))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <p className="text-[#6B7280]">Tidak ada tiket yang ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.total > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-[#6B7280]">
              Menampilkan {((pagination.currentPage - 1) * pagination.perPage) + 1} - {Math.min(pagination.currentPage * pagination.perPage, pagination.total)} dari {pagination.total} hasil
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                disabled={pagination.currentPage === 1} 
                className="rounded-lg border-gray-200 hover:bg-[#F8F9FE] disabled:opacity-40"
              >
                <ChevronLeft size={16}/>
              </Button>
              
              {Array.from({ length: Math.min(5, pagination.lastPage) }, (_, i) => {
                let pageNum;
                if (pagination.lastPage <= 5) {
                  pageNum = i + 1;
                } else if (pagination.currentPage <= 3) {
                  pageNum = i + 1;
                } else if (pagination.currentPage >= pagination.lastPage - 2) {
                  pageNum = pagination.lastPage - 4 + i;
                } else {
                  pageNum = pagination.currentPage - 2 + i;
                }
                return (
                  <Button 
                    key={pageNum} 
                    variant={pagination.currentPage === pageNum ? "default" : "outline"} 
                    size="sm" 
                    onClick={() => setCurrentPage(pageNum)} 
                    className={`rounded-lg min-w-[36px] ${
                      pagination.currentPage === pageNum
                        ? "bg-[#6B7FE8] text-white hover:bg-[#5A6DD7]"
                        : "border-gray-200 hover:bg-[#F8F9FE]"
                    }`}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setCurrentPage(p => Math.min(pagination.lastPage, p + 1))} 
                disabled={pagination.currentPage === pagination.lastPage} 
                className="rounded-lg border-gray-200 hover:bg-[#F8F9FE] disabled:opacity-40"
              >
                <ChevronRight size={16}/>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>);
}
