import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { useAuth, AppUser, UserRole } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Plus, X, Shield, Users, UserCircle, Trash2, Key,
    Eye, EyeOff, MoreHorizontal, Edit, Search,
} from "lucide-react";
import { toast } from "sonner";

const ROLE_META: Record<UserRole, { label: string; icon: React.ElementType; color: string; bg: string; badge: string }> = {
    admin: { label: "Core Admin", icon: Shield, color: "text-primary", bg: "bg-primary/10", badge: "bg-primary/10 text-primary" },
    controller: { label: "Controller", icon: Users, color: "text-violet-600", bg: "bg-violet-100 dark:bg-violet-900/20", badge: "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400" },
    employee: { label: "Employee", icon: UserCircle, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/20", badge: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" },
};

const DEPARTMENTS = ["Management", "Content", "Design", "Marketing", "Analytics", "Sales", "Other"];
const ROLES_SELECTABLE: ("controller" | "employee")[] = ["controller", "employee"];

type ModalMode = "add-controller" | "add-employee" | "change-password" | "edit" | null;

const emptyUserForm = { name: "", email: "", password: "", confirmPassword: "", department: DEPARTMENTS[0], position: "", score: 80, role: "employee" as "controller" | "employee" };
const emptyPwForm = { newPw: "", confirmPw: "" };

// Outside-click hook
function useOutsideClick(ref: React.RefObject<HTMLElement>, cb: () => void) {
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) cb();
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [ref, cb]);
}

export default function UserManagementPage() {
    const { users, addUser, removeUser, updateUser, changePassword, forceResetPassword } = useAuth();

    const [modalMode, setModalMode] = useState<ModalMode>(null);
    const [editTarget, setEditTarget] = useState<AppUser | null>(null);
    const [menuOpen, setMenuOpen] = useState<string | null>(null);
    const [formError, setFormError] = useState("");
    const [userForm, setUserForm] = useState(emptyUserForm);
    const [pwForm, setPwForm] = useState(emptyPwForm);
    const [showPw, setShowPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
    const [search, setSearch] = useState("");

    // All non-admin users (controllers + employees)
    const managed = users.filter((u) => u.role !== "admin");
    const filtered = managed.filter((u) => {
        const matchRole = filterRole === "all" || u.role === filterRole;
        const term = search.toLowerCase();
        const matchSearch = !term || u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term) || (u.department ?? "").toLowerCase().includes(term) || (u.position ?? "").toLowerCase().includes(term);
        return matchRole && matchSearch;
    });

    const openAdd = (role: "controller" | "employee") => {
        setModalMode(role === "controller" ? "add-controller" : "add-employee");
        setUserForm({ ...emptyUserForm, role });
        setFormError("");
        setShowPw(false);
    };

    const openEdit = (user: AppUser) => {
        setEditTarget(user);
        setUserForm({ name: user.name, email: user.email, password: "", confirmPassword: "", department: user.department ?? DEPARTMENTS[0], position: user.position ?? "", score: (user as any).score ?? 80, role: user.role as "controller" | "employee" });
        setFormError("");
        setModalMode("edit");
        setMenuOpen(null);
    };

    const openChangePw = (user: AppUser) => {
        setEditTarget(user);
        setPwForm(emptyPwForm);
        setFormError("");
        setShowNewPw(false);
        setModalMode("change-password");
        setMenuOpen(null);
    };

    const closeModal = () => { setModalMode(null); setEditTarget(null); setFormError(""); };

    const handleAddUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!userForm.name.trim()) { setFormError("Full name is required."); return; }
        if (!userForm.email.trim()) { setFormError("Email is required."); return; }
        if (userForm.password.length < 6) { setFormError("Password must be at least 6 characters."); return; }
        if (userForm.password !== userForm.confirmPassword) { setFormError("Passwords do not match."); return; }

        const role: UserRole = modalMode === "add-controller" ? "controller" : "employee";
        const result = addUser({
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            password: userForm.password,
            role,
            department: userForm.department,
            position: userForm.position.trim() || (role === "controller" ? "Controller" : "Employee"),
        });

        if (result.success) {
            toast.success(`${ROLE_META[role].label} added!`, { description: `${userForm.name} can now sign in.` });
            closeModal();
        } else {
            setFormError(result.error ?? "Failed to add user.");
        }
    };

    const handleEditUser = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        if (!userForm.name.trim()) { setFormError("Full name is required."); return; }
        if (!userForm.email.trim()) { setFormError("Email is required."); return; }
        updateUser(editTarget.id, {
            name: userForm.name.trim(),
            email: userForm.email.trim(),
            department: userForm.department,
            position: userForm.position.trim(),
            role: userForm.role,
        });
        toast.success("User updated!", { description: userForm.name });
        closeModal();
    };

    const handleChangePw = (e: React.FormEvent) => {
        e.preventDefault();
        if (!editTarget) return;
        if (!pwForm.newPw) { setFormError("New password is required."); return; }
        if (pwForm.newPw !== pwForm.confirmPw) { setFormError("Passwords do not match."); return; }
        // Admin force-reset — no current password required
        const result = forceResetPassword(editTarget.id, pwForm.newPw);
        if (result.success) {
            toast.success("Password reset!", { description: `${editTarget.name}'s password has been updated.` });
            closeModal();
        } else {
            setFormError(result.error ?? "Failed.");
        }
    };

    const handleDelete = (user: AppUser) => {
        removeUser(user.id);
        setMenuOpen(null);
        toast.error("User removed", { description: user.name });
    };

    const controllerCount = managed.filter((u) => u.role === "controller").length;
    const employeeCount = managed.filter((u) => u.role === "employee").length;

    // Menu outside click handling
    const menuRef = useRef<HTMLDivElement>(null);
    useOutsideClick(menuRef, () => setMenuOpen(null));

    const modalTitle: Record<string, string> = {
        "add-controller": "Add New Controller",
        "add-employee": "Add New Employee",
        "edit": `Edit — ${editTarget?.name ?? ""}`,
        "change-password": `Reset Password — ${editTarget?.name ?? ""}`,
    };

    return (
        <>
            <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
                {/* Header */}
                <motion.div variants={fadeUp} className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">Users</h1>
                        <p className="mt-1 text-sm text-muted-foreground">Manage all Controllers and Employees — add accounts, edit details, reset passwords</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <Button
                            id="add-controller-btn"
                            variant="outline"
                            className="h-10 gap-2 rounded-lg px-4 text-sm font-medium text-violet-600 border-violet-200 hover:bg-violet-50 dark:hover:bg-violet-900/20"
                            onClick={() => openAdd("controller")}
                        >
                            <Plus className="h-4 w-4" /> New Controller
                        </Button>
                        <Button
                            id="add-employee-btn"
                            className="h-10 gap-2 rounded-lg px-4 text-sm font-medium"
                            onClick={() => openAdd("employee")}
                        >
                            <Plus className="h-4 w-4" /> New Employee
                        </Button>
                    </div>
                </motion.div>

                {/* Summary cards — clickable filters */}
                <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
                    {(["all", "controller", "employee"] as const).map((role) => {
                        const count = role === "all" ? managed.length : managed.filter((u) => u.role === role).length;
                        const meta = role === "all"
                            ? { label: "Total Users", icon: Shield, color: "text-foreground", bg: "bg-muted" }
                            : ROLE_META[role];
                        const Icon = meta.icon;
                        const isActive = filterRole === role;
                        return (
                            <button
                                key={role}
                                onClick={() => setFilterRole(role)}
                                className={`rounded-2xl bg-card p-4 text-left transition-all shadow-card hover:shadow-card-hover ${isActive ? "ring-2 ring-primary" : ""}`}
                            >
                                <div className={`mb-2 inline-flex rounded-xl p-2 ${meta.bg}`}>
                                    <Icon className={`h-4 w-4 ${meta.color}`} />
                                </div>
                                <p className="text-2xl font-bold text-foreground">{count}</p>
                                <p className="text-xs text-muted-foreground">{meta.label}{role !== "all" ? "s" : ""}</p>
                            </button>
                        );
                    })}
                </motion.div>

                {/* Search bar */}
                <motion.div variants={fadeUp} className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        id="user-search"
                        placeholder="Search by name, email, department…"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="h-11 rounded-lg border-0 bg-muted pl-10 text-sm"
                    />
                </motion.div>

                {/* Users table */}
                <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-visible">
                    <div className="px-5 py-4 border-b flex items-center justify-between">
                        <h2 className="text-base font-semibold text-foreground">
                            {filterRole === "all" ? "All Users" : `${ROLE_META[filterRole].label}s`}
                        </h2>
                        <span className="text-xs text-muted-foreground">{filtered.length} user{filtered.length !== 1 ? "s" : ""}</span>
                    </div>
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <UserCircle className="mb-3 h-10 w-10 text-muted-foreground/40" />
                            <p className="font-medium text-foreground">No users found</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                {search ? `No results for "${search}"` : "Use the buttons above to add a Controller or Employee."}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full">
                            <thead>
                                <tr className="border-b">
                                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">User</th>
                                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Role</th>
                                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Department</th>
                                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Position</th>
                                    <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden lg:table-cell">Added</th>
                                    <th className="px-5 py-3 w-10"></th>
                                </tr>
                            </thead>
                            <tbody>
                                <AnimatePresence mode="popLayout">
                                    {filtered.map((user) => {
                                        const meta = ROLE_META[user.role];
                                        const Icon = meta.icon;
                                        return (
                                            <motion.tr
                                                key={user.id}
                                                layout
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                exit={{ opacity: 0 }}
                                                className="border-b last:border-0 transition-colors hover:bg-muted/50"
                                            >
                                                <td className="px-5 py-3">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className={`text-xs font-medium ${meta.bg} ${meta.color}`}>
                                                                {user.name.slice(0, 2).toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="text-sm font-medium text-foreground">{user.name}</p>
                                                            <p className="text-xs text-muted-foreground">{user.email}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3 hidden sm:table-cell">
                                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${meta.badge}`}>
                                                        <Icon className="h-3 w-3" /> {meta.label}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{user.department ?? "—"}</td>
                                                <td className="px-5 py-3 text-sm text-muted-foreground hidden lg:table-cell">{user.position ?? "—"}</td>
                                                <td className="px-5 py-3 text-right text-sm text-muted-foreground hidden lg:table-cell font-tabular">
                                                    {new Date(user.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    <div className="relative inline-block" ref={menuOpen === user.id ? menuRef : null}>
                                                        <button
                                                            onClick={() => setMenuOpen(menuOpen === user.id ? null : user.id)}
                                                            className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                                                        >
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </button>
                                                        <AnimatePresence>
                                                            {menuOpen === user.id && (
                                                                <motion.div
                                                                    initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                                                    exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                                                    transition={{ duration: 0.1 }}
                                                                    className="absolute right-0 top-8 z-[200] w-44 rounded-xl border bg-card shadow-xl"
                                                                >
                                                                    <button onClick={() => openEdit(user)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-t-xl">
                                                                        <Edit className="h-3.5 w-3.5" /> Edit Details
                                                                    </button>
                                                                    <button onClick={() => openChangePw(user)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted">
                                                                        <Key className="h-3.5 w-3.5" /> Reset Password
                                                                    </button>
                                                                    <button onClick={() => handleDelete(user)} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-xl">
                                                                        <Trash2 className="h-3.5 w-3.5" /> Remove User
                                                                    </button>
                                                                </motion.div>
                                                            )}
                                                        </AnimatePresence>
                                                    </div>
                                                </td>
                                            </motion.tr>
                                        );
                                    })}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    )}
                </motion.div>

                {/* Core Admin info card */}
                <motion.div variants={fadeUp} className="rounded-2xl bg-primary/5 border border-primary/20 p-5">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                            <Shield className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-foreground">Core Admin Account (You)</p>
                            <p className="text-xs text-muted-foreground">basith@adscroll360.com — Change your own password in Settings → Change Password</p>
                        </div>
                    </div>
                </motion.div>
            </motion.div>

            {/* ── Modals ─────────────────────────────────────────── */}
            <AnimatePresence>
                {modalMode && (
                    <>
                        <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={closeModal} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />

                        <motion.div key="modal"
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            transition={{ type: "spring", stiffness: 400, damping: 30 }}
                            className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        >
                            <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
                                {/* Header */}
                                <div className="flex items-center justify-between border-b px-6 py-4">
                                    <div>
                                        <h2 className="text-base font-semibold text-foreground">{modalTitle[modalMode]}</h2>
                                        {(modalMode === "add-controller" || modalMode === "add-employee") && (
                                            <p className="text-xs text-muted-foreground mt-0.5">
                                                {modalMode === "add-controller"
                                                    ? "Controllers can manage employees and view reports."
                                                    : "Employees can track tasks, attendance, and KPIs."}
                                            </p>
                                        )}
                                    </div>
                                    <button onClick={closeModal} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>

                                {/* Add / Edit form */}
                                {(modalMode === "add-controller" || modalMode === "add-employee" || modalMode === "edit") && (
                                    <form onSubmit={modalMode === "edit" ? handleEditUser : handleAddUser} className="px-6 py-5 space-y-4">

                                        {/* Role selector in edit mode */}
                                        {modalMode === "edit" && (
                                            <div className="space-y-1.5">
                                                <Label>Role</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {ROLES_SELECTABLE.map((r) => {
                                                        const m = ROLE_META[r];
                                                        const Icon = m.icon;
                                                        return (
                                                            <button
                                                                key={r}
                                                                type="button"
                                                                onClick={() => setUserForm({ ...userForm, role: r })}
                                                                className={`flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm transition-all ${userForm.role === r ? `border-primary bg-primary/5 ${m.color} font-medium` : "border-border text-muted-foreground hover:border-primary/40"}`}
                                                            >
                                                                <Icon className="h-4 w-4" />
                                                                {m.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-3">
                                            <div className="space-y-1.5">
                                                <Label htmlFor="u-name">Full Name <span className="text-destructive">*</span></Label>
                                                <Input id="u-name" placeholder="e.g. Ahmed"
                                                    value={userForm.name}
                                                    onChange={(e) => { setUserForm({ ...userForm, name: e.target.value }); setFormError(""); }}
                                                    className="h-9" autoFocus
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label htmlFor="u-position">Position / Title</Label>
                                                <Input id="u-position" placeholder="e.g. Senior Editor"
                                                    value={userForm.position}
                                                    onChange={(e) => setUserForm({ ...userForm, position: e.target.value })}
                                                    className="h-9"
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="u-email">Email Address <span className="text-destructive">*</span></Label>
                                            <Input id="u-email" type="email" placeholder="ahmed@adscroll360.com"
                                                value={userForm.email}
                                                onChange={(e) => { setUserForm({ ...userForm, email: e.target.value }); setFormError(""); }}
                                                className="h-9"
                                            />
                                        </div>

                                        <div className="space-y-1.5">
                                            <Label htmlFor="u-dept">Department</Label>
                                            <select id="u-dept" value={userForm.department}
                                                onChange={(e) => setUserForm({ ...userForm, department: e.target.value })}
                                                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                                            >
                                                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                        </div>

                                        {/* Password fields — add only */}
                                        {modalMode !== "edit" && (
                                            <div className="space-y-3 border-t pt-3">
                                                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Login Credentials</p>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="u-pw">Password <span className="text-destructive">*</span></Label>
                                                    <div className="relative">
                                                        <Input id="u-pw" type={showPw ? "text" : "password"} placeholder="Min 6 characters"
                                                            value={userForm.password}
                                                            onChange={(e) => { setUserForm({ ...userForm, password: e.target.value }); setFormError(""); }}
                                                            className="h-9 pr-9"
                                                        />
                                                        <button type="button" onClick={() => setShowPw(!showPw)}
                                                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                            {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5">
                                                    <Label htmlFor="u-pw2">Confirm Password <span className="text-destructive">*</span></Label>
                                                    <Input id="u-pw2" type="password" placeholder="Repeat password"
                                                        value={userForm.confirmPassword}
                                                        onChange={(e) => { setUserForm({ ...userForm, confirmPassword: e.target.value }); setFormError(""); }}
                                                        className="h-9"
                                                    />
                                                </div>
                                            </div>
                                        )}

                                        {formError && <p className="text-xs text-destructive">{formError}</p>}
                                        <div className="flex gap-2 pt-1">
                                            <Button type="button" variant="outline" className="flex-1 h-9" onClick={closeModal}>Cancel</Button>
                                            <Button type="submit" className="flex-1 h-9">
                                                {modalMode === "edit" ? "Save Changes" : <><Plus className="h-4 w-4 mr-1" />Create Account</>}
                                            </Button>
                                        </div>
                                    </form>
                                )}

                                {/* Reset Password form */}
                                {modalMode === "change-password" && (
                                    <form onSubmit={handleChangePw} className="px-6 py-5 space-y-4">
                                        <div className="rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
                                            ⚠️ As Core Admin you can reset this user's password without knowing the current one.
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="new-pw">New Password <span className="text-destructive">*</span></Label>
                                            <div className="relative">
                                                <Input id="new-pw" type={showNewPw ? "text" : "password"} placeholder="Min 6 characters"
                                                    value={pwForm.newPw}
                                                    onChange={(e) => { setPwForm({ ...pwForm, newPw: e.target.value }); setFormError(""); }}
                                                    className="h-9 pr-9" autoFocus
                                                />
                                                <button type="button" onClick={() => setShowNewPw(!showNewPw)}
                                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                                    {showNewPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                                                </button>
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label htmlFor="confirm-pw">Confirm Password <span className="text-destructive">*</span></Label>
                                            <Input id="confirm-pw" type="password" placeholder="Repeat new password"
                                                value={pwForm.confirmPw}
                                                onChange={(e) => { setPwForm({ ...pwForm, confirmPw: e.target.value }); setFormError(""); }}
                                                className="h-9"
                                            />
                                        </div>
                                        {formError && <p className="text-xs text-destructive">{formError}</p>}
                                        <div className="flex gap-2 pt-1">
                                            <Button type="button" variant="outline" className="flex-1 h-9" onClick={closeModal}>Cancel</Button>
                                            <Button type="submit" className="flex-1 h-9 gap-1.5"><Key className="h-4 w-4" /> Reset Password</Button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
