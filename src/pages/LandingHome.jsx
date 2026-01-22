import { useNavigate } from "react-router-dom";
import { Shield, Search, Send, Target, Award, Users, Lock, FileText, CheckCircle2, AlertCircle } from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";

export function LandingHome() {
  const navigate = useNavigate();

  return (
    <div>
      <section className="relative bg-gradient-to-br from-[#003D82] via-[#00488E] to-[#002E5B] overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#003D82] rounded-full blur-3xl" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#003D82] rounded-full blur-3xl" />
        </div>

        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)",
            backgroundSize: "50px 50px",
          }}
        />

        <div className="relative max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-4 relative z-10 min-w-0">
              <div className="inline-block">
                <Badge className="bg-white text-[#003D82] border-0 px-4 py-2 rounded-full shadow-lg text-sm">
                  <Shield size={16} className="mr-2" />
                  Platform Resmi Universitas Lampung
                </Badge>
              </div>

              <div className="space-y-4">
                <h1 className="text-3xl sm:text-4xl text-white leading-tight">
                  Wujudkan Kampus Digital yang
                  <span className="block text-white mt-2">Aman & Beretika</span>
                </h1>

                <p className="text-lg text-white/90 leading-relaxed">
                  Sistem pelaporan konten terintegrasi untuk menjaga integritas dan reputasi sivitas akademika Universitas Lampung
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 w-full max-w-[640px]">
                <Button
                  onClick={() => navigate("/kirim-laporan")}
                  className="w-full bg-white text-[#003D82] px-6 h-12 rounded-xl shadow-2xl transition-transform duration-200 hover:bg-gray-100 hover:scale-105 focus-visible:scale-105 active:bg-[#003D82] active:text-white active:scale-95"
                >
                  <Send size={20} className="mr-2" />
                  <span className="text-base">Laporkan Sekarang</span>
                </Button>
                <Button
                  onClick={() => navigate("/cek-status")}
                  variant="outline"
                  className="w-full bg-white/80 text-[#003D82] border-2 border-white px-6 h-12 rounded-xl transition-transform duration-200 hover:bg-white hover:scale-105 focus-visible:scale-105 active:bg-[#003D82] active:text-white active:border-[#003D82] active:scale-95"
                >
                  <Search size={20} className="mr-2" />
                  <span className="text-base">Cek Status</span>
                </Button>
              </div>
            </div>

            <div className="relative hidden lg:block min-w-0">
              <div className="flex items-center justify-center">
                <img src="/src/assets/unila-logo.png" alt="Logo Universitas Lampung" className="w-full max-w-[720px] h-[560px] object-contain" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-10">
            <div className="inline-block mb-4">
              <div className="bg-gradient-to-r from-[#003D82] to-[#002E5B] text-white px-4 py-2 rounded-full">
                <span className="text-base">Tentang Platform</span>
              </div>
            </div>
            <h2 className="text-3xl text-[#2D3748] mb-4">
              Menjaga Integritas Digital
              <br />
              <span className="text-[#003D82]">Universitas Lampung</span>
            </h2>
            <p className="text-base text-[#6B7280] max-w-3xl mx-auto leading-relaxed">
              Platform terpadu yang dirancang khusus untuk mengelola laporan konten bermasalah dan melindungi reputasi institusi serta seluruh sivitas akademika
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Target size={28} className="text-[#003D82]" />
              </div>
              <h3 className="text-xl text-white mb-3">Visi</h3>
              <p className="text-sm text-white/90 leading-relaxed">
                Menjadi sistem pelaporan konten terdepan yang menciptakan ekosistem digital kampus yang aman, etis, dan produktif bagi seluruh sivitas akademika Universitas Lampung.
              </p>
            </div>

            <div className="bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-2xl p-6 text-white shadow-xl transform hover:scale-105 transition-transform">
              <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center mb-4 shadow-lg">
                <Award size={28} className="text-[#003D82]" />
              </div>
              <h3 className="text-xl mb-3 text-white">Misi</h3>
              <p className="text-sm leading-relaxed text-white/90">
                Menyediakan saluran pelaporan yang mudah, cepat, dan terpercaya untuk menangani konten bermasalah dengan profesionalisme tinggi dan menjunjung nilai-nilai integritas akademik.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                <Shield size={24} className="text-white" />
              </div>
              <h4 className="text-lg text-[#2D3748] mb-2">Keamanan Data</h4>
              <p className="text-sm text-[#6B7280] leading-relaxed">Dilindungi dengan enkripsi tingkat enterprise dan sistem keamanan berlapis untuk menjaga kerahasiaan pelapor</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                <Users size={24} className="text-white" />
              </div>
              <h4 className="text-lg text-[#2D3748] mb-2">Tim Profesional</h4>
              <p className="text-sm text-[#6B7280] leading-relaxed">Ditangani oleh tim verifikasi berpengalaman dari berbagai fakultas di Universitas Lampung</p>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-lg border-t-4 border-[#003D82] hover:shadow-xl transition-shadow">
              <div className="w-12 h-12 bg-gradient-to-br from-[#003D82] to-[#002E5B] rounded-xl flex items-center justify-center mb-4">
                <Lock size={24} className="text-white" />
              </div>
              <h4 className="text-lg text-[#2D3748] mb-2">Transparansi</h4>
              <p className="text-sm text-[#6B7280] leading-relaxed">Pemantauan status real-time dan notifikasi otomatis untuk setiap tahapan penanganan laporan</p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-br from-[#003D82] via-[#00488E] to-[#002E5B] relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-[#003D82] rounded-full opacity-20 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-[#003D82] rounded-full opacity-20 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg">
                  <FileText size={24} className="text-[#003D82]" />
                </div>
                <h3 className="text-xl text-white">Cakupan Platform</h3>
              </div>
              <ul className="space-y-3">
                {["Semua fakultas dan unit kerja di Universitas Lampung", "Platform media sosial resmi universitas", "Website dan sistem informasi akademik", "Konten digital lainnya yang melibatkan sivitas akademika"].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-white rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md">
                      <CheckCircle2 size={14} className="text-[#003D82]" />
                    </div>
                    <span className="text-sm text-white/90">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl p-6 shadow-xl">
              <h3 className="text-xl text-[#2D3748] mb-6">Jenis Laporan</h3>
              <ul className="space-y-4">
                {[
                  { icon: AlertCircle, title: "Konten Tidak Pantas", desc: "Konten yang melanggar norma dan etika akademik", color: "from-red-500 to-red-600" },
                  { icon: AlertCircle, title: "Spam & Pelecehan", desc: "Konten spam atau yang melecehkan pihak lain", color: "from-orange-500 to-orange-600" },
                  { icon: AlertCircle, title: "Pelanggaran Hak Cipta", desc: "Konten yang melanggar hak kekayaan intelektual", color: "from-[#003D82] to-[#002E5B]" },
                  { icon: AlertCircle, title: "Informasi Menyesatkan", desc: "Hoaks atau informasi yang tidak akurat", color: "from-green-500 to-green-600" },
                ].map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <div className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-lg flex items-center justify-center flex-shrink-0 shadow-md`}>
                      <item.icon size={18} className="text-white" />
                    </div>
                    <div>
                      <h5 className="text-base text-[#2D3748] mb-1">{item.title}</h5>
                      <p className="text-xs text-[#6B7280]">{item.desc}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

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
              { step: "04", title: "Selesai", desc: "Dapatkan notifikasi hasil dan tindak lanjut", icon: CheckCircle2, color: "from-[#003D82] to-[#002E5B]" },
            ].map((item, index) => (
              <div key={index} className="relative group">
                <div className="bg-white border-2 border-gray-200 rounded-xl p-6 text-center shadow-lg hover:shadow-xl hover:border-[#003D82] transition-all">
                  <div className={`w-14 h-14 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                    <item.icon size={24} className="text-white" />
                  </div>
                  <div className={`text-3xl bg-gradient-to-br ${item.color} bg-clip-text text-transparent mb-3`}>{item.step}</div>
                  <h4 className="text-base text-[#2D3748] mb-2">{item.title}</h4>
                  <p className="text-sm text-[#6B7280]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
