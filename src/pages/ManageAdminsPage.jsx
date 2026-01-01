import { useEffect, useMemo, useState } from "react";
import { Plus, Pencil, Trash2, Loader2, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Alert, AlertDescription } from "../components/ui/alert";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "../components/ui/alert-dialog";
import { useUsers, useFaculties } from "../hooks/useMasterData";
import { toast } from "sonner@2.0.3";
import { handleApiError } from "../lib/api";

const ROLE_OPTIONS = [
    { value: "admin_fakultas", label: "Admin Fakultas" },
    { value: "super_admin", label: "Super Admin" },
];

const roleLabel = (role) => {
    const found = ROLE_OPTIONS.find((option) => option.value === role);
    return found ? found.label : role;
};

const initialFormState = {
    name: "",
    email: "",
    role: "admin_fakultas",
    faculty_id: "",
    password: "",
};

export function ManageAdminsPage() {
    const [roleFilter, setRoleFilter] = useState("admin_fakultas");
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formState, setFormState] = useState(initialFormState);
    const [editingUser, setEditingUser] = useState(null);
    const [deleteTarget, setDeleteTarget] = useState(null);

    const filterParam = roleFilter === "all" ? undefined : roleFilter;
    const { users, loading, error, createUser, updateUser, deleteUser } = useUsers(filterParam);
    const { faculties, loading: facultiesLoading } = useFaculties();

    useEffect(() => {
        if (error) {
            toast.error("Gagal memuat data admin", { description: error });
        }
    }, [error]);

    const filteredUsers = useMemo(() => users || [], [users]);

    const resetForm = () => {
        setFormState(initialFormState);
        setEditingUser(null);
    };

    const openCreateForm = () => {
        resetForm();
        setIsFormOpen(true);
    };

    const openEditForm = (user) => {
        setEditingUser(user);
        setFormState({
            name: user.name || "",
            email: user.email || "",
            role: user.role || "admin_fakultas",
            faculty_id: user.faculty_id || "",
            password: "",
        });
        setIsFormOpen(true);
    };

    const closeForm = () => {
        setIsFormOpen(false);
        resetForm();
    };

    const handleFormChange = (field, value) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const validateForm = () => {
        if (!formState.name.trim() || !formState.email.trim()) {
            toast.error("Nama dan email wajib diisi");
            return false;
        }

        if (!editingUser && !formState.password) {
            toast.error("Password default wajib diisi");
            return false;
        }

        if (formState.password && formState.password.length < 8) {
            toast.error("Password minimal 8 karakter");
            return false;
        }

        if (formState.role === "admin_fakultas" && !formState.faculty_id) {
            toast.error("Pilih fakultas untuk admin fakultas");
            return false;
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);
        const payload = {
            name: formState.name.trim(),
            email: formState.email.trim(),
            role: formState.role,
            faculty_id: formState.role === "admin_fakultas" ? formState.faculty_id : null,
        };
        if (formState.password) {
            payload.password = formState.password;
        }

        try {
          if (editingUser) {
            await updateUser(editingUser.id, payload);
            toast.success("Admin berhasil diperbarui");
          }
          else {
            await createUser(payload);
            toast.success("Admin berhasil ditambahkan");
          }
          closeForm();
        }
        catch (submissionError) {
          toast.error("Gagal menyimpan admin", {
            description: handleApiError(submissionError),
          });
        }
        finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!deleteTarget) {
            return;
        }
        try {
          await deleteUser(deleteTarget.id);
          toast.success("Admin berhasil dihapus");
        }
        catch (deleteError) {
          toast.error("Gagal menghapus admin", {
            description: handleApiError(deleteError),
          });
        }
        finally {
            setDeleteTarget(null);
        }
    };

    return (<div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="white-card bg-white px-6 py-5 rounded-2xl shadow-sm space-y-1 w-full sm:w-fit sm:max-w-lg">
          <h1 className="text-foreground text-xl font-semibold">Manajemen Admin</h1>
          <p className="text-sm text-muted-foreground">
            Tambah, ubah, dan hapus admin super maupun fakultas
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter per role"/>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin_fakultas">Admin Fakultas</SelectItem>
              <SelectItem value="super_admin">Super Admin</SelectItem>
              <SelectItem value="all">Semua Admin</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={openCreateForm} className="bg-[#003D82] hover:bg-[#002855]">
            <Plus size={16}/>
            Tambah Admin
          </Button>
        </div>
      </div>

      {isFormOpen && (<Card>
          <CardHeader>
            <CardTitle>{editingUser ? "Edit Admin" : "Tambah Admin Baru"}</CardTitle>
            <CardDescription>
              {editingUser ? "Perbarui data admin" : "Isi detail untuk menambahkan admin"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="admin-name">Nama</Label>
                <Input id="admin-name" placeholder="Nama lengkap" value={formState.name} onChange={(e) => handleFormChange("name", e.target.value)}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-email">Email</Label>
                <Input id="admin-email" type="email" placeholder="admin@kampus.ac.id" value={formState.email} onChange={(e) => handleFormChange("email", e.target.value)}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-role">Role</Label>
                <Select value={formState.role} onValueChange={(value) => handleFormChange("role", value)}>
                  <SelectTrigger id="admin-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((option) => (<SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password {editingUser ? "(opsional)" : "default"}</Label>
                <Input id="admin-password" type="password" placeholder={editingUser ? "Biarkan kosong jika tidak diubah" : "Minimal 8 karakter"} value={formState.password} onChange={(e) => handleFormChange("password", e.target.value)}/>
              </div>
              {formState.role === "admin_fakultas" && (<div className="space-y-2 md:col-span-2">
                  <Label htmlFor="admin-faculty">Fakultas</Label>
                  <Select value={formState.faculty_id || undefined} onValueChange={(value) => handleFormChange("faculty_id", value)} disabled={facultiesLoading}>
                    <SelectTrigger id="admin-faculty">
                      <SelectValue placeholder={facultiesLoading ? "Memuat fakultas..." : "Pilih fakultas"}/>
                    </SelectTrigger>
                    <SelectContent>
                      {facultiesLoading ? (<SelectItem value="loading" disabled>
                          Memuat data...
                        </SelectItem>) : faculties && faculties.length > 0 ? (faculties.map((faculty) => (<SelectItem key={faculty.id} value={faculty.id}>
                            {faculty.name}
                          </SelectItem>))) : (<SelectItem value="empty" disabled>
                          Belum ada fakultas terdaftar
                        </SelectItem>)}
                  </SelectContent>
                </Select>
                </div>)}
            </div>
            <div className="flex items-center gap-3">
              <Button disabled={isSubmitting} onClick={handleSubmit} className="bg-[#003D82] hover:bg-[#002855]">
                {isSubmitting ? (<Loader2 className="animate-spin" size={18}/>) : (<ShieldCheck size={18}/>)}
                {editingUser ? "Simpan Perubahan" : "Simpan"}
              </Button>
              <Button variant="ghost" onClick={closeForm} disabled={isSubmitting}>
                Batal
              </Button>
            </div>
          </CardContent>
        </Card>)}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Admin</CardTitle>
          <CardDescription>
            {filteredUsers.length} admin ditemukan
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (<div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="animate-spin mb-3" size={32}/>
              Memuat data admin...
            </div>) : filteredUsers.length === 0 ? (<div className="py-12 text-center text-muted-foreground">
              Belum ada admin untuk filter ini
            </div>) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground border-b">
                    <th className="py-3">Nama</th>
                    <th className="py-3">Email</th>
                    <th className="py-3">Role</th>
                    <th className="py-3">Fakultas</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (<tr key={user.id} className="border-b last:border-0">
                      <td className="py-3">
                        <div className="font-medium text-foreground">{user.name}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-muted-foreground">{user.email}</div>
                      </td>
                      <td className="py-3">
                        <Badge className="bg-[#E0ECFF] text-[#003D82] border-[#BBD2FF]">
                          {roleLabel(user.role)}
                        </Badge>
                      </td>
                      <td className="py-3 text-sm text-muted-foreground">
                        {user.role === "admin_fakultas" ? user.faculty?.name || "-" : "-"}
                      </td>
                      <td className="py-3">
                        <Badge className={user.is_active ? "bg-[#DCFCE7] text-[#166534] border-[#A7F3D0]" : "bg-[#FEE2E2] text-[#B91C1C] border-[#FECACA]"}>
                          {user.is_active ? "Aktif" : "Nonaktif"}
                        </Badge>
                      </td>
                      <td className="py-3">
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => openEditForm(user)}>
                            <Pencil size={16}/>
                            Edit
                          </Button>
                          <Button variant="destructive" size="sm" onClick={() => setDeleteTarget(user)}>
                            <Trash2 size={16}/>
                            Hapus
                          </Button>
                        </div>
                      </td>
                    </tr>))}
                </tbody>
              </table>
            </div>)}
        </CardContent>
      </Card>

      <Alert>
        <AlertDescription className="text-sm">
          Untuk alasan keamanan, hanya super admin yang dapat mengelola akun admin.
        </AlertDescription>
      </Alert>

      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => {
            if (!open) {
                setDeleteTarget(null);
            }
        }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus admin?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Admin "{deleteTarget?.name}" akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>);
}
