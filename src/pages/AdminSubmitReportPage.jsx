import { useRef, useState } from "react";
import { Send, AlertCircle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner@2.0.3";
import ReCAPTCHA from "react-google-recaptcha";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { useTickets } from "../hooks/useTickets";
import { useCategories, useReporterTypes } from "../hooks/useMasterData";
import { reportSectionBackgroundStyle, TicketCopyButton } from "./landingShared.jsx";

export function AdminSubmitReportPage() {
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
  const [recaptchaToken, setRecaptchaToken] = useState("");
  const recaptchaRef = useRef(null);

  const recaptchaSiteKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  const { categories, loading: categoriesLoading, error: categoriesError } = useCategories();
  const { reporterTypes, loading: reporterTypesLoading, error: reporterTypesError } = useReporterTypes();
  const { createAdminTicket } = useTickets({}, { skipInitialFetch: true });

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!validTypes.includes(file.type)) {
      toast.error("Format file tidak valid", {
        description: "Hanya file JPEG, JPG, dan PNG yang diperbolehkan",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Ukuran file terlalu besar", {
        description: "Maksimal ukuran file adalah 2 MB",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
      return;
    }

    setFormData((prev) => ({ ...prev, file }));
    const reader = new FileReader();
    reader.onloadend = () => setFilePreview(reader.result?.toString() || "");
    reader.readAsDataURL(file);
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
    setRecaptchaToken("");
    recaptchaRef.current?.reset?.();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!recaptchaSiteKey) {
      toast.error("Captcha belum dikonfigurasi", {
        description: "Hubungi admin untuk mengatur reCAPTCHA site key.",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
      return;
    }

    if (!recaptchaToken) {
      toast.error("Silakan verifikasi captcha", {
        description: "Centang reCAPTCHA sebelum membuat tiket.",
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
      return;
    }

    if (!formData.name) {
      toast.error("Nama wajib diisi", { icon: <AlertCircle size={20} className="text-[#F472B6]" /> });
      return;
    }
    if (!formData.reporter_type_id) {
      toast.error("Status wajib dipilih", { icon: <AlertCircle size={20} className="text-[#F472B6]" /> });
      return;
    }
    if (!formData.category_id) {
      toast.error("Kategori wajib dipilih", { icon: <AlertCircle size={20} className="text-[#F472B6]" /> });
      return;
    }
    if (!formData.link) {
      toast.error("Link Situs wajib diisi", { icon: <AlertCircle size={20} className="text-[#F472B6]" /> });
      return;
    }
    if (!formData.notes) {
      toast.error("Catatan wajib diisi", { icon: <AlertCircle size={20} className="text-[#F472B6]" /> });
      return;
    }

    setIsSubmitting(true);
    try {
      const normalizedLink = formData.link?.match(/^https?:\/\//i) ? formData.link : `https://${formData.link}`;
      const payload = {
        name: formData.name,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        reporter_type_id: formData.reporter_type_id,
        category_id: formData.category_id,
        link_site: normalizedLink,
        description: formData.notes,
        attachments: formData.file ? [formData.file] : [],
        recaptcha_token: recaptchaToken,
      };

      const result = await createAdminTicket(payload);
      toast.success("Tiket berhasil dibuat dan ditugaskan ke Anda", {
        description: (
          <div className="flex items-center gap-3">
            <span className="select-text">
              ID Tiket: <span className="font-semibold">{result.ticket_id}</span>
            </span>
            <TicketCopyButton ticketId={result.ticket_id} />
          </div>
        ),
        icon: <CheckCircle2 size={20} className="text-[#16A34A]" />,
        duration: 8000,
      });
      handleReset();
    } catch (error) {
      const errorMessage = error?.response?.data?.message || error?.message || "Terjadi kesalahan saat membuat tiket";
      toast.error("Gagal membuat tiket", {
        description: errorMessage,
        icon: <AlertCircle size={20} className="text-[#F472B6]" />,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="relative py-16" style={reportSectionBackgroundStyle}>
      <div className="absolute inset-0 bg-[#020617]/30" aria-hidden="true" />
      <div className="relative max-w-3xl mx-auto px-6">
        <div className="text-center mb-8">
          <h1 className="text-3xl text-white mb-3">Buat Tiket Baru</h1>
          <p className="text-base text-white/80">Form ini sama seperti halaman kirim aduan, dan tiket akan otomatis ditugaskan ke Anda</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
          <div className="bg-gradient-to-r from-[#003D82] to-[#002855] px-6 py-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                <Send size={24} className="text-[#003D82]" />
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
              <Label htmlFor="name" className="text-sm">
                Nama <span className="text-[#F472B6]">*</span>
              </Label>
              <Input
                id="name"
                placeholder="Masukkan nama lengkap"
                value={formData.name}
                onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
                className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="status" className="text-sm">
                Status <span className="text-[#F472B6]">*</span>
              </Label>
              <Select
                value={formData.reporter_type_id || ""}
                onValueChange={(value) => {
                  if (!value || value === "loading" || value === "error" || value === "empty") return;
                  setFormData((prev) => ({ ...prev, reporter_type_id: value }));
                }}
              >
                <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg h-10 hover:bg-white hover:border-[#003D82] transition-all text-sm">
                  <SelectValue placeholder="Pilih status" />
                </SelectTrigger>
                <SelectContent className="rounded-lg">
                  {reporterTypesLoading ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : reporterTypesError ? (
                    <SelectItem value="error" disabled>
                      Error loading data
                    </SelectItem>
                  ) : Array.isArray(reporterTypes) && reporterTypes.length > 0 ? (
                    reporterTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id.toString()}>
                        {type.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="empty" disabled>
                      Tidak ada data
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-sm">
                No HP
              </Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08xx xxxx xxxx"
                value={formData.phone}
                onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
                className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={formData.email}
                onChange={(event) => setFormData((prev) => ({ ...prev, email: event.target.value }))}
                className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="category" className="text-sm">
              Kategori <span className="text-[#F472B6]">*</span>
            </Label>
            <Select
              value={formData.category_id || ""}
              onValueChange={(value) => {
                if (!value || value === "loading" || value === "error" || value === "empty") return;
                setFormData((prev) => ({ ...prev, category_id: value }));
              }}
            >
              <SelectTrigger className="bg-gray-50 border-gray-300 rounded-lg h-10 hover:bg-white hover:border-[#003D82] transition-all text-sm">
                <SelectValue placeholder="Pilih kategori laporan" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {categoriesLoading ? (
                  <SelectItem value="loading" disabled>
                    Loading...
                  </SelectItem>
                ) : categoriesError ? (
                  <SelectItem value="error" disabled>
                    Error loading data
                  </SelectItem>
                ) : Array.isArray(categories) && categories.length > 0 ? (
                  categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="empty" disabled>
                    Tidak ada data
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="link" className="text-sm">
              Link Situs <span className="text-[#F472B6]">*</span>
            </Label>
            <Input
              id="link"
              type="url"
              placeholder="https://example.com"
              value={formData.link}
              onChange={(event) => setFormData((prev) => ({ ...prev, link: event.target.value }))}
              className="bg-gray-50 border-gray-300 rounded-lg h-10 focus:bg-white focus:border-[#003D82] transition-all text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes" className="text-sm">
              Catatan <span className="text-[#F472B6]">*</span>
            </Label>
            <Textarea
              id="notes"
              placeholder="Jelaskan secara rinci masalah Anda..."
              value={formData.notes}
              onChange={(event) => setFormData((prev) => ({ ...prev, notes: event.target.value }))}
              rows={4}
              className="bg-gray-50 border-gray-300 rounded-lg focus:bg-white focus:border-[#003D82] transition-all resize-none text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="file" className="text-sm">
              Lampiran
            </Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <label
                  htmlFor="file-upload"
                  className="px-4 py-2 bg-[#003D82] hover:bg-[#002855] text-white rounded-lg cursor-pointer transition-all shadow-md text-sm"
                >
                  Pilih File
                </label>
                <span className="text-xs text-[#6B7280]">{formData.file ? formData.file.name : "Tidak ada file yang dipilih"}</span>
                <input
                  id="file-upload"
                  type="file"
                  accept="image/jpeg,image/jpg,image/png"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-[#6B7280]">File JPEG, JPG, PNG maksimal 2 MB</p>

              {filePreview && (
                <div className="mt-3 p-4 bg-gray-50 border-2 border-gray-200 rounded-xl">
                  <p className="text-xs text-[#2D3748] mb-3">Preview Gambar:</p>
                  <img
                    src={filePreview}
                    alt="Preview"
                    className="max-w-full max-h-[200px] object-contain rounded-lg border-2 border-gray-300 shadow-lg"
                  />
                </div>
              )}
            </div>
          </div>

            <div className="flex gap-4 pt-4">
              <Button type="button" onClick={handleReset} variant="outline" className="border-2 border-gray-300 text-[#6B7280] hover:bg-gray-50 rounded-xl h-12 px-8">
                Reset
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 bg-gradient-to-r from-[#003D82] to-[#002855] hover:from-[#002855] hover:to-[#001a3d] text-white rounded-lg h-10 shadow-lg text-sm"
              >
                <Send size={16} className="mr-2" />
                {isSubmitting ? "Menyimpan..." : "Buat Tiket"}
              </Button>
            </div>

            <div className="pt-2">
              <Label className="text-sm">
                Verifikasi Captcha <span className="text-[#F472B6]">*</span>
              </Label>
              <div className="mt-2">
                {recaptchaSiteKey ? (
                  <ReCAPTCHA
                    ref={recaptchaRef}
                    sitekey={recaptchaSiteKey}
                    onChange={(token) => setRecaptchaToken(token || "")}
                    onExpired={() => setRecaptchaToken("")}
                  />
                ) : (
                  <p className="text-xs text-[#6B7280]">reCAPTCHA belum dikonfigurasi.</p>
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
