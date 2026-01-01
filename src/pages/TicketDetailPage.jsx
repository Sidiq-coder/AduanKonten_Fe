import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar,
  User,
  Mail,
  Link2,
  FileText,
  AlertCircle,
  Clock,
  CheckCircle2,
  Loader2,
  Send,
  ListChecks,
} from "lucide-react";
import { Button } from "../components/ui/button";
import { ConfirmModal } from "../components/ui/ConfirmModal";
import { apiClient } from "../lib/api";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";
import { toast } from "sonner@2.0.3";
import { useTicket } from "../hooks/useTickets";
import { useAssignments } from "../hooks/useAssignments";
import { useReportActions } from "../hooks/useReportActions";
import { useUsers } from "../hooks/useMasterData";
import { useAuth } from "../contexts/AuthContext";

const statusConfig = {
  resolved: { label: "Selesai", color: "bg-[#D4F4E2] text-[#16A34A] border-[#A5E8C8]" },
  in_progress: { label: "Sedang Diproses", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]" },
  submitted: { label: "Terkirim", color: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]" },
  rejected: { label: "Ditolak", color: "bg-[#FFCDD2] text-[#C62828] border-[#EF9A9A]" },
};

const priorityOptions = [
  { value: "urgent", label: "Urgent - perlu tindakan <24 jam" },
  { value: "high", label: "Tinggi" },
  { value: "medium", label: "Sedang" },
  { value: "low", label: "Rendah" },
];

export function TicketDetailPage({ ticketId, onBack }) {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const currentRole = user?.role;
  const canManageAssignments = currentRole === "super_admin" || currentRole === "admin";
  const isFacultyRole = currentRole === "admin_fakultas" || currentRole === "fakultas";
  const isSuperAdmin = currentRole === "super_admin";

  const resolvedTicketId = ticketId ?? params?.id ?? null;
  const normalizedTicketId = resolvedTicketId ? resolvedTicketId.toString() : null;

  const { ticket, loading, error, fetchTicket } = useTicket(normalizedTicketId);
  const assignmentFilters = useMemo(() => {
    if (!normalizedTicketId) {
      return {};
    }
    return { report_id: normalizedTicketId, per_page: 50 };
  }, [normalizedTicketId]);
  const { assignments, createAssignment, updateAssignment, fetchAssignments } = useAssignments(assignmentFilters, {
    skipInitialFetch: !normalizedTicketId,
  });
  const { actions: reportActions, createAction, fetchActions } = useReportActions(normalizedTicketId);
  const { users } = useUsers();

  const adminUsers = Array.isArray(users) ? users : [];
  const assignmentList = Array.isArray(assignments) ? assignments : [];
  const primaryAssignment = assignmentList.length > 0 ? assignmentList[0] : null;

  const [selectedAdmin, setSelectedAdmin] = useState("");
  const [selectedPriority, setSelectedPriority] = useState("medium");
  const [assignmentNotes, setAssignmentNotes] = useState("");
  const [assignmentDueDate, setAssignmentDueDate] = useState("");
  const [isAssigning, setIsAssigning] = useState(false);
  const [responseStatus, setResponseStatus] = useState("");
  const [responseNotes, setResponseNotes] = useState("");
  const [isSubmittingResponse, setIsSubmittingResponse] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    if (!primaryAssignment) {
      setSelectedAdmin("");
      return;
    }
    const assignedId = primaryAssignment.assigned_to || primaryAssignment.user_id || primaryAssignment.assigned_to_user?.id;
    if (assignedId) {
      setSelectedAdmin(assignedId.toString());
    }
  }, [primaryAssignment]);

  useEffect(() => {
    if (!primaryAssignment) {
      setAssignmentNotes("");
      setAssignmentDueDate("");
      return;
    }
    setAssignmentNotes(primaryAssignment.notes || "");
    setAssignmentDueDate(primaryAssignment.due_date ? primaryAssignment.due_date.slice(0, 10) : "");
  }, [primaryAssignment]);

  useEffect(() => {
    if (ticket) {
      setSelectedPriority(ticket.priority || "medium");
    }
  }, [ticket?.priority, ticket]);

  const handleBackNavigation = () => {
    if (typeof onBack === "function") {
      onBack();
      return;
    }
    if (location.state?.from) {
      navigate(location.state.from);
      return;
    }
    if (canManageAssignments) {
      navigate("/admin/tickets");
      return;
    }
    if (isFacultyRole) {
      navigate("/fakultas/tickets");
      return;
    }
    navigate(-1);
  };

  const handleSubmitResponse = async () => {
    if (!responseStatus) {
      toast.error("Pilih status terlebih dahulu");
      return;
    }
    if (!responseNotes.trim()) {
      toast.error("Keterangan wajib diisi");
      return;
    }

    setIsSubmittingResponse(true);
    try {
      await createAction({
        report_id: normalizedTicketId,
        action_type: responseStatus,
        notes: responseNotes,
      });

      toast.success("Respon berhasil dikirim", {
        description: `Tiket telah ditandai sebagai ${responseStatus === "Selesai" ? "selesai" : "ditolak dan dikembalikan ke super admin"}`,
        icon: <CheckCircle2 size={20} className="text-[#16A34A]" />,
      });

      setResponseStatus("");
      setResponseNotes("");
      await Promise.all([fetchActions(), fetchTicket(), fetchAssignments()]);
    } catch (err) {
      console.error("Response submission error:", err);
      toast.error("Gagal mengirim respon", {
        description: err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat()[0]
          : err.response?.data?.message || "Silakan coba lagi",
      });
    } finally {
      setIsSubmittingResponse(false);
    }
  };

  const handleAssign = async () => {
    if (!normalizedTicketId) {
      toast.error("Tiket tidak valid", {
        description: "ID tiket tidak ditemukan, muat ulang halaman dan coba lagi",
      });
      return;
    }
    if (!selectedAdmin) {
      toast.error("Pilih admin terlebih dahulu");
      return;
    }

    const targetAdmin = adminUsers.find((admin) => admin.id?.toString() === selectedAdmin);
    if (!targetAdmin) {
      toast.error("Admin tidak ditemukan");
      return;
    }

    const facultyId = targetAdmin.faculty_id || targetAdmin.faculty?.id;
    if (!facultyId) {
      toast.error("Admin belum memiliki data fakultas", {
        description: "Pastikan admin terkait terhubung ke fakultas",
      });
      return;
    }

    const currentAssignment = primaryAssignment;
    const isReassignment = Boolean(currentAssignment);
    const previousPriority = ticket?.priority || "medium";
    const trimmedNotes = assignmentNotes.trim();

    setIsAssigning(true);
    try {
      if (isReassignment) {
        await updateAssignment(currentAssignment.id, {
          assigned_to: targetAdmin.id,
          faculty_id: facultyId,
          notes: trimmedNotes || undefined,
          due_date: assignmentDueDate || undefined,
        });
      } else {
        await createAssignment({
          report_id: normalizedTicketId,
          assigned_to: targetAdmin.id,
          faculty_id: facultyId,
          notes: trimmedNotes || undefined,
          due_date: assignmentDueDate || undefined,
        });
      }

      if (isSuperAdmin && selectedPriority && selectedPriority !== previousPriority) {
        await apiClient.put(`/reports/${normalizedTicketId}`, { priority: selectedPriority });
      }

      toast.success(isReassignment ? "Penugasan diperbarui" : "Admin berhasil ditugaskan!", {
        description: isReassignment ? "Tiket berhasil dialihkan" : "Tiket telah ditugaskan",
        icon: <CheckCircle2 size={20} className="text-[#16A34A]" />,
      });

      setSelectedAdmin(targetAdmin.id.toString());
      await Promise.all([fetchAssignments(), fetchTicket()]);
    } catch (assignError) {
      console.error("Assignment error:", assignError);
      toast.error("Gagal menugaskan admin", {
        description: assignError.response?.data?.errors
          ? Object.values(assignError.response.data.errors).flat()[0]
          : assignError.response?.data?.message || "Silakan coba lagi",
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <Loader2 className="animate-spin mx-auto mb-4 text-[#6B7FE8]" size={48} />
          <p className="text-[#6B7280]">Memuat detail tiket...</p>
        </div>
      </div>
    );
  }

  if (error) {
    const errorMessage = typeof error === "string" ? error : error?.message;
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={48} className="text-[#DC2626] mx-auto mb-4" />
          <h3 className="text-[#B91C1C] mb-2">Gagal memuat tiket</h3>
          <p className="text-sm text-[#6B7280] mb-4">{errorMessage || "Silakan coba lagi"}</p>
          <Button onClick={handleBackNavigation} variant="outline" className="rounded-xl">
            Kembali ke daftar tiket
          </Button>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle size={48} className="text-[#9CA3AF] mx-auto mb-4" />
          <h3 className="text-[#2D3748] mb-2">Tiket tidak ditemukan</h3>
          <p className="text-sm text-[#6B7280] mb-4">Tiket dengan ID tersebut tidak ditemukan</p>
          <Button onClick={handleBackNavigation} variant="outline" className="rounded-xl">
            Kembali ke daftar tiket
          </Button>
        </div>
      </div>
    );
  }

  const badgeKey = statusConfig[ticket.status]
    ? ticket.status
    : ticket.report_status === "Selesai"
    ? "resolved"
    : ticket.report_status === "Ditolak" && canManageAssignments && assignmentList.length === 0
    ? "rejected"
    : ticket.report_status === "Diproses" || assignmentList.length > 0
    ? "in_progress"
    : "submitted";

  const displayStatus = isFacultyRole && ticket.report_status === "Ditolak" && assignmentList.length === 0
    ? "Ditolak"
    : statusConfig[badgeKey]?.label || ticket.report_status || "Terkirim";

  const postedAt = ticket.created_at
    ? new Date(ticket.created_at).toLocaleString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";
  const reporterName = ticket.reporter_name || ticket.name || "-";
  const reporterPhone = ticket.phone || ticket.reporter_contact || "";
  const reporterEmail = ticket.email || ticket.reporter_email || "";
  const reporterContact = reporterPhone || reporterEmail || "-";
  const reporterTypeLabel = ticket.reporter_type?.name || "-";
  const ticketLink = ticket.link_site || "-";
  const ticketNote = ticket.description || "-";
  const attachmentsList = Array.isArray(ticket.attachments) ? ticket.attachments : [];
  const latestAssignmentDate = primaryAssignment
    ? primaryAssignment.assigned_at || primaryAssignment.created_at || primaryAssignment.updated_at
    : null;
  const assignedAdminName = primaryAssignment?.assigned_to_user?.name || "";
  const assignedFacultyName = primaryAssignment?.assigned_to_user?.faculty?.name || primaryAssignment?.faculty?.name || "";
  const isTicketRejected = isFacultyRole && ticket.report_status === "Ditolak" && assignmentList.length === 0;
  const isFinalRejected = ticket.report_status === "Ditolak" && canManageAssignments && assignmentList.length === 0;
  const isTicketCompleted = ticket.report_status === "Selesai";
  const shouldShowAssignmentForm = canManageAssignments && !isFinalRejected && !isTicketCompleted;

  const timelineEvents = [];
  if (ticket.created_at) {
    timelineEvents.push({
      id: "ticket-created",
      label: "Tiket dibuat",
      description: ticket.category?.name ? `Kategori ${ticket.category.name}` : undefined,
      timestamp: ticket.created_at,
      actor: reporterName && reporterName !== "-" ? reporterName : undefined,
      tone: "neutral",
    });
  }

  assignmentList
    .filter(Boolean)
    .forEach((assignment, idx) => {
      const timestamp = assignment.assigned_at || assignment.created_at || assignment.updated_at;
      if (!timestamp)
        return;
      const assignee = assignment.assigned_to_user?.name || "Admin Fakultas";
      const facultyName = assignment.assigned_to_user?.faculty?.name || assignment.faculty?.name;
      timelineEvents.push({
        id: `assignment-${assignment.id || idx}`,
        label: "Penugasan Admin",
        description: facultyName ? `${assignee} · ${facultyName}` : `Ditugaskan ke ${assignee}`,
        timestamp,
        actor: assignment.assigned_by?.name,
        tone: "info",
      });
    });

  reportActions
    ?.filter(Boolean)
    .forEach((action, idx) => {
      const timestamp = action.created_at;
      if (!timestamp)
        return;
      const tone = action.action_type === "Selesai"
        ? "success"
        : action.action_type === "Ditolak"
        ? "danger"
        : "warning";
      timelineEvents.push({
        id: `action-${action.id || idx}`,
        label: action.action_type || "Aktivitas",
        description: action.notes,
        timestamp,
        actor: action.user?.name,
        tone,
      });
    });

  const hasRejectAction = timelineEvents.some((event) => event.tone === "danger");
  if (ticket.report_status === "Ditolak" && !hasRejectAction) {
    timelineEvents.push({
      id: "status-rejected",
      label: "Status diperbarui menjadi Ditolak",
      description: "Tiket ditolak oleh Super Admin",
      timestamp: ticket.updated_at || ticket.created_at,
      tone: "danger",
    });
  }

  const orderedTimeline = [...timelineEvents].sort((a, b) => {
    const timeA = a.timestamp ? new Date(a.timestamp).getTime() : 0;
    const timeB = b.timestamp ? new Date(b.timestamp).getTime() : 0;
    return timeA - timeB;
  });
  const orderedActions = Array.isArray(reportActions)
    ? [...reportActions].sort((a, b) => {
        const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return timeB - timeA;
      })
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            onClick={handleBackNavigation}
            variant="outline"
            size="sm"
            className="rounded-xl border-gray-200 hover:bg-[#F8F9FE]"
          >
            <ArrowLeft size={16} className="mr-2" />
            Kembali
          </Button>
          <div>
            <h1 className="text-white mb-1">Detail Tiket</h1>
            <p className="text-sm text-white/80">Tiket ID: {ticket.ticket_id}</p>
          </div>
        </div>
        <Badge className={`${statusConfig[badgeKey]?.color || statusConfig.submitted.color} border px-4 py-2 rounded-xl`}>
          {displayStatus}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-6 pb-5 border-b border-gray-100">
              <div className="w-10 h-10 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-[#2563EB]" />
              </div>
              <h3 className="text-[#2D3748]">Informasi Tiket</h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <FileText size={16} />
                  Nomor Tiket
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl">{ticket.ticket_id}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <Calendar size={16} />
                  Tanggal Dibuat
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl">
                  {ticket.created_at
                    ? new Date(ticket.created_at).toLocaleString("id-ID", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "-"}
                </p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <User size={16} />
                  Tipe Pelapor
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl">{reporterTypeLabel}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <User size={16} />
                  Nama Pelapor
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl">{reporterName}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <AlertCircle size={16} />
                  Kategori
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl">{ticket.category?.name || "-"}</p>
              </div>

              <div className="space-y-2">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <Mail size={16} />
                  Kontak Pelapor
                </Label>
                <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl break-all">{reporterContact}</p>
              </div>
            </div>

            {ticket.link_site && (
              <div className="space-y-2 mt-6 pt-6 border-t border-gray-100">
                <Label className="text-[#6B7280] text-sm flex items-center gap-2">
                  <Link2 size={16} />
                  Link Situs
                </Label>
                <a
                  href={ticket.link_site}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[#6B7FE8] hover:text-[#5A6DD7] bg-[#F9FAFB] hover:bg-[#F8F9FE] px-4 py-3 rounded-xl transition-colors break-all"
                >
                  {ticket.link_site}
                </a>
              </div>
            )}

            <div className="space-y-2 mt-6">
              <Label className="text-[#6B7280] text-sm">Deskripsi</Label>
              <p className="text-[#2D3748] bg-[#F9FAFB] px-4 py-3 rounded-xl min-h-[80px]">
                {ticket.description || "Tidak ada deskripsi"}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#FFE8D9] to-[#FFD4A5] rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-[#EA580C]" />
              </div>
              <h3 className="text-[#2D3748]">Lampiran</h3>
            </div>

            {attachmentsList.length > 0 ? (
              <div className="space-y-3">
                {attachmentsList.map((attachment, index) => (
                  <div key={`${attachment.file_path}-${index}`} className="bg-[#F9FAFB] rounded-xl p-4 border border-gray-200">
                    {attachment.file_type?.startsWith("image/") ? (
                      <img
                        src={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/storage/${attachment.file_path}`}
                        alt={`Lampiran ${index + 1}`}
                        className="w-full max-w-xs rounded-lg shadow-sm"
                      />
                    ) : (
                      <a
                        href={`${import.meta.env.VITE_API_URL || "http://localhost:8000"}/storage/${attachment.file_path}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-[#6B7FE8] hover:text-[#5A6DD7]"
                      >
                        <FileText size={20} />
                        <span>{attachment.file_name || `File ${index + 1}`}</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F9FAFB] rounded-xl p-8 text-center border border-dashed border-gray-300">
                <FileText size={32} className="text-[#9CA3AF] mx-auto mb-2" />
                <p className="text-sm text-[#6B7280]">Tidak ada lampiran</p>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          {isFacultyRole && assignmentList.length > 0 && ticket.report_status !== "Selesai" && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#D4F4E2] to-[#A5E8C8] rounded-xl flex items-center justify-center">
                  <Send size={20} className="text-[#16A34A]" />
                </div>
                <h3 className="text-[#2D3748]">Kirim Respon ke Super Admin</h3>
              </div>

              <div className="space-y-4">
                <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-3 text-sm text-[#15803D]">
                  Setelah menyelesaikan tiket ini, silakan pilih status dan berikan keterangan hasil penanganan.
                </div>

                <div className="space-y-2">
                  <Label className="text-[#6B7280] text-sm">Status Penyelesaian</Label>
                  <Select value={responseStatus} onValueChange={setResponseStatus}>
                    <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white transition-colors">
                      <SelectValue placeholder="Pilih status..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Selesai">Selesai</SelectItem>
                      <SelectItem value="Ditolak">Ditolak</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-[#6B7280] text-sm">Keterangan</Label>
                  <Textarea
                    value={responseNotes}
                    onChange={(e) => setResponseNotes(e.target.value)}
                    placeholder="Jelaskan hasil penanganan atau alasan penolakan..."
                    className="bg-[#F9FAFB] border-gray-200 rounded-xl min-h-[100px] resize-y"
                  />
                </div>

                <Button
                  onClick={handleSubmitResponse}
                  disabled={!responseStatus || !responseNotes.trim() || isSubmittingResponse}
                  className="w-full bg-[#003D82] hover:bg-[#002B60] text-white rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmittingResponse ? "Mengirim..." : "Kirim Respon"}
                </Button>
              </div>
            </div>
          )}

          {shouldShowAssignmentForm && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
              <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-100">
                <div className="w-10 h-10 bg-gradient-to-br from-[#E0E7FF] to-[#C7D2FE] rounded-xl flex items-center justify-center">
                  <User size={20} className="text-[#4F46E5]" />
                </div>
                <h3 className="text-[#2D3748]">{primaryAssignment ? "Perbarui Penugasan" : "Tugaskan Admin"}</h3>
              </div>

              <div className="space-y-4">
                {primaryAssignment && (
                  <div className="bg-[#EEF2FF] border border-[#C7D2FE] rounded-xl p-3 text-xs text-[#4F46E5]">
                    Tiket saat ini ditangani oleh {assignedAdminName || "admin fakultas"}. Anda dapat mengalihkan admin atau
                    memperbarui catatan dan batas waktu di bawah ini.
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#6B7280] text-sm">Pilih Admin</Label>
                  <Select value={selectedAdmin || undefined} onValueChange={setSelectedAdmin}>
                    <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white transition-colors">
                      <SelectValue placeholder="Pilih admin..." />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl max-h-60">
                      {adminUsers
                        .filter((admin) => (admin.role === "admin_fakultas" || admin.role === "super_admin") && admin.id)
                        .map((admin) => (
                          <SelectItem key={admin.id} value={admin.id.toString()}>
                            {admin.name} ({admin.faculty?.name || "Super Admin"})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                {isSuperAdmin && (
                  <div className="space-y-2">
                    <Label className="text-[#6B7280] text-sm">Prioritas Tiket (opsional)</Label>
                    <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                      <SelectTrigger className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11 hover:bg-white transition-colors">
                        <SelectValue placeholder="Pilih prioritas..." />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        {priorityOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-[#9CA3AF]">
                      Bila tidak diubah, prioritas mengikuti nilai "{ticket?.priority || "medium"}".
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-[#6B7280] text-sm">Catatan (opsional)</Label>
                  <Textarea
                    value={assignmentNotes}
                    onChange={(e) => setAssignmentNotes(e.target.value)}
                    placeholder="Berikan konteks atau instruksi tambahan untuk admin fakultas"
                    className="bg-[#F9FAFB] border-gray-200 rounded-xl min-h-[90px] resize-y"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-[#6B7280] text-sm">Batas Waktu (opsional)</Label>
                  <Input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="bg-[#F9FAFB] border-gray-200 rounded-xl h-11"
                  />
                </div>

                <Button
                  onClick={handleAssign}
                  disabled={!selectedAdmin || isAssigning}
                  className="w-full bg-[#6B7FE8] hover:bg-[#5A6DD7] text-white rounded-xl h-11 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isAssigning ? "Memproses..." : primaryAssignment ? "Perbarui Penugasan" : "Tugaskan"}
                </Button>
              </div>
            </div>
          )}

          <div className="bg-gradient-to-br from-[#F8F9FE] to-[#F3F4F6] rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-5 pb-5 border-b border-gray-200">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-sm">
                <CheckCircle2 size={20} className="text-[#6B7FE8]" />
              </div>
              <div>
                <h3 className="text-[#2D3748]">{canManageAssignments ? "Informasi Penugasan" : "Penugasan Fakultas"}</h3>
                {isFacultyRole && (
                  <p className="text-xs text-[#6B7280] mt-1">
                    Tiket ini hanya dapat dipantau oleh admin fakultas. Hubungi super admin bila perlu perubahan penugasan.
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              {assignmentList.length > 0 ? (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Label className="text-[#6B7280] text-xs mb-2 block">Ditugaskan Ke</Label>
                  <div className="space-y-2">
                    {assignmentList.map((assignment, idx) => (
                      <div key={assignment.id || idx} className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-[#DBEAFE] to-[#BFDBFE] rounded-lg flex items-center justify-center">
                          <span className="text-xs text-[#2563EB]">
                            {assignment.assigned_to_user?.name?.substring(0, 2).toUpperCase() || "NA"}
                          </span>
                        </div>
                        <span className="text-[#2D3748]">{assignment.assigned_to_user?.name || "-"}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Label className="text-[#6B7280] text-xs mb-2 block">Ditugaskan Ke</Label>
                  <p className="text-[#9CA3AF] text-sm">Belum ada penugasan</p>
                </div>
              )}

              {assignmentList.length > 0 && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Label className="text-[#6B7280] text-xs mb-2 flex items-center gap-2">
                    <Calendar size={14} />
                    Tanggal Penugasan
                  </Label>
                  <p className="text-[#2D3748]">
                    {latestAssignmentDate
                      ? new Date(latestAssignmentDate).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : "-"}
                  </p>
                </div>
              )}

              {primaryAssignment?.due_date && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Label className="text-[#6B7280] text-xs mb-2 flex items-center gap-2">
                    <Clock size={14} />
                    Batas Waktu
                  </Label>
                  <p className="text-[#2D3748]">
                    {new Date(primaryAssignment.due_date).toLocaleString("id-ID", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}

              {primaryAssignment?.notes && (
                <div className="bg-white rounded-xl p-4 border border-gray-200">
                  <Label className="text-[#6B7280] text-xs mb-2 flex items-center gap-2">
                    <FileText size={14} />
                    Catatan Penugasan
                  </Label>
                  <p className="text-sm text-[#374151] whitespace-pre-line">{primaryAssignment.notes}</p>
                </div>
              )}

              {canManageAssignments ? (
                <div className="bg-white rounded-xl p-4 border border-dashed border-[#CBD5F5] space-y-3">
                  <Label className="text-[#6B7280] text-xs block">Status Penanganan</Label>
                  {primaryAssignment ? (
                    <div className="space-y-2">
                      <p className="text-sm text-[#1F2937] font-medium">{assignedAdminName || "Admin Fakultas"}</p>
                      {assignedFacultyName && <p className="text-xs text-[#6B7280]">{assignedFacultyName}</p>}
                      <p className="text-sm text-[#4B5563]">
                        Penandaan selesai atau ditolak kini hanya dapat dilakukan dari halaman detail tiket pada dashboard admin
                        fakultas.
                      </p>
                      <p className="text-xs text-[#9CA3AF]">
                        Gunakan menu penugasan di atas bila perlu mengalihkan admin penanggung jawab atau hubungi admin terkait
                        untuk meminta pembaruan status.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {isFinalRejected ? (
                        <div className="bg-[#FFCDD2] border border-[#EF9A9A] rounded-xl p-4 text-sm text-[#C62828]">
                          <p className="font-medium mb-1">Tiket Ditolak Final</p>
                          <p className="text-xs">Tiket ini telah ditolak dan tidak dapat ditugaskan kembali.</p>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm text-[#4B5563]">
                            Tugaskan tiket ke admin fakultas terlebih dahulu agar status dapat diperbarui melalui dashboard fakultas.
                          </p>
                          {/* Tombol Tolak Tiket hanya untuk superadmin dengan modal konfirmasi */}
                          {user?.role === "super_admin" && ticket.report_status !== "Selesai" && ticket.report_status !== "Ditolak" && (
                            <div className="border-t border-gray-200 pt-3">
                              <p className="text-xs text-[#6B7280] mb-2">Atau tolak tiket ini:</p>
                              <Button
                                onClick={() => setShowRejectModal(true)}
                                variant="outline"
                                className="w-full rounded-xl h-10 border-[#DC2626] text-[#DC2626] hover:bg-[#DC2626] hover:text-white transition-all"
                              >
                                Tolak Tiket
                              </Button>
                              <ConfirmModal
                                open={showRejectModal}
                                title="Konfirmasi Penolakan Tiket"
                                description="Apakah Anda yakin ingin menolak tiket ini? Tiket yang ditolak akan langsung dianggap selesai dan tidak dapat ditugaskan kembali."
                                onCancel={() => setShowRejectModal(false)}
                                onConfirm={async () => {
                                  setShowRejectModal(false);
                                  try {
                                    await apiClient.put(`/reports/${normalizedTicketId}`, { report_status: "Ditolak" });
                                    await createAction({
                                      report_id: normalizedTicketId,
                                      action_type: "Ditolak",
                                      notes: "Ditolak oleh Super Admin",
                                    });
                                    toast.success("Tiket berhasil ditolak oleh superadmin");
                                    await Promise.all([fetchTicket(), fetchActions()]);
                                  } catch (err) {
                                    toast.error("Gagal menolak tiket");
                                  }
                                }}
                                confirmText="Ya, Tolak Tiket"
                                cancelText="Batal"
                              />
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-white rounded-xl p-4 border border-dashed border-[#CBD5F5]">
                  <Label className="text-[#6B7280] text-xs mb-1 block">Panduan Tindak Lanjut</Label>
                  <p className="text-sm text-[#4B5563]">
                    Silakan gunakan menu tindakan pada dashboard fakultas untuk memperbarui status atau menambahkan catatan.
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#D4F4E2] to-[#A5E8C8] rounded-xl flex items-center justify-center">
                <Clock size={20} className="text-[#16A34A]" />
              </div>
              <h3 className="text-[#2D3748]">Timeline</h3>
            </div>

            <div className="space-y-4">
              {orderedTimeline.length > 0 ? (
                orderedTimeline.map((event, idx) => {
                  const bulletColor =
                    event.tone === "success"
                      ? "bg-[#16A34A]"
                      : event.tone === "danger"
                      ? "bg-[#DC2626]"
                      : event.tone === "info"
                      ? "bg-[#3B82F6]"
                      : event.tone === "warning"
                      ? "bg-[#FBBF24]"
                      : "bg-[#A5E8C8]";
                  return (
                    <div key={event.id} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        <div className={`w-2 h-2 rounded-full ${bulletColor}`}></div>
                        {idx < orderedTimeline.length - 1 && <div className="w-0.5 flex-1 bg-[#E5E7EB] mt-1"></div>}
                      </div>
                      <div className="pb-4">
                        <p className="text-sm text-[#1F2937] font-medium">{event.label}</p>
                        {event.description && <p className="text-xs text-[#6B7280] mt-1">{event.description}</p>}
                        {event.timestamp && (
                          <p className="text-xs text-[#9CA3AF] mt-1">
                            {new Date(event.timestamp).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                        {event.actor && <p className="text-xs text-[#9CA3AF]">oleh {event.actor}</p>}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-2 h-2 bg-[#D1D5DB] rounded-full"></div>
                  </div>
                  <div>
                    <p className="text-sm text-[#9CA3AF]">Belum ada aktivitas</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100/50 p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-[#E0F2FE] to-[#BAE6FD] rounded-xl flex items-center justify-center">
                <ListChecks size={20} className="text-[#0284C7]" />
              </div>
              <h3 className="text-[#2D3748]">Log Aktivitas</h3>
            </div>

            {orderedActions.length > 0 ? (
              <div className="space-y-3">
                {orderedActions.map((action) => (
                  <div key={action.id || action.created_at} className="border border-gray-100 rounded-xl p-4 bg-[#F9FAFB]">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <p className="text-sm text-[#1F2937] font-medium">{action.action_type || "Aktivitas"}</p>
                      <span className="text-xs text-[#9CA3AF]">
                        {action.created_at
                          ? new Date(action.created_at).toLocaleString("id-ID", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "-"}
                      </span>
                    </div>
                    {action.notes && <p className="text-sm text-[#4B5563] whitespace-pre-line">{action.notes}</p>}
                    <p className="text-xs text-[#6B7280] mt-1">oleh {action.user?.name || "Sistem"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-[#F9FAFB] border border-dashed border-gray-200 rounded-xl p-6 text-center">
                <p className="text-sm text-[#6B7280]">Belum ada log aktivitas dari backend</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
