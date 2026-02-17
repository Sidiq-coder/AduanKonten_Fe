import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList, Filter, Search, Eye, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Input } from "../components/ui/input";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { useAssignments } from "../hooks/useAssignments";
import { useUsers } from "../hooks/useMasterData";
import { toast } from "sonner@2.0.3";

const statusStyles = {
  Selesai: "bg-[#D4F4E2] text-[#0F9D58] border-[#A5E8C8]",
  Diproses: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]",
  "Menunggu Validasi": "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]",
  Diterima: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]",
  Ditolak: "bg-[#FFCDD2] text-[#C62828] border-[#EF9A9A]",
};

export function AssignmentsPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const handler = setTimeout(() => setSearchQuery(searchInput.trim()), 400);
    return () => clearTimeout(handler);
  }, [searchInput]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, adminFilter]);

  const filters = useMemo(() => ({
    search: searchQuery || undefined,
    assigned_to: adminFilter !== "all" ? adminFilter : undefined,
    page: currentPage,
    per_page: 10,
  }), [searchQuery, adminFilter, currentPage]);

  const { assignments, loading, error, pagination } = useAssignments(filters);
  const { users: facultyAdmins } = useUsers("admin_unit");

  useEffect(() => {
    if (error) {
      toast.error("Gagal memuat data penugasan", {
        description: typeof error === "string" ? error : error?.message,
      });
    }
  }, [error]);

  const assignmentRows = Array.isArray(assignments) ? assignments : [];
  const totalItems = pagination?.total ?? assignmentRows.length;
  const startItem = totalItems === 0 ? 0 : (pagination?.currentPage - 1) * (pagination?.perPage ?? 10) + 1;
  const endItem = totalItems === 0 ? 0 : Math.min(pagination?.currentPage * (pagination?.perPage ?? 10), totalItems);

  const renderStatus = (status) => {
    const style = statusStyles[status] || statusStyles.Diterima;
    return (
      <Badge className={`${style} border px-3 py-1 text-xs rounded-lg`}>
        {status || "-"}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="white-card bg-white px-6 py-5 rounded-2xl shadow-sm space-y-1">
          <h1 className="text-foreground text-xl font-semibold">Daftar Penugasan</h1>
          <p className="text-sm text-muted-foreground">Pantau penugasan admin unit untuk setiap tiket</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100/50">
        <div className="flex items-center gap-3 mb-5">
          <Filter size={20} className="text-[#6B7FE8]" />
          <h3 className="text-[#2D3748]">Filter Penugasan</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#9CA3AF]" />
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Cari tiket, pelapor, atau email"
              className="pl-11 bg-[#F9FAFB] border-gray-200 rounded-xl h-11 focus:bg-white"
            />
          </div>

          <Select value={adminFilter} onValueChange={setAdminFilter}>
            <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white">
              <SelectValue placeholder="Admin Unit" />
            </SelectTrigger>
            <SelectContent className="rounded-xl max-h-60">
              <SelectItem value="all">Semua Admin</SelectItem>
              {facultyAdmins?.map((admin) => (
                <SelectItem key={admin.id} value={admin.id.toString()}>
                  {admin.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100 flex items-center gap-2 text-sm">
          <ClipboardList size={16} className="text-[#6B7FE8]" />
          <span className="text-[#6B7FE8] font-medium">{totalItems} penugasan</span>
          <span className="text-[#9CA3AF]">ditemukan</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-gradient-to-r from-[#F8F9FE] to-[#F3F4F6] border-b border-gray-200">
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Tiket</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Pelapor</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Admin</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Batas Waktu</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs text-[#6B7280] uppercase tracking-wider">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center">
                    <Loader2 className="animate-spin mx-auto mb-2 text-[#6B7FE8]" size={32} />
                    <p className="text-[#6B7280]">Memuat data penugasan...</p>
                  </td>
                </tr>
              ) : assignmentRows.length > 0 ? (
                assignmentRows.map((assignment) => {
                  const report = assignment.report || {};
                  return (
                    <tr key={assignment.id} className="hover:bg-[#F8F9FE] transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1F2937] font-medium">{report.ticket_id || "-"}</p>
                        <p className="text-xs text-[#9CA3AF]">{report.category?.name || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1F2937]">{report.reporter_name || report.name || "-"}</p>
                        <p className="text-xs text-[#6B7280]">{report.email || report.phone || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1F2937]">{assignment.assigned_to_user?.name || "-"}</p>
                        <p className="text-xs text-[#6B7280]">Ditugaskan oleh {assignment.assigned_by_user?.name || "-"}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-[#1F2937]">
                          {assignment.due_date
                            ? new Date(assignment.due_date).toLocaleDateString("id-ID", {
                                day: "2-digit",
                                month: "short",
                                year: "numeric",
                              })
                            : "Belum ditentukan"}
                        </p>
                      </td>
                      <td className="px-6 py-4">{renderStatus(report.report_status)}</td>
                      <td className="px-6 py-4">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-[#6B7FE8] hover:text-[#5A6DD7] hover:bg-[#F8F9FE] rounded-lg"
                          onClick={() => navigate(`/admin/tickets/${report.id || assignment.report_id}`)}
                        >
                          <Eye size={16} className="mr-1.5" />
                          Detail
                        </Button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center">
                    <p className="text-[#6B7280]">Belum ada penugasan yang cocok</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalItems > 0 && (
          <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between">
            <div className="text-sm text-[#6B7280]">
              Menampilkan {startItem}-{endItem} dari {totalItems} penugasan
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={pagination?.currentPage === 1}
                className="rounded-lg border-gray-200 hover:bg-[#F8F9FE] disabled:opacity-40"
              >
                <ChevronLeft size={16} />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.min(pagination?.lastPage || 1, prev + 1))}
                disabled={pagination?.currentPage === pagination?.lastPage}
                className="rounded-lg border-gray-200 hover:bg-[#F8F9FE] disabled:opacity-40"
              >
                <ChevronRight size={16} />
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
