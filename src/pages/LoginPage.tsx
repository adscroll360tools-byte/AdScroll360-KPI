import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Users, UserCircle, Eye, EyeOff } from "lucide-react";
import { useAuth, UserRole } from "@/context/AuthContext";

const roles = [
  { id: "admin" as UserRole, label: "Core Admin", icon: Shield, desc: "Full system control", color: "from-primary to-primary/80" },
  { id: "controller" as UserRole, label: "Controller", icon: Users, desc: "Team management", color: "from-violet-600 to-violet-500" },
  { id: "employee" as UserRole, label: "Employee", icon: UserCircle, desc: "Task & KPI tracking", color: "from-emerald-600 to-emerald-500" },
];

const ROLE_REDIRECT: Record<UserRole, string> = {
  admin: "/dashboard",
  controller: "/controller/dashboard",
  employee: "/employee/dashboard",
};

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole>("admin");
  const [email, setEmail] = useState("basith@adscroll360.com");
  const [password, setPassword] = useState("password");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Email is required."); return; }
    if (!password) { setError("Password is required."); return; }
    setLoading(true);
    setTimeout(() => {
      const result = login(email.trim(), password, selectedRole);
      setLoading(false);
      if (result.success) {
        navigate(ROLE_REDIRECT[selectedRole], { replace: true });
      } else {
        setError(result.error ?? "Login failed.");
      }
    }, 400); // slight delay for UX
  };

  const activeRole = roles.find((r) => r.id === selectedRole)!;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Brand */}
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary shadow-lg">
            <span className="text-lg font-bold text-primary-foreground">A</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">AdScroll360</h1>
          <p className="mt-1 text-sm text-muted-foreground">Performance & KPI Management</p>
        </div>

        {/* Role selector */}
        <div className="grid grid-cols-3 gap-2">
          {roles.map((role) => {
            const isActive = selectedRole === role.id;
            return (
              <button
                key={role.id}
                type="button"
                onClick={() => { setSelectedRole(role.id); setError(""); }}
                className={`flex flex-col items-center gap-1.5 rounded-xl p-3.5 text-center transition-all border-2 ${isActive
                  ? "border-primary bg-primary text-primary-foreground shadow-lg scale-105"
                  : "border-transparent bg-card text-muted-foreground shadow-card hover:shadow-card-hover hover:border-border"
                  }`}
              >
                <role.icon className="h-5 w-5" />
                <span className="text-[11px] font-semibold">{role.label}</span>
                <span className={`text-[9px] ${isActive ? "opacity-80" : "text-muted-foreground/70"}`}>{role.desc}</span>
              </button>
            );
          })}
        </div>

        {/* Login form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="rounded-2xl bg-card p-6 shadow-card space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-sm font-medium text-foreground">Email</Label>
              <Input
                id="login-email"
                type="email"
                placeholder="you@adscroll360.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                className="h-11 rounded-lg border-0 bg-muted text-sm focus-visible:ring-2 focus-visible:ring-ring"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-password" className="text-sm font-medium text-foreground">Password</Label>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPw ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  className="h-11 rounded-lg border-0 bg-muted pr-10 text-sm focus-visible:ring-2 focus-visible:ring-ring"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-lg bg-destructive/10 px-3 py-2 text-xs font-medium text-destructive"
              >
                {error}
              </motion.div>
            )}
          </div>

          <Button
            id="login-submit-btn"
            type="submit"
            className="h-11 w-full rounded-lg text-sm font-medium"
            disabled={loading}
          >
            {loading ? "Signing in…" : `Sign in as ${activeRole.label}`}
          </Button>
        </form>

        {/* Default credentials hint */}
        <div className="rounded-xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground space-y-1">
          <p className="font-medium text-foreground text-[11px] uppercase tracking-wider mb-1">Default Credentials</p>
          <p>⚡ Core Admin — <span className="font-mono">basith@adscroll360.com</span> / <span className="font-mono">password</span></p>
          <p className="text-[11px] text-muted-foreground/70">Controllers & Employees are created by the Admin.</p>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          AdScroll360 © {new Date().getFullYear()} · Internal Use Only
        </p>
      </motion.div>
    </div>
  );
}
