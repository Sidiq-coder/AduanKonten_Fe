import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Send, Search, Shield, Clock, CheckCircle2, ArrowRight, MessageSquare, BarChart3, AlertCircle, Users, Target, Award, Zap, FileText, Lock, Paperclip, Download } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner@2.0.3";
import { UnilaLogo } from "../components/UnilaLogo";
import { useTickets, usePublicReportByTicket } from "../hooks/useTickets";
import { useCategories, useReporterTypes } from "../hooks/useMasterData";
import campusBackground from "../assets/unila-logo.png";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const TIMELINE_TONE_STYLES = {
  neutral: "bg-[#94A3B8]",
  info: "bg-[#3B82F6]",
  warning: "bg-[#FBBF24]",
  success: "bg-[#22C55E]",
  danger: "bg-[#EF4444]",
};

const formatDateTime = (value) => {
  if (!value)
    return "-";
  try {
    return new Date(value).toLocaleString("id-ID", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }
  catch (_a) {
    return value;
  }
};

const formatFileSize = (bytes) => {
  if (!bytes)
    return null;
  const sizeInKB = bytes / 1024;
  if (sizeInKB < 1024) {
    return `${Math.max(sizeInKB, 1).toFixed(0)} KB`;
  }
  return `${(sizeInKB / 1024).toFixed(2)} MB`;
};

// Mapping status sesuai backend (case-insensitive)
const statusConfig = {
  diterima: { label: "Diterima", color: "bg-[#E0E7FF] text-[#4F46E5] border-[#C7D2FE]", icon: MessageSquare },
  diproses: { label: "Sedang Diproses", color: "bg-[#FFE8D9] text-[#EA580C] border-[#FFD4A5]", icon: Clock },
  selesai: { label: "Selesai", color: "bg-[#D4F4E2] text-[#16A34A] border-[#A5E8C8]", icon: CheckCircle2 },
  ditolak: { label: "Ditolak", color: "bg-[#FEE2E2] text-[#DC2626] border-[#FCA5A5]", icon: AlertCircle },
};

const reportSectionBackgroundStyle = {
  backgroundImage: `linear-gradient(135deg, rgba(3, 16, 40, 0.92), rgba(0, 61, 130, 0.85)), url(${campusBackground})`,
  backgroundSize: "cover",
  backgroundPosition: "center",
  backgroundAttachment: "fixed",
};
export function LandingPage({ onLoginAsAdmin }) {
  const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState("home");
    const [ticketId, setTicketId] = useState("");
    const [formData, setFormData] = useState({
        name: "",
        reporter_type_id: null,
        phone: "",
        email: "",
        category_id: null,
        link: "",
        notes: "",
        file: null,
    });
    const [filePreview, setFilePreview] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    // Fetch master data
    const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
    const { reporterTypes, loading: reporterTypesLoading, error: reporterTypesError } = useReporterTypes();
    const { createTicket } = useTickets({}, { skipInitialFetch: true });
    const { report: foundReport, fetchReport } = usePublicReportByTicket(ticketId);
    const storageBaseUrl = `${API_BASE_URL}/storage`;
    const attachmentsList = Array.isArray(foundReport?.attachments) ? foundReport.attachments : [];
    const detailStatusKey = (foundReport?.report_status || foundReport?.status || "").toLowerCase();
    const detailStatusInfo = statusConfig[detailStatusKey];
    const detailStatusLabel = detailStatusInfo?.label || foundReport?.report_status || foundReport?.status || "-";
    const fallbackTimelineTone = detailStatusKey === "selesai"
      ? "success"
      : detailStatusKey === "ditolak"
        ? "danger"
        : detailStatusKey === "diproses"
          ? "warning"
          : "info";
    const reporterName = foundReport?.name || foundReport?.reporter_name || "-";
    const reporterEmail = foundReport?.email || foundReport?.reporter_email || "-";
    const reportCategory = foundReport?.category?.name || foundReport?.category_id || "-";
    const reportDate = formatDateTime(foundReport?.created_at);
    const reportDescription = foundReport?.description || foundReport?.notes || "-";
    const reportLink = foundReport?.link_site || foundReport?.link || "-";
    const timelineEvents = useMemo(() => {
      if (!foundReport) {
        return [];
      }
      const events = [];
      const creatorName = foundReport.name || foundReport.reporter_name || "";
      if (foundReport.created_at) {
        events.push({
          id: "created",
          title: "Laporan dibuat",
          description: creatorName
            ? `Dikirim oleh ${creatorName}`
            : "Laporan berhasil diterima oleh sistem.",
          timestamp: foundReport.created_at,
          tone: "neutral",
          actor: creatorName || undefined,
        });
      }
      const actionsList = Array.isArray(foundReport.actions) ? foundReport.actions : [];
      actionsList.forEach((action, idx) => {
        if (!(action === null || action === void 0 ? void 0 : action.created_at))
          return;
        const normalized = (action.action_type || "").toLowerCase();
        let tone = "info";
        let title = action.action_type || "Aktivitas";
        if (normalized.includes("selesai")) {
          tone = "success";
          title = "Tiket selesai";
        }
        else if (normalized.includes("tolak")) {
          tone = "danger";
          title = "Tiket ditolak";
        }
        else if (normalized.includes("proses") || normalized.includes("review")) {
          tone = "warning";
          title = "Sedang diproses";
        }
        events.push({
          id: `action-${action.id || idx}`,
          title,
          description: action.notes || action.description || "Status diperbarui oleh admin",
          timestamp: action.created_at,
          tone,
          actor: (action === null || action === void 0 ? void 0 : action.user)?.name,
        });
      });
      if (events.length === 0 && foundReport.updated_at) {
        events.push({
          id: "status-fallback",
          title: `Status: ${detailStatusLabel}`,
          description: "Status tiket diperbarui oleh sistem",
          timestamp: foundReport.updated_at,
          tone: fallbackTimelineTone,
        });
      }
      return events
        .filter((event) => !!event.timestamp)
        .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    }, [foundReport, detailStatusLabel, fallbackTimelineTone]);

    // Debug status value
    useEffect(() => {
      if (foundReport) {
        console.log('DEBUG foundReport (full):', JSON.stringify(foundReport, null, 2));
      }
    }, [foundReport]);
    
    const handleCheckTicket = async () => {
      if (!ticketId.trim()) {
        toast.error("ID tiket belum diisi", {
          description: "Masukkan ID tiket yang ingin Anda lacak",
          icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
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
            icon: <CheckCircle2 size={20} className="text-[#16A34A]"/>,
          });
        }
        else {
          toast.error("Tiket tidak ditemukan", {
            description: "Pastikan ID tiket yang Anda masukkan sudah sesuai dengan email konfirmasi",
            icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
          });
        }
      }
      catch (error) {
        toast.error("Gagal memeriksa tiket", {
          description: "Terjadi kesalahan saat menghubungi server",
          icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
        });
      }
    };
    const handleFileChange = (e) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validate file type
            const validTypes = ["image/jpeg", "image/jpg", "image/png"];
            if (!validTypes.includes(file.type)) {
                toast.error("Format file tidak valid", {
                    description: "Hanya file JPEG, JPG, dan PNG yang diperbolehkan",
                    icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
                });
                return;
            }
            // Validate file size (2MB = 2 * 1024 * 1024 bytes)
            if (file.size > 2 * 1024 * 1024) {
                toast.error("Ukuran file terlalu besar", {
                    description: "Maksimal ukuran file adalah 2 MB",
                    icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
                });
                return;
            }
            setFormData({ ...formData, file });
            // Create preview
            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };
    const handleReset = () => {
        setFormData({
            name: "",
            reporter_type_id: "",
            phone: "",
            email: "",
            category_id: "",
            link: "",
            notes: "",
            file: null,
        });
        setFilePreview("");
    };
    
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Validation - check each field individually for better error messages
        if (!formData.name) {
            toast.error("Nama wajib diisi", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.reporter_type_id) {
            toast.error("Status wajib dipilih", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.email) {
            toast.error("Email wajib diisi", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.category_id) {
            toast.error("Kategori wajib dipilih", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.link) {
            toast.error("Link Situs wajib diisi", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.notes) {
            toast.error("Catatan wajib diisi", {
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        if (!formData.file) {
            toast.error("Lampiran wajib diupload", {
                description: "Pastikan file berupa gambar (JPEG/PNG) dan ukuran maksimal 2 MB",
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
            return;
        }
        
        setIsSubmitting(true);
        
        try {
          const normalizedLink = formData.link?.match(/^https?:\/\//i)
            ? formData.link
            : `https://${formData.link}`;

          const submitData = {
            name: formData.name,
            email: formData.email,
            phone: formData.phone || undefined,
            reporter_type_id: formData.reporter_type_id,
            category_id: formData.category_id,
            link_site: normalizedLink,
            description: formData.notes,
            attachments: formData.file ? [formData.file] : [],
          };
            
            const result = await createTicket(submitData, true); // true for isPublic
            
            toast.success("Tiket berhasil dikirim!", {
                description: `ID Tiket Anda: ${result.ticket_id}. Simpan ID ini untuk pelacakan.`,
                icon: <CheckCircle2 size={20} className="text-[#16A34A]"/>,
                duration: 8000,
            });
            
            handleReset();
        } catch (error) {
            toast.error("Gagal mengirim tiket", {
                description: error.message || "Terjadi kesalahan saat mengirim tiket",
                icon: <AlertCircle size={20} className="text-[#F472B6]"/>,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    return (<div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b-2 border-[#003D82] sticky top-0 z-50 shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <UnilaLogo size={40}/>
              <div>
                <h2 className="text-[#003D82] text-base">Sistem Aduan Konten</h2>
                <p className="text-xs text-[#2D3748]">Universitas Lampung</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button onClick={() => setActiveTab("home")} variant="ghost" className={`rounded-lg h-9 px-4 transition-all text-sm ${activeTab === "home" ? "bg-[#003D82] text-white hover:bg-[#002E5B]" : "text-[#2D3748] hover:bg-gray-100"}`}>
                Beranda
              </Button>
              <Button onClick={() => setActiveTab("submit")} variant="ghost" className={`rounded-lg h-9 px-4 transition-all text-sm ${activeTab === "submit" ? "bg-[#003D82] text-white hover:bg-[#002E5B]" : "text-[#2D3748] hover:bg-gray-100"}`}>
                Kirim Laporan
              </Button>
              <Button onClick={() => setActiveTab("check")} variant="ghost" className={`rounded-lg h-9 px-4 transition-all text-sm ${activeTab === "check" ? "bg-[#003D82] text-white hover:bg-[#002E5B]" : "text-[#2D3748] hover:bg-gray-100"}`}>
                Cek Status
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main>
        {activeTab === "home" && (<div>
            {/* Hero Section with Strong Unila Identity */}
            <section className="relative bg-gradient-to-br from-[#003D82] via-[#00488E] to-[#002E5B] overflow-hidden">
              {/* Decorative Background Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 left-0 w-96 h-96 bg-[#003D82] rounded-full blur-3xl"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#003D82] rounded-full blur-3xl"></div>
              </div>
              
              {/* Grid Pattern Overlay */}
              <div className="absolute inset-0" style={{
                backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)`,
                backgroundSize: '50px 50px'
            }}></div>

              <div className="relative max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                  {/* Left Content */}
                  <div className="space-y-4">
                    <div className="inline-block">
                      <Badge className="bg-white text-[#003D82] border-0 px-4 py-2 rounded-full shadow-lg text-sm">
                        <Shield size={16} className="mr-2"/>
                        Platform Resmi Universitas Lampung
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      <h1 className="text-4xl text-white leading-tight">
                        Wujudkan Kampus Digital yang 
                        <span className="block text-white mt-2">Aman & Beretika</span>
                      </h1>
                      
                      <p className="text-lg text-white/90 leading-relaxed">
                        Sistem pelaporan konten terintegrasi untuk menjaga integritas dan reputasi sivitas akademika Universitas Lampung
                      </p>
                    </div>

                    <div className="flex items-center gap-3 pt-4">
                      <Button onClick={() => setActiveTab("submit")} className="bg-white hover:bg-gray-100 text-[#003D82] px-6 h-12 rounded-xl shadow-2xl transition-all hover:scale-105">
                        <Send size={20} className="mr-2"/>
                        <span className="text-base">Laporkan Sekarang</span>
                      </Button>
                      <Button onClick={() => setActiveTab("check")} variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#003D82] px-6 h-12 rounded-xl transition-all">
                        <Search size={20} className="mr-2"/>
                        <span className="text-base">Cek Status</span>
                      </Button>
                    </div>
                  </div>

                  {/* Right Content - Decorative */}
                  <div className="relative hidden lg:block">
                    <div className="relative">
                      {/* Large Logo Background */}
                      <div className="flex items-center justify-center">
                        <img 
                          src="/src/assets/unila-logo.png" 
                          alt="Logo Universitas Lampung" 
                          className="w-full max-w-[900px] h-[600px] object-contain"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* About Section - Strong Institutional Feel */}
            <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-10">
                  <div className="inline-block mb-4">
                    <div className="bg-gradient-to-r from-[#003D82] to-[#002E5B] text-white px-4 py-2 rounded-full">
                      <span className="text-base">Tentang Platform</span>
                    </div>
                  </div>
                  <h2 className="text-3xl text-[#2D3748] mb-4">
                    Menjaga Integritas Digital<br />
                    <span className="text-[#003D82]">Universitas Lampung</span>
                  </h2>
                  <p className="text-base text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
                    Platform terpadu yang dirancang khusus untuk mengelola laporan konten bermasalah dan melindungi reputasi institusi serta seluruh sivitas akademika
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Visi Card */}
                  <div className="bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <Target size={28} className="text-[#003D82]"/>
                    </div>
                    <h3 className="text-xl text-white mb-3">Visi</h3>
                    <p className="text-sm text-white/90 leading-relaxed">
                      Menjadi sistem pelaporan konten terdepan yang menciptakan ekosistem digital kampus yang aman, etis, dan produktif bagi seluruh sivitas akademika Universitas Lampung.
                    </p>
                  </div>

                  {/* Misi Card */}
                  <div className="bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                      <Award size={28} className="text-[#003D82]"/>
                    </div>
                    <h3 className="text-xl mb-3 text-white">Misi</h3>
                    <p className="text-sm leading-relaxed text-white/90">
                      Menyediakan saluran pelaporan yang mudah, cepat, dan terpercaya untuk menangani konten bermasalah dengan profesionalisme tinggi dan menjunjung nilai-nilai integritas akademik.
                    </p>
                  </div>
                </div>

                {/* Features Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                      <Shield size={24} className="text-white"/>
                    </div>
                    <h4 className="text-lg text-[#2D3748] mb-2">Keamanan Data</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Dilindungi dengan enkripsi tingkat enterprise dan sistem keamanan berlapis untuk menjaga kerahasiaan pelapor
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                      <Users size={24} className="text-white"/>
                    </div>
                    <h4 className="text-lg text-[#2D3748] mb-2">Tim Profesional</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Ditangani oleh tim verifikasi berpengalaman dari berbagai fakultas di Universitas Lampung
                    </p>
                  </div>

                  <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                      <Lock size={24} className="text-white"/>
                    </div>
                    <h4 className="text-lg text-[#2D3748] mb-2">Transparansi</h4>
                    <p className="text-sm text-[#6B7280] leading-relaxed">
                      Pemantauan status real-time dan notifikasi otomatis untuk setiap tahapan penanganan laporan
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Coverage Section */}
            <section className="py-12 bg-gradient-to-br from-[#003D82] via-[#00488E] to-[#002E5B] relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#003D82] rounded-full opacity-20 blur-3xl"></div>
              <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#003D82] rounded-full opacity-20 blur-3xl"></div>
              
              <div className="relative max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Left: Cakupan */}
                  <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                        <FileText size={24} className="text-[#003D82]"/>
                      </div>
                      <h3 className="text-xl text-white">Cakupan Platform</h3>
                    </div>
                    <ul className="space-y-3">
                      {[
                "Semua fakultas dan unit kerja di Universitas Lampung",
                "Platform media sosial resmi universitas",
                "Website dan sistem informasi akademik",
                "Konten digital lainnya yang melibatkan sivitas akademika"
            ].map((item, index) => (<li key={index} className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                            <CheckCircle2 size={14} className="text-[#003D82]"/>
                          </div>
                          <span className="text-sm text-white/90">{item}</span>
                        </li>))}
                    </ul>
                  </div>

                  {/* Right: Jenis Laporan */}
                  <div className="bg-white rounded-2xl p-6 shadow-xl">
                    <h3 className="text-xl text-[#2D3748] mb-6">Jenis Laporan</h3>
                    <ul className="space-y-4">
                      {[
                { icon: AlertCircle, title: "Konten Tidak Pantas", desc: "Konten yang melanggar norma dan etika akademik", color: "from-red-500 to-red-600" },
                { icon: AlertCircle, title: "Spam & Pelecehan", desc: "Konten spam atau yang melecehkan pihak lain", color: "from-orange-500 to-orange-600" },
                { icon: AlertCircle, title: "Pelanggaran Hak Cipta", desc: "Konten yang melanggar hak kekayaan intelektual", color: "from-[#003D82] to-[#002E5B]" },
                { icon: AlertCircle, title: "Informasi Menyesatkan", desc: "Hoaks atau informasi yang tidak akurat", color: "from-green-500 to-green-600" }
            ].map((item, index) => (<li key={index} className="flex items-start gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                            <item.icon size={18} className="text-white"/>
                          </div>
                          <div>
                            <h5 className="text-base text-[#2D3748] mb-1">{item.title}</h5>
                            <p className="text-xs text-[#6B7280]">{item.desc}</p>
                          </div>
                        </li>))}
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* How It Works - Bold & Clear */}
            <section className="py-12 bg-white">
              <div className="max-w-7xl mx-auto px-6">
                <div className="text-center mb-10">
                  <h2 className="text-3xl text-[#2D3748] mb-3">Alur Pelaporan</h2>
                  <p className="text-base text-[#6B7280]">Proses sederhana dan transparan untuk setiap laporan</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {[
                { step: "01", title: "Isi Formulir", desc: "Lengkapi data diri dan detail laporan dengan akurat", icon: FileText, color: "from-[#003D82] to-[#002E5B]" },
                { step: "02", title: "Kirim Laporan", desc: "Submit formulir dan dapatkan ID tiket untuk pelacakan", icon: Send, color: "from-[#003D82] to-[#002E5B]" },
                { step: "03", title: "Verifikasi Tim", desc: "Laporan diverifikasi oleh tim fakultas terkait", icon: Users, color: "from-[#003D82] to-[#002E5B]" },
                { step: "04", title: "Selesai", desc: "Dapatkan notifikasi hasil dan tindak lanjut", icon: CheckCircle2, color: "from-[#003D82] to-[#002E5B]" }
            ].map((item, index) => (<div key={index} className="relative group">
                      <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl hover:border-[#003D82] transition-all">
                        <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <item.icon size={24} className="text-white"/>
                        </div>
                        <div className={`text-3xl bg-gradient-to-br ${item.color} bg-clip-text text-transparent mb-3`}>
                          {item.step}
                        </div>
                        <h4 className="text-base text-[#2D3748] mb-2">{item.title}</h4>
                        <p className="text-sm text-[#6B7280]">{item.desc}</p>
                      </div>
                      {index < 3 && (<div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 z-10">
                          <ArrowRight className="text-[#003D82]" size={24}/>
                        </div>)}
                    </div>))}
                </div>
              </div>
            </section>

            {/* CTA Section */}
            <section className="py-12 bg-gradient-to-r from-[#003D82] to-[#002855] relative overflow-hidden">
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <UnilaLogo size={400}/>
                </div>
              </div>
              
              <div className="relative max-w-4xl mx-auto px-6 text-center">
                <h2 className="text-3xl text-white mb-4">
                  Siap Melaporkan?
                </h2>
                <p className="text-lg text-white/90 mb-6">
                  Bersama kita jaga integritas dan reputasi Universitas Lampung
                </p>
                <div className="flex items-center justify-center gap-4">
                  <Button onClick={() => setActiveTab("submit")} className="bg-white hover:bg-gray-100 text-[#003D82] px-8 h-12 rounded-xl shadow-2xl transition-all hover:scale-105">
                    <Send size={20} className="mr-2"/>
                    <span className="text-base">Kirim Laporan Sekarang</span>
                  </Button>
                  <Button onClick={() => setActiveTab("check")} variant="outline" className="border-2 border-white text-white hover:bg-white hover:text-[#003D82] px-6 h-12 rounded-xl">
                    <span className="text-base">Atau Cek Status Tiket</span>
                  </Button>
                </div>
              </div>
            </section>
          </div>)}

        {activeTab === "submit" && (<section className="relative py-16" style={reportSectionBackgroundStyle}>
            <div className="absolute inset-0 bg-[#020617]/30" aria-hidden="true"></div>
            <div className="relative max-w-3xl mx-auto px-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-white mb-3">Kirim Laporan Baru</h1>
                <p className="text-base text-white/80">Isi formulir di bawah untuk mengajukan laporan konten bermasalah</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#003D82] to-[#002855] px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <Send size={24} className="text-[#003D82]"/>
                  </div>
                  <div>
                    <h3 className="text-lg text-white">Formulir Laporan</h3>
                    <p className="text-xs text-white/80 mt-1">Field dengan tanda * wajib diisi</p>
                  </div>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="name" className="text-sm">Nama <span className="text-[#F472B6]">*</span></Label>
                    <Input id="name" placeholder="Masukkan nama lengkap" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"/>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="status" className="text-sm">Status <span className="text-[#F472B6]">*</span></Label>
                    <Select 
                      value={formData.reporter_type_id || ""} 
                      onValueChange={(value) => {
                        if (!value || value === "loading" || value === "error" || value === "empty") return;
                        console.log('Selected reporter type:', value);
                        setFormData(prev => {
                          const updated = { ...prev, reporter_type_id: value };
                          console.log('Updated formData:', updated);
                          return updated;
                        });
                      }}
                    >
                      <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg h-10 hover:bg-white hover:border-[#003D82] transition-all text-sm">
                        <SelectValue placeholder="Pilih status"/>
                      </SelectTrigger>
                      <SelectContent className="rounded-lg">
                        {reporterTypesLoading ? (
                          <SelectItem value="loading" disabled>Loading...</SelectItem>
                        ) : reporterTypesError ? (
                          <SelectItem value="error" disabled>Error loading data</SelectItem>
                        ) : Array.isArray(reporterTypes) && reporterTypes.length > 0 ? (
                          reporterTypes.map((type) => (
                            <SelectItem key={type.id} value={type.id.toString()}>
                              {type.name}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="empty" disabled>Tidak ada data</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="phone" className="text-sm">No HP</Label>
                    <Input id="phone" type="tel" placeholder="08xx xxxx xxxx" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"/>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-sm">Email <span className="text-[#F472B6]">*</span></Label>
                    <Input id="email" type="email" placeholder="nama@example.com" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"/>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="category" className="text-sm">Kategori <span className="text-[#F472B6]">*</span></Label>
                  <Select 
                    value={formData.category_id || ""} 
                    onValueChange={(value) => {
                      if (!value || value === "loading" || value === "error" || value === "empty") return;
                      console.log('Selected category:', value);
                      setFormData(prev => {
                        const updated = { ...prev, category_id: value };
                        console.log('Updated formData:', updated);
                        return updated;
                      });
                    }}
                  >
                    <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg h-10 hover:bg-white hover:border-[#003D82] transition-all text-sm">
                      <SelectValue placeholder="Pilih kategori laporan"/>
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {categoriesLoading ? (
                        <SelectItem value="loading" disabled>Loading...</SelectItem>
                      ) : categoriesError ? (
                        <SelectItem value="error" disabled>Error loading data</SelectItem>
                      ) : Array.isArray(categories) && categories.length > 0 ? (
                        categories.map((category) => (
                          <SelectItem key={category.id} value={category.id.toString()}>
                            {category.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="empty" disabled>Tidak ada data</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="link" className="text-sm">Link Situs <span className="text-[#F472B6]">*</span></Label>
                  <Input id="link" type="url" placeholder="https://example.com" value={formData.link} onChange={(e) => setFormData({ ...formData, link: e.target.value })} className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"/>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="notes" className="text-sm">Catatan <span className="text-[#F472B6]">*</span></Label>
                  <Textarea id="notes" placeholder="Jelaskan secara rinci masalah Anda..." value={formData.notes} onChange={(e) => setFormData({ ...formData, notes: e.target.value })} rows={4} className="bg-gray-50 border-gray-300 rounded-lg focus:bg-white focus:border-[#003D82] transition-all resize-none text-sm"/>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="file" className="text-sm">Lampiran <span className="text-[#F472B6]">*</span></Label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label htmlFor="file-upload" className="px-4 py-2 bg-[#003D82] hover:bg-[#002855] text-white rounded-lg cursor-pointer transition-all shadow-md text-sm">
                        Pilih File
                      </label>
                      <span className="text-xs text-[#6B7280]">
                        {formData.file ? formData.file.name : "Tidak ada file yang dipilih"}
                      </span>
                      <input id="file-upload" type="file" accept="image/jpeg,image/jpg,image/png" onChange={handleFileChange} className="hidden"/>
                    </div>
                    <p className="text-xs text-[#6B7280]">File JPEG, JPG, PNG maksimal 2 MB</p>
                    
                    {filePreview && (<div className="mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                        <p className="text-xs text-[#2D3748] mb-3">Preview Gambar:</p>
                        <img src={filePreview} alt="Preview" className="max-w-full max-h-[200px] object-contain rounded-lg border-2 border-gray-300 shadow-lg"/>
                      </div>)}
                  </div>
                </div>

                <div className="flex gap-4 pt-4">
                  <Button type="button" onClick={handleReset} variant="outline" className="border-2 border-gray-300 text-[#6B7280] hover:bg-gray-50 rounded-xl h-12 px-8">
                    Reset
                  </Button>
                  <Button type="submit" className="flex-1 bg-gradient-to-r from-[#003D82] to-[#002855] hover:from-[#002855] hover:to-[#001a3d] text-white rounded-lg h-10 shadow-lg text-sm">
                    <Send size={16} className="mr-2"/>
                    Kirim Laporan
                  </Button>
                </div>
              </form>
            </div>
            </div>
          </section>)}

        {activeTab === "check" && (
          <section className="relative py-16" style={reportSectionBackgroundStyle}>
            <div className="absolute inset-0 bg-[#020617]/30" aria-hidden="true"></div>
            <div className="relative max-w-2xl mx-auto px-6">
              <div className="text-center mb-8">
                <h1 className="text-3xl text-white mb-3">Cek Status Tiket</h1>
                <p className="text-base text-white/80">Masukkan ID tiket untuk melihat status laporan Anda</p>
              </div>

              <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
              <div className="bg-gradient-to-r from-[#003D82] to-[#002855] px-6 py-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                    <Search size={24} className="text-[#003D82]"/>
                  </div>
                  <div>
                    <h3 className="text-lg text-white">Pelacakan Tiket</h3>
                    <p className="text-xs text-white/80 mt-1">Lihat perkembangan laporan Anda secara langsung</p>
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="ticketId" className="text-sm">ID Tiket</Label>
                  <Input id="ticketId" placeholder="Contoh: #101025003219-600" value={ticketId} onChange={(e) => setTicketId(e.target.value)} className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"/>
                </div>

                <Button onClick={handleCheckTicket} className="w-full bg-gradient-to-r from-[#003D82] to-[#002855] hover:from-[#002855] hover:to-[#001a3d] text-white h-10 rounded-lg shadow-lg text-sm">
                  <Search size={18} className="mr-2"/>
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
                        <Badge className="bg-white text-[#003D82] border border-white/30 px-3 py-1.5 rounded-lg text-xs">
                          {detailStatusLabel}
                        </Badge>
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
                            <Paperclip size={16} className="text-white"/>
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
                                <div key={`${attachment.file_path}-${index}`} className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between border border-white/20 rounded-lg p-3 bg-white/5">
                                  <div>
                                    <p className="font-semibold text-white text-sm">{attachment.filename || `Lampiran ${index + 1}`}</p>
                                    <p className="text-xs text-white/80">{attachment.mime_type || "File"}{sizeLabel ? ` · ${sizeLabel}` : ""}</p>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    {isImage && (
                                      <img src={fileUrl} alt={attachment.filename || `Lampiran ${index + 1}`} className="w-20 h-14 object-cover rounded-lg border border-white/30 shadow-sm"/>
                                    )}
                                    <Button asChild variant="outline" size="sm" className="rounded-lg border-white/40 text-white hover:bg-white/10 text-xs">
                                      <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                                        <Download size={16}/>
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

                    <div className="rounded-2xl bg-gradient-to-r from-[#003D82] to-[#002855] p-6 text-white border border-white/20 shadow-xl">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Clock size={16} className="text-white"/>
                        </div>
                        <div>
                          <h5 className="text-white font-semibold text-sm">Riwayat Penanganan</h5>
                          <p className="text-xs text-white/80">Pantau aktivitas tiket berdasarkan catatan admin</p>
                        </div>
                      </div>

                      {timelineEvents.length > 0 ? (
                        <div className="space-y-3">
                          {timelineEvents.map((event, idx) => {
                            const toneClass = TIMELINE_TONE_STYLES[event.tone || "neutral"] || TIMELINE_TONE_STYLES.neutral;
                            return (
                              <div key={event.id || idx} className="flex gap-2">
                                <div className="flex flex-col items-center">
                                  <div className={`w-1.5 h-1.5 rounded-full ${toneClass}`}></div>
                                  {idx < timelineEvents.length - 1 && <div className="w-0.5 flex-1 bg-white/30 mt-1"></div>}
                                </div>
                                <div className="pb-4">
                                  <p className="text-xs text-white/70 uppercase tracking-wide">{formatDateTime(event.timestamp)}</p>
                                  <p className="text-xs font-semibold text-white mt-0.5">{event.title}</p>
                                  {event.description && <p className="text-xs text-white/80 mt-0.5">{event.description}</p>}
                                  {event.actor && <p className="text-xs text-white/70 mt-0.5">Oleh {event.actor}</p>}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs text-white/80">Belum ada aktivitas lanjutan untuk tiket ini.</p>
                      )}
                    </div>
                  </div>
                )}

                <div className="bg-blue-50 border-2 border-[#003D82]/20 rounded-lg p-4 mt-6">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="text-[#003D82] flex-shrink-0 mt-0.5" size={20}/>
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
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#003D82] to-[#002855] text-white py-8 border-t-2 border-[#003D82]">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <UnilaLogo size={36}/>
                <div>
                  <h4 className="text-white text-sm">Aduan Konten</h4>
                  <p className="text-xs text-white/70">Universitas Lampung</p>
                </div>
              </div>
              <p className="text-xs text-white/70 leading-relaxed">
                Platform resmi untuk melaporkan konten bermasalah di lingkungan Universitas Lampung
              </p>
            </div>
            
            <div>
              <h5 className="text-white mb-3 text-sm">Kontak</h5>
              <div className="space-y-1.5 text-xs text-white/70">
                <p>Email: aduan@unila.ac.id</p>
                <p>Telepon: (0721) 123456</p>
                <p>Jl. Prof. Dr. Ir. Sumantri Brojonegoro No.1</p>
                <p>Bandar Lampung, 35141</p>
              </div>
            </div>
            
            <div>
              <h5 className="text-white mb-3 text-sm">Jam Operasional</h5>
              <div className="space-y-1.5 text-xs text-white/70">
                <p>Senin - Jumat: 08:00 - 16:00 WIB</p>
                <p>Sabtu: 08:00 - 12:00 WIB</p>
                <p>Minggu & Libur: Tutup</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-white/20 mt-6 pt-6 text-center text-xs text-white/70">
            <p>&copy; 2025 Universitas Lampung. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>);
}
