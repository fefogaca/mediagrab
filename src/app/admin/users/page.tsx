"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@frontend/components/ui/card";
import { Button } from "@frontend/components/ui/button";
import { Input } from "@frontend/components/ui/input";
import { Label } from "@frontend/components/ui/label";
import { Badge } from "@frontend/components/ui/badge";
import { Avatar, AvatarFallback } from "@frontend/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@frontend/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@frontend/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@frontend/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@frontend/components/ui/select";
import { toast } from "sonner";
import {
  Search,
  MoreHorizontal,
  UserPlus,
  Shield,
  Trash2,
  Users,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

interface User {
  id: string;
  email: string;
  name: string;
  username?: string;
  role: string;
  plan: string;
  isActive: boolean;
  created_at?: string;
  lastLoginAt?: string;
}

export default function UsersPage() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    role: "user",
    plan: "free",
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/admin/users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Erro ao buscar usuários:", error);
      toast.error(t.admin.users.errorLoading);
    } finally {
      setLoading(false);
    }
  };

  const createUser = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error(t.admin.users.fillAllFields);
      return;
    }

    if (newUser.password.length < 8) {
      toast.error(t.admin.users.passwordMinLength);
      return;
    }

    setCreating(true);
    try {
      const response = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newUser),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || t.admin.users.errorCreating);
      }

      toast.success(t.admin.users.userCreated);
      setDialogOpen(false);
      setNewUser({ name: "", email: "", password: "", role: "user", plan: "free" });
      fetchUsers();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t.admin.users.errorCreating);
    } finally {
      setCreating(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm(t.admin.users.deleteConfirm)) return;
    
    try {
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: "DELETE",
      });
      
      if (!response.ok) throw new Error(t.admin.users.errorDeletingGeneric);
      
      toast.success(t.admin.users.userDeleted);
      fetchUsers();
    } catch {
      toast.error(t.admin.users.errorDeleting);
    }
  };

  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(search.toLowerCase()) ||
    user.email?.toLowerCase().includes(search.toLowerCase())
  );

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/30">{t.admin.users.roleAdmin}</Badge>;
      case "user":
        return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/30">{t.admin.users.roleUser}</Badge>;
      default:
        return <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/30">{t.admin.users.roleGuest}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors: Record<string, string> = {
      free: "bg-zinc-500/10 text-zinc-400 border-zinc-500/30",
      developer: "bg-blue-500/10 text-blue-400 border-blue-500/30",
      startup: "bg-purple-500/10 text-purple-400 border-purple-500/30",
      enterprise: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    };
    return <Badge className={colors[plan] || colors.free}>{plan}</Badge>;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 bg-zinc-800 rounded w-48 animate-pulse" />
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-zinc-800 rounded animate-pulse" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{t.admin.users.title}</h1>
          <p className="text-zinc-400 mt-1">{t.admin.users.manageUsers}</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white">
              <UserPlus className="h-4 w-4 mr-2" />
              {t.admin.users.newUser}
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-zinc-900 border-zinc-800">
            <DialogHeader>
              <DialogTitle className="text-white">{t.admin.users.createUser}</DialogTitle>
              <DialogDescription className="text-zinc-400">
                {t.admin.users.createUserDesc}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.admin.users.nameLabel}</Label>
                <Input
                  placeholder={t.admin.users.namePlaceholder}
                  value={newUser.name}
                  onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.admin.users.emailLabel}</Label>
                <Input
                  type="email"
                  placeholder={t.admin.users.emailPlaceholder}
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-zinc-300">{t.admin.users.passwordLabel}</Label>
                <Input
                  type="password"
                  placeholder={t.admin.users.passwordPlaceholder}
                  value={newUser.password}
                  onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                  className="bg-zinc-800/50 border-zinc-700 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.users.roleLabel}</Label>
                  <Select
                    value={newUser.role}
                    onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="user">{t.admin.users.roleUser}</SelectItem>
                      <SelectItem value="admin">{t.admin.users.roleAdmin}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-zinc-300">{t.admin.users.planLabel}</Label>
                  <Select
                    value={newUser.plan}
                    onValueChange={(value) => setNewUser({ ...newUser, plan: value })}
                  >
                    <SelectTrigger className="bg-zinc-800/50 border-zinc-700 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-900 border-zinc-800">
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="developer">Developer</SelectItem>
                      <SelectItem value="startup">Startup</SelectItem>
                      <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setDialogOpen(false)} className="text-zinc-400">
                {t.admin.users.cancel}
              </Button>
              <Button onClick={createUser} disabled={creating} className="bg-emerald-600 hover:bg-emerald-500">
                {creating ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {t.admin.users.creating}
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    {t.admin.users.createUserBtn}
                  </>
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.common.name}</p>
              <p className="text-xl font-bold text-white">{users.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-red-500/10">
              <Shield className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.users.stats.admins}</p>
              <p className="text-xl font-bold text-white">
                {users.filter(u => u.role === "admin").length}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="p-3 rounded-lg bg-blue-500/10">
              <Users className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-zinc-400">{t.admin.users.stats.commonUsers}</p>
              <p className="text-xl font-bold text-white">
                {users.filter(u => u.role === "user").length}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Users Table */}
      <Card className="bg-zinc-900/50 border-zinc-800">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-white">{t.admin.users.table.userList}</CardTitle>
              <CardDescription className="text-zinc-400">
                {filteredUsers.length} {t.admin.users.table.usersFound}
              </CardDescription>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
              <Input
                placeholder={t.admin.users.searchUser}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-zinc-800/50 border-zinc-700 text-white placeholder:text-zinc-500"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-zinc-800 hover:bg-transparent">
                <TableHead className="text-zinc-400">{t.admin.users.table.user}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.users.roleLabel}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.users.table.plan}</TableHead>
                <TableHead className="text-zinc-400">{t.admin.users.table.createdAt}</TableHead>
                <TableHead className="text-zinc-400 text-right">{t.admin.users.table.actions}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow key="no-users">
                  <TableCell colSpan={5} className="text-center text-zinc-500 py-8">
                    {t.admin.users.table.noUsersFound}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/30">
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                          <AvatarFallback className="bg-zinc-700 text-white">
                            {user.name?.charAt(0).toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-white">{user.name}</p>
                          <p className="text-sm text-zinc-500">{user.email}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{getPlanBadge(user.plan)}</TableCell>
                    <TableCell className="text-zinc-400">
                      {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-zinc-900 border-zinc-800">
                          <DropdownMenuItem 
                            className="text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                            onClick={() => deleteUser(user.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t.admin.users.actions.delete}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
