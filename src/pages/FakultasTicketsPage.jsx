import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Filter, Eye, Loader2, Download } from "lucide-react";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useTickets } from "../hooks/useTickets";
import { useCategories } from "../hooks/useMasterData";
import { toast } from "sonner@2.0.3";
import { useAuth } from "../contexts/AuthContext";
import apiClient from "../lib/api";
export function FakultasTicketsPage({ onViewTicket, fakultasName }) {
  const navigate = useNavigate();
  const { user } = useAuth();
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [isExportingExcel, setIsExportingExcel] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const facultyDisplayName = fakultasName || user?.unit?.name || user?.faculty?.name || "Fakultas";
    
    const statusApiMap = {
      submitted: "Diterima",
      in_progress: "Diproses",
      pending_validation: "Menunggu Validasi",
      resolved: "Selesai",
      rejected: "Ditolak",
    };
    
    // Prepare filters for API
    const filters = {
      search: searchQuery || undefined,
      status: statusFilter !== "all" ? statusApiMap[statusFilter] : undefined,
      category_id: categoryFilter !== "all" ? categoryFilter : undefined,
    };
    
    const { tickets, loading, error, pagination } = useTickets(filters);
    const { categories } = useCategories();
    
    useEffect(() => {
        if (error) {
            toast.error("Gagal memuat data tiket", {
                description: error
            });
        }
    }, [error]);

    const extractFilename = (contentDisposition, fallback) => {
      if (!contentDisposition || typeof contentDisposition !== "string") return fallback;
      const match = contentDisposition.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i);
      const value = decodeURIComponent(match?.[1] || match?.[2] || "");
      return value || fallback;
    };

    const buildExportParams = () => {
      const params = {};
      if (statusFilter !== "all") {
        params.status = statusApiMap[statusFilter];
      }
      if (categoryFilter !== "all") {
        params.category_id = categoryFilter;
      }
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
    const statusConfig = {
      submitted: { label: "Terkirim", color: "bg-[#BBDEFB] text-[#003D82] border-[#90CAF9]" },
      in_progress: { label: "Sedang Diproses", color: "bg-[#FFE082] text-[#F57C00] border-[#FFD54F]" },
      pending_validation: { label: "Menunggu Validasi", color: "bg-[#FFE082] text-[#F57C00] border-[#FFD54F]" },
      resolved: { label: "Selesai", color: "bg-[#C8E6C9] text-[#388E3C] border-[#A5D6A7]" },
      rejected: { label: "Ditolak", color: "bg-[#FFCDD2] text-[#C62828] border-[#EF9A9A]" },
    };
    const priorityConfig = {
        high: { label: "Tinggi", color: "bg-[#FFCDD2] text-[#C62828] border-[#EF9A9A]" },
        medium: { label: "Sedang", color: "bg-[#FFE082] text-[#F57C00] border-[#FFD54F]" },
        low: { label: "Rendah", color: "bg-[#E2E8F0] text-[#64748B] border-[#CBD5E1]" },
    };

    const mapActionStatusKey = (actionType) => {
      if (!actionType)
        return null;
      const normalized = actionType.toLowerCase();
      if (normalized === "selesai")
        return "resolved";
      if (normalized === "ditolak")
        return "rejected";
      if (["proses", "riview", "diproses"].includes(normalized))
        return "in_progress";
      return null;
    };

    const getFacultyStatusKey = (ticket) => {
      if (!Array.isArray(ticket.actions) || ticket.actions.length === 0)
        return null;
      const latestAction = ticket.actions[0];
      if (latestAction?.action_type === "Ditolak" && ticket?.report_status !== "Ditolak") {
        return null;
      }
      return mapActionStatusKey(latestAction?.action_type);
    };

    const getStatusBadgeProps = (ticket) => {
      const facultyStatusKey = getFacultyStatusKey(ticket);
      if (facultyStatusKey && statusConfig[facultyStatusKey]) {
        return statusConfig[facultyStatusKey];
      }
      let statusKey = ticket.status;
      if (ticket.report_status === 'Selesai') statusKey = 'resolved';
      else if (ticket.report_status === 'Ditolak') statusKey = 'rejected';
      else if (ticket.report_status === 'Menunggu Validasi') statusKey = 'pending_validation';
      else if (ticket.report_status === 'Diproses' || ticket.assignment) statusKey = 'in_progress';
      else statusKey = 'submitted';
      return statusConfig[statusKey] || statusConfig.submitted;
    };

    const getAssignmentTimestamp = (ticket) => {
      if (!ticket)
        return null;
      const assignment = Array.isArray(ticket.assignment) ? ticket.assignment[0] : ticket.assignment;
      return (
        assignment?.assigned_at ||
        assignment?.assignedAt ||
        assignment?.created_at ||
        assignment?.createdAt ||
        ticket.assigned_at ||
        ticket.assignedAt ||
        null
      );
    };

    const sortedTickets = useMemo(() => {
      const list = Array.isArray(tickets) ? [...tickets] : [];

      // Order by latest ticket change so any update bubbles to top.
      // Fallbacks keep behavior stable for older/partial payloads.
      return list.sort((a, b) => {
        const timeA = new Date(a?.updated_at || getAssignmentTimestamp(a) || a?.created_at || 0).getTime();
        const timeB = new Date(b?.updated_at || getAssignmentTimestamp(b) || b?.created_at || 0).getTime();
        return timeB - timeA;
      });
    }, [tickets]);

    return (<div>
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-white text-2xl font-semibold mb-2">Tiket {facultyDisplayName}</h1>
          <p className="text-white/80">Kelola semua tiket aduan konten dari {facultyDisplayName}</p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => handleExport("excel")}
            disabled={isExportingExcel || isExportingPdf}
            className="rounded-lg"
          >
            {isExportingExcel ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
            Export Excel
          </Button>
          <Button
            variant="outline"
            onClick={() => handleExport("pdf")}
            disabled={isExportingExcel || isExportingPdf}
            className="rounded-lg"
          >
            {isExportingPdf ? <Loader2 className="animate-spin mr-2" size={16} /> : <Download className="mr-2" size={16} />}
            Export PDF
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18}/>
            <Input placeholder="Cari tiket atau ID..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 bg-input-background border-border rounded-lg h-11"/>
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-input-background border-border rounded-lg h-11">
              <Filter size={16} className="mr-2"/>
              <SelectValue placeholder="Status"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Status</SelectItem>
              <SelectItem value="submitted">Terkirim</SelectItem>
              <SelectItem value="in_progress">Sedang Diproses</SelectItem>
              <SelectItem value="pending_validation">Menunggu Validasi</SelectItem>
              <SelectItem value="resolved">Selesai</SelectItem>
              <SelectItem value="rejected">Ditolak</SelectItem>
            </SelectContent>
          </Select>

          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="bg-input-background border-border rounded-lg h-11">
              <Filter size={16} className="mr-2"/>
              <SelectValue placeholder="Kategori"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {categories?.map((category) => (
                <SelectItem key={category.id} value={category.id.toString()}>{category.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Tickets Table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-4 px-6 text-sm text-foreground">ID Tiket</th>
                <th className="text-left py-4 px-6 text-sm text-foreground">Kategori</th>
                <th className="text-left py-4 px-6 text-sm text-foreground">Status</th>
                <th className="text-left py-4 px-6 text-sm text-foreground">Prioritas</th>
                <th className="text-left py-4 px-6 text-sm text-foreground">Tanggal Penugasan</th>
                <th className="text-left py-4 px-6 text-sm text-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2" size={32} />
                    <p className="text-muted-foreground">Memuat data...</p>
                  </td>
                </tr>
              ) : sortedTickets && sortedTickets.length > 0 ? (
                sortedTickets.map((ticket) => (<tr key={ticket.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="py-4 px-6">
                    <span className="text-sm text-foreground">{ticket.ticket_id}</span>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">{ticket.category?.name || '-'}</span>
                  </td>
                  <td className="py-4 px-6">
                    {(() => {
                          const badge = getStatusBadgeProps(ticket);
                          return (
                            <Badge className={`${badge.color} border`}>
                              {badge.label}
                            </Badge>
                          );
                      })()}
                  </td>
                  <td className="py-4 px-6">
                    <Badge className={`${priorityConfig[ticket.priority]?.color || priorityConfig.low.color} border`}>
                      {priorityConfig[ticket.priority]?.label || ticket.priority}
                    </Badge>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-muted-foreground">
                      {new Date(getAssignmentTimestamp(ticket) || ticket.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <Button onClick={() => {
                      if (onViewTicket) {
                        onViewTicket(ticket.id);
                      } else {
                        navigate(ticket.id.toString());
                      }
                    }} variant="outline" size="sm" className="rounded-lg border-primary text-primary hover:bg-primary hover:text-white">
                      <Eye size={16} className="mr-1"/>
                      Lihat
                    </Button>
                  </td>
                </tr>))
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-muted-foreground">Tidak ada tiket yang ditemukan</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Info */}
      {pagination && pagination.total > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Menampilkan {tickets?.length || 0} dari {pagination.total} tiket
          </p>
        </div>
      )}
    </div>);
}
