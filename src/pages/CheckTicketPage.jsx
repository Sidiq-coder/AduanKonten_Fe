import { useState } from "react";
import { Search, AlertCircle, CheckCircle2, Paperclip, Download } from "lucide-react";
import { toast } from "sonner@2.0.3";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { usePublicReportByTicket } from "../hooks/useTickets";
import {
  API_BASE_URL,
  formatDateTime,
  formatFileSize,
  reportSectionBackgroundStyle,
  statusConfig,
} from "./landingShared.jsx";

export function CheckTicketPage() {
  const [ticketId, setTicketId] = useState("");
  const { report: foundReport, fetchReport } = usePublicReportByTicket(ticketId);
  const storageBaseUrl = `${API_BASE_URL}/storage`;
  const attachmentsList = Array.isArray(foundReport?.attachments) ? foundReport.attachments : [];
  const detailStatusKey = (foundReport?.report_status || foundReport?.status || "").toLowerCase();
  const detailStatusInfo = statusConfig[detailStatusKey];
  const detailStatusLabel = detailStatusInfo?.label || foundReport?.report_status || foundReport?.status || "-";
  const reporterName = foundReport?.name || foundReport?.reporter_name || "-";
  const reporterEmail = foundReport?.email || foundReport?.reporter_email || "-";
  const reportCategory = foundReport?.category?.name || foundReport?.category_id || "-";
  const reportDate = formatDateTime(foundReport?.created_at);
  const reportDescription = foundReport?.description || foundReport?.notes || "-";
  const reportLink = foundReport?.link_site || foundReport?.link || "-";


  const handleCheckTicket = async () => {
    if (!ticketId.trim()) {
      toast.error("ID tiket belum diisi", {
        description: "Masukkan ID tiket yang ingin Anda lacak",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
      return;
    }

    try {
      const latestReport = await fetchReport();
      if (latestReport) {
        const normalizedStatus = (latestReport.report_status || latestReport.status || "").toLowerCase();
        const statusLabel = statusConfig[normalizedStatus]?.label || latestReport.report_status || latestReport.status || "Tidak diketahui";
        toast.success("Tiket ditemukan", {
          description: `Status saat ini: ${statusLabel}`,
          icon: <CheckCircle2 size={20} className="text-[#16A34A]" />,
        });
      } else {
        toast.error("Tiket tidak ditemukan", {
          description: "Pastikan ID tiket yang Anda masukkan sudah sesuai dengan email konfirmasi",
          icon: <AlertCircle size={20} className="text-[#F472B6]" />,
        });
      }
    } catch (error) {
      toast.error("Gagal memeriksa tiket", {
        description: "Terjadi kesalahan saat menghubungi server",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
    }
  };

  return (
    <section className="relative py-16" style={reportSectionBackgroundStyle}>
      <div className="absolute inset-0 bg-[#020617]/30" aria-hidden="true" />
      <div className="relative max-w-2xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-3">Cek Status Tiket</h1>
          <p className="text-base text-white/80">Masukkan ID tiket untuk melihat status laporan Anda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#003D82] to-[#002855] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Search size={24} className="text-[#003D82]" />
              </div>
              <div>
                <h3 className="text-lg text-white">Pelacakan Tiket</h3>
                <p className="text-xs text-white/80 mt-1">Lihat perkembangan laporan Anda secara langsung</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ticketId" className="text-sm">
                ID Tiket
              </Label>
              <Input
                id="ticketId"
                placeholder="Contoh: #101025003219-600"
                value={ticketId}
                onChange={(event) => setTicketId(event.target.value)}
                className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"
              />
            </div>

            <Button onClick={handleCheckTicket} className="w-full bg-gradient-to-r from-[#003D82] to-[#002855] hover:from-[#002855] hover:to-[#001a3d] text-white h-10 rounded-lg shadow-lg text-sm">
              <Search size={18} className="mr-2" />
              <span>Cek Status</span>
            </Button>

            {foundReport && (
              <div className="space-y-4 mt-6">
                <div className="rounded-2xl bg-gradient-to-r from-[#003D82] to-[#002855] p-6 text-white border border-white/20 shadow-xl">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                    <div>
                      <h4 className="text-base font-semibold text-white">Ringkasan Tiket</h4>
                      <p className="text-xs text-white/80">ID Tiket: {foundReport.ticket_id || foundReport.id}</p>
                    </div>
                    <Badge className="bg-white text-[#003D82] border border-white/30 px-3 py-1.5 rounded-lg text-xs">{detailStatusLabel}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Nama Pelapor</p>
                      <p className="text-white font-semibold text-sm">{reporterName}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Alamat Email</p>
                      <p className="text-white font-semibold break-words text-sm">{reporterEmail}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Kategori</p>
                      <p className="text-white font-semibold text-sm">{reportCategory}</p>
                    </div>
                    <div>
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Tanggal Lapor</p>
                      <p className="text-white font-semibold text-sm">{reportDate}</p>
                    </div>
                    <div className="sm:col-span-2">
                      <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Deskripsi</p>
                      <p className="text-white leading-relaxed text-sm">{reportDescription}</p>
                    </div>
                    {reportLink && reportLink !== "-" && (
                      <div className="sm:col-span-2">
                        <p className="text-white/60 text-xs uppercase tracking-wide mb-0.5">Tautan Konten</p>
                        <a href={reportLink} target="_blank" rel="noopener noreferrer" className="text-white underline break-words text-sm">
                          {reportLink}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {attachmentsList.length > 0 && (
                  <div className="rounded-2xl bg-gradient-to-r from-[#003D82] to-[#002855] p-6 text-white border border-white/20 shadow-xl">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                        <Paperclip size={16} className="text-white" />
                      </div>
                      <div>
                        <h5 className="text-white font-semibold text-sm">Lampiran</h5>
                        <p className="text-xs text-white/80">Bukti yang dikirim bersama laporan</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {attachmentsList.map((attachment, index) => {
                        const fileUrl = `${storageBaseUrl}/${attachment.file_path}`;
                        const isImage = (attachment.mime_type || "").startsWith("image/");
                        const sizeLabel = formatFileSize(attachment.file_size);
                        return (
                          <div
                            key={`${attachment.file_path}-${index}`}
                            className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-white/20 rounded-lg p-3 bg-white/5"
                          >
                            <div>
                              <p className="font-semibold text-white text-sm">{attachment.filename || `Lampiran ${index + 1}`}</p>
                              <p className="text-xs text-white/80">{attachment.mime_type || "File"}{sizeLabel ? ` · ${sizeLabel}` : ""}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {isImage && <img src={fileUrl} alt={attachment.filename || `Lampiran ${index + 1}`} className="w-20 h-14 object-cover rounded-lg border border-white/30 shadow-sm" />}
                              <Button asChild variant="outline" size="sm" className="rounded-lg border-white/40 bg-white/10 text-white hover:bg-white/20 text-xs">
                                <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                  <Download size={16} />
                                  Lihat / Unduh
                                </a>
                              </Button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

              </div>
            )}

            <div className="bg-blue-50 border-2 border-[#003D82]/20 rounded-lg p-4 mt-6">
              <div className="flex items-start gap-2">
                <AlertCircle className="text-[#003D82] flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-xs text-[#2D3748]">
                    <span className="font-semibold">Informasi:</span> ID tiket dikirimkan ke email Anda setelah laporan berhasil disubmit. Pastikan untuk menyimpan ID tiket dengan baik.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
