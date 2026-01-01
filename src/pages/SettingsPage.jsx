import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { toast } from "sonner@2.0.3";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { authService } from "../lib/auth";
import apiClient, { handleApiError } from "../lib/api";
import { useFaculties } from "../hooks/useMasterData";
export function SettingsPage({ userName, userEmail, userRole, fakultasName, onUpdateProfile, onDeleteAccount, defaultTab = "profile" }) {
    const [name, setName] = useState(userName);
    const [email, setEmail] = useState(userEmail);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [adminName, setAdminName] = useState("");
    const [adminEmail, setAdminEmail] = useState("");
    const [adminFacultyId, setAdminFacultyId] = useState("");
    const [adminPassword, setAdminPassword] = useState("");
    const [isAssigningAdmin, setIsAssigningAdmin] = useState(false);
    const { faculties, loading: facultiesLoading } = useFaculties();
    const handleSaveProfile = () => {
        if (!name.trim() || !email.trim()) {
            toast.error("Nama dan email harus diisi");
            return;
        }
        if (onUpdateProfile) {
            onUpdateProfile(name, email);
        }
        toast.success("Profil berhasil diperbarui");
    };
    const handleChangePassword = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error("Semua field harus diisi");
            return;
        }
        if (newPassword !== confirmPassword) {
            toast.error("Password baru dan konfirmasi tidak cocok");
            return;
        }
        if (newPassword.length < 8) {
            toast.error("Password minimal 8 karakter");
            return;
        }
        
        setIsChangingPassword(true);
        try {
            const response = await authService.changePassword({
                current_password: currentPassword,
                new_password: newPassword,
                new_password_confirmation: confirmPassword
            });
            
            toast.success("Password berhasil diubah. Silakan login kembali.");
            
            // Clear form
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            
            // Logout dan redirect ke login setelah 2 detik
            setTimeout(async () => {
                await authService.logout();
                window.location.href = '/login';
            }, 2000);
        } catch (error) {
            console.error('Change password error:', error);
            const errorMessage = error.response?.data?.message 
                || error.response?.data?.errors?.current_password?.[0]
                || "Gagal mengubah password";
            toast.error(errorMessage);
        } finally {
            setIsChangingPassword(false);
        }
    };
    const handleDeleteAccount = () => {
        if (onDeleteAccount) {
            onDeleteAccount();
        }
    };

    const resetAssignAdminForm = () => {
      setAdminName("");
      setAdminEmail("");
      setAdminFacultyId("");
      setAdminPassword("");
    };

    const handleAssignAdmin = async () => {
      if (!adminName.trim() || !adminEmail.trim() || !adminFacultyId) {
        toast.error("Nama, email, dan fakultas wajib diisi");
        return;
      }

      if (!adminPassword || adminPassword.length < 8) {
        toast.error("Password default minimal 8 karakter");
        return;
      }

      setIsAssigningAdmin(true);
      try {
        await apiClient.post('/users', {
          name: adminName.trim(),
          email: adminEmail.trim(),
          password: adminPassword,
          role: 'admin_fakultas',
          faculty_id: adminFacultyId,
        });

        toast.success("Admin fakultas berhasil ditambahkan");
        resetAssignAdminForm();
      }
      catch (error) {
        toast.error(handleApiError(error));
      }
      finally {
        setIsAssigningAdmin(false);
      }
    };
    return (<div className="p-8 max-w-[1400px]">
      <div className="mb-8">
        <h1 className="text-foreground mb-2">Pengaturan</h1>
        <p className="text-muted-foreground">Kelola profil dan pengaturan akun Anda</p>
      </div>

      <Tabs defaultValue={defaultTab} className="flex gap-6">
        <TabsList className="flex-col h-fit w-48 bg-gray-50 p-2 justify-start">
          <TabsTrigger value="profile" className="w-full justify-start data-[state=active]:bg-white data-[state=active]:text-[#003D82]">
            Profil
          </TabsTrigger>
          <TabsTrigger value="password" className="w-full justify-start data-[state=active]:bg-white data-[state=active]:text-[#003D82]">
            Password
          </TabsTrigger>
          {userRole === "super-admin" && (<>
              <TabsTrigger value="manage-data" className="w-full justify-start data-[state=active]:bg-white data-[state=active]:text-[#003D82]">
                Kelola Data
              </TabsTrigger>
              <TabsTrigger value="assign-fakultas" className="w-full justify-start data-[state=active]:bg-white data-[state=active]:text-[#003D82]">
                Assign Fakultas
              </TabsTrigger>
            </>)}
        </TabsList>

        <div className="flex-1">
          <TabsContent value="profile" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Profil</CardTitle>
                <CardDescription>Perbarui nama dan alamat email Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nama</Label>
                    <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Masukkan nama Anda"/>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Masukkan email Anda"/>
                  </div>
                  {userRole === "fakultas" && fakultasName && (<div className="space-y-2">
                      <Label>Fakultas</Label>
                      <Input value={fakultasName} disabled className="bg-gray-50"/>
                    </div>)}
                </div>
                <Button onClick={handleSaveProfile} className="bg-gray-900 hover:bg-gray-800">
                  Simpan
                </Button>

                <div className="pt-6 border-t">
                  <div className="space-y-2 mb-4">
                    <h3 className="text-red-600">Hapus akun</h3>
                    <p className="text-sm text-muted-foreground">
                      Hapus akun Anda dan semua sumber dayanya
                    </p>
                  </div>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" className="bg-red-600 hover:bg-red-700">
                        <Trash2 size={16} className="mr-2"/>
                        Hapus akun
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Anda yakin?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus akun Anda secara permanen dan menghapus data Anda dari server kami.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Batal</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteAccount} className="bg-red-600 hover:bg-red-700">
                          Hapus akun
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="password" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>Ubah password akun Anda</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Password Saat Ini</Label>
                    <div className="relative">
                      <Input id="current-password" type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} placeholder="Masukkan password saat ini"/>
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {showCurrentPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">Password Baru</Label>
                    <div className="relative">
                      <Input id="new-password" type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="Masukkan password baru"/>
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {showNewPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Konfirmasi Password Baru</Label>
                    <div className="relative">
                      <Input id="confirm-password" type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Konfirmasi password baru"/>
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700">
                        {showConfirmPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                      </button>
                    </div>
                  </div>
                </div>
                <Alert>
                  <AlertDescription className="text-sm">
                    Password harus minimal 8 karakter dan mengandung kombinasi huruf dan angka untuk keamanan yang lebih baik.
                  </AlertDescription>
                </Alert>
                <Button 
                  onClick={handleChangePassword} 
                  disabled={isChangingPassword}
                  className="bg-gray-900 hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed">
                  {isChangingPassword ? "Mengubah..." : "Ubah Password"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {userRole === "super-admin" && (<>
              <TabsContent value="manage-data" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Kelola Data</CardTitle>
                    <CardDescription>Ekspor dan impor data sistem</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <h3>Ekspor Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Unduh semua data tiket dalam format CSV atau JSON
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" onClick={() => toast.success("Data berhasil diekspor sebagai CSV")}>
                            Ekspor sebagai CSV
                          </Button>
                          <Button variant="outline" onClick={() => toast.success("Data berhasil diekspor sebagai JSON")}>
                            Ekspor sebagai JSON
                          </Button>
                        </div>
                      </div>

                      <div className="border-t pt-4 space-y-2">
                        <h3>Impor Data</h3>
                        <p className="text-sm text-muted-foreground">
                          Unggah file CSV atau JSON untuk mengimpor data tiket
                        </p>
                        <div className="flex gap-2">
                          <Input type="file" accept=".csv,.json" className="max-w-xs"/>
                          <Button onClick={() => toast.success("Data berhasil diimpor")} className="bg-[#003D82] hover:bg-[#002855]">
                            Impor
                          </Button>
                        </div>
                      </div>

                      <Alert>
                        <AlertDescription className="text-sm">
                          Pastikan format file sesuai sebelum mengimpor data. Data yang tidak valid akan diabaikan.
                        </AlertDescription>
                      </Alert>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="assign-fakultas" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Assign Fakultas</CardTitle>
                    <CardDescription>Kelola akses admin fakultas</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="admin-name">Nama Admin</Label>
                        <Input
                          id="admin-name"
                          type="text"
                          placeholder="Nama lengkap admin"
                          value={adminName}
                          onChange={(e) => setAdminName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Admin</Label>
                        <Input
                          id="admin-email"
                          type="email"
                          placeholder="admin@unila.ac.id"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="fakultas-select">Fakultas</Label>
                        <Select value={adminFacultyId || undefined} onValueChange={setAdminFacultyId} disabled={facultiesLoading}>
                          <SelectTrigger id="fakultas-select">
                            <SelectValue placeholder={facultiesLoading ? "Memuat fakultas..." : "Pilih fakultas"}/>
                          </SelectTrigger>
                          <SelectContent>
                            {facultiesLoading ? (
                              <SelectItem value="loading" disabled>
                                Memuat data...
                              </SelectItem>
                            ) : faculties && faculties.length > 0 ? (
                              faculties.map((faculty) => (
                                <SelectItem key={faculty.id} value={faculty.id}>
                                  {faculty.name}
                                </SelectItem>
                              ))
                            ) : (
                              <SelectItem value="empty" disabled>
                                Tidak ada fakultas tersedia
                              </SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="admin-password">Password Default</Label>
                        <Input
                          id="admin-password"
                          type="password"
                          placeholder="Minimal 8 karakter"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                        />
                      </div>
                    </div>
                    <Alert>
                      <AlertDescription className="text-sm">
                        Admin fakultas akan menerima email notifikasi dengan kredensial login mereka.
                      </AlertDescription>
                    </Alert>
                    <Button
                      onClick={handleAssignAdmin}
                      className="bg-[#003D82] hover:bg-[#002855]"
                      disabled={isAssigningAdmin}
                    >
                      {isAssigningAdmin ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="animate-spin" size={16} />
                          Menambahkan...
                        </span>
                      ) : (
                        'Assign Admin'
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>
            </>)}
        </div>
      </Tabs>
    </div>);
}
