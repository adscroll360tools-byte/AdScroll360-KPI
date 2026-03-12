import { useState } from "react";
import { motion } from "framer-motion";
import {
  CalendarClock, Clock, Coffee, LogIn, LogOut,
  CheckCircle2, XCircle, AlertTriangle, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { stagger, fadeUp } from "@/lib/animations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

// ─── Types ────────────────────────────────────────────────────
type MyAttendanceState = "not-checked-in" | "checked-in" | "on-break" | "checked-out";
type MemberStatus = "Present" | "Late" | "Absent" | "On Leave" | "Break";

interface MemberRecord {
  userId: string;
  name: string;
  role: string;
  status: MemberStatus;
  checkIn: string;
  checkOut: string;
}

const weekAttendance = [
  { day: "Mon", status: "Present", checkIn: "8:55 AM", checkOut: "6:05 PM" },
  { day: "Tue", status: "Present", checkIn: "9:00 AM", checkOut: "6:10 PM" },
  { day: "Wed", status: "Late", checkIn: "9:20 AM", checkOut: "6:15 PM" },
  { day: "Thu", status: "Present", checkIn: "8:50 AM", checkOut: "—" },
  { day: "Fri", status: "—", checkIn: "—", checkOut: "—" },
];

const statusBadge: Record<string, string> = {
  Present: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Late: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  Leave: "bg-destructive/15 text-destructive",
  Absent: "bg-destructive/15 text-destructive",
  "On Leave": "bg-muted text-muted-foreground",
  Break: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  "—": "bg-muted text-muted-foreground",
};

const STATUS_OPTIONS: MemberStatus[] = ["Present", "Late", "Absent", "On Leave", "Break"];

function getTimeNow() {
  return new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

export default function AttendancePage() {
  const { currentUser, users } = useAuth();
  const isAdmin = currentUser?.role === "admin";
  const isController = currentUser?.role === "controller";
  const canManage = isAdmin || isController;

  // ── My own attendance state ─────────────────────────────────
  const [state, setState] = useState<MyAttendanceState>("checked-in");
  const [checkInTime, setCheckInTime] = useState("8:55 AM");
  const [breakStart, setBreakStart] = useState<string | null>(null);
  const [checkOutTime, setCheckOutTime] = useState<string | null>(null);

  // ── Team attendance (admin/controller) ─────────────────────
  const teamMembers = users.filter((u) => u.role !== "admin");
  const [teamRecords, setTeamRecords] = useState<MemberRecord[]>(() =>
    teamMembers.map((u) => ({
      userId: u.id,
      name: u.name,
      role: u.role,
      status: "Present" as MemberStatus,
      checkIn: "9:00 AM",
      checkOut: "—",
    }))
  );

  const updateMemberStatus = (userId: string, status: MemberStatus) => {
    setTeamRecords((prev) =>
      prev.map((r) =>
        r.userId === userId
          ? { ...r, status, checkIn: status === "Absent" || status === "On Leave" ? "—" : r.checkIn }
          : r
      )
    );
    const member = teamMembers.find((u) => u.id === userId);
    toast.success(`${member?.name} marked as ${status}`);
  };

  const handleCheckIn = () => { const t = getTimeNow(); setCheckInTime(t); setCheckOutTime(null); setState("checked-in"); toast.success("Checked In!", { description: `Welcome! Checked in at ${t}.` }); };
  const handleCheckOut = () => { const t = getTimeNow(); setCheckOutTime(t); setState("checked-out"); toast.success("Checked Out!", { description: `See you tomorrow! At ${t}.` }); };
  const handleBreak = () => {
    if (state === "checked-in") { const t = getTimeNow(); setBreakStart(t); setState("on-break"); toast("On Break", { description: `Break started at ${t}.` }); }
    else if (state === "on-break") { const t = getTimeNow(); setState("checked-in"); toast("Break Ended", { description: `Back to work at ${t}.` }); }
  };

  const statusLabel: Record<MyAttendanceState, string> = {
    "not-checked-in": "Not Checked In",
    "checked-in": "On Time",
    "on-break": "On Break",
    "checked-out": "Checked Out",
  };

  const bannerBg = state === "on-break" ? "bg-amber-500/10 border border-amber-500/20"
    : state === "checked-in" ? "bg-green-500/10 border border-green-500/20"
      : "bg-muted";
  const clockColor = state === "on-break" ? "text-amber-600" : state === "checked-in" ? "text-green-600" : "text-muted-foreground";
  const clockBg = state === "on-break" ? "bg-amber-500/20" : state === "checked-in" ? "bg-green-500/20" : "bg-muted-foreground/10";

  // Team stats
  const presentCount = teamRecords.filter((r) => r.status === "Present" || r.status === "Break").length;
  const lateCount = teamRecords.filter((r) => r.status === "Late").length;
  const absentCount = teamRecords.filter((r) => r.status === "Absent").length;
  const onLeaveCount = teamRecords.filter((r) => r.status === "On Leave").length;

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp}>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Attendance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Track daily check-in, breaks, and check-out for the whole team</p>
      </motion.div>

      {/* My status banner */}
      <motion.div variants={fadeUp} className={`rounded-2xl p-4 flex items-center gap-3 ${bannerBg}`}>
        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${clockBg}`}>
          <Clock className={`h-5 w-5 ${clockColor}`} />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">{statusLabel[state]}</p>
          <p className="text-xs text-muted-foreground">
            {state === "not-checked-in" && "You haven't checked in yet today."}
            {state === "checked-in" && `Checked in at ${checkInTime}`}
            {state === "on-break" && `On break since ${breakStart}`}
            {state === "checked-out" && `Checked out at ${checkOutTime}`}
          </p>
        </div>
      </motion.div>

      {/* Quick actions */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        <Button id="check-in-btn" className="h-11 gap-2 rounded-lg px-5 text-sm font-medium"
          disabled={state === "checked-in" || state === "on-break" || state === "checked-out"}
          onClick={handleCheckIn}>
          <LogIn className="h-4 w-4" /> Check In
        </Button>
        <Button id="break-btn" variant="secondary" className="h-11 gap-2 rounded-lg px-5 text-sm font-medium"
          disabled={state === "not-checked-in" || state === "checked-out"}
          onClick={handleBreak}>
          <Coffee className="h-4 w-4" />
          {state === "on-break" ? "End Break" : "Break"}
        </Button>
        <Button id="check-out-btn" variant="secondary" className="h-11 gap-2 rounded-lg px-5 text-sm font-medium"
          disabled={state === "not-checked-in" || state === "on-break" || state === "checked-out"}
          onClick={handleCheckOut}>
          <LogOut className="h-4 w-4" /> Check Out
        </Button>
      </motion.div>

      {/* My stats */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="This Month" value="16/21" subtitle="days present" icon={CalendarClock} />
        <StatCard title="On Time" value="94%" subtitle="arrival rate" icon={Clock} variant="primary" />
        <StatCard title="Late Days" value="1" subtitle="this month" icon={CalendarClock} />
        <StatCard title="Leaves" value="0" subtitle="this month" icon={CalendarClock} />
      </motion.div>

      {/* My weekly log */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-hidden">
        <div className="px-5 py-4 border-b">
          <h2 className="text-base font-semibold text-foreground">My Week</h2>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Day</th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Check In</th>
              <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Check Out</th>
            </tr>
          </thead>
          <tbody>
            {weekAttendance.map((row) => (
              <tr key={row.day} className="border-b last:border-0 transition-colors hover:bg-muted">
                <td className="px-5 py-3 text-sm font-medium text-foreground">{row.day}</td>
                <td className="px-5 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadge[row.status]}`}>{row.status}</span>
                </td>
                <td className="px-5 py-3 font-tabular text-sm text-muted-foreground">{row.checkIn}</td>
                <td className="px-5 py-3 font-tabular text-sm text-muted-foreground">{row.checkOut}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>

      {/* ─── TEAM ATTENDANCE (Admin / Controller only) ─── */}
      {canManage && (
        <>
          {/* Team summary cards */}
          <motion.div variants={fadeUp}>
            <div className="mb-3 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold text-foreground">
                Team Daily Attendance — {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </h2>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { label: "Present", count: presentCount, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-100 dark:bg-green-900/20" },
                { label: "Late", count: lateCount, icon: AlertTriangle, color: "text-amber-600", bg: "bg-amber-100 dark:bg-amber-900/20" },
                { label: "Absent", count: absentCount, icon: XCircle, color: "text-red-600", bg: "bg-red-100 dark:bg-red-900/20" },
                { label: "On Leave", count: onLeaveCount, icon: CalendarClock, color: "text-muted-foreground", bg: "bg-muted" },
              ].map(({ label, count, icon: Icon, color, bg }) => (
                <div key={label} className="rounded-2xl bg-card p-4 shadow-card">
                  <div className={`mb-2 inline-flex rounded-lg p-2 ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Per-person attendance table */}
          <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-visible">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Mark Attendance</h2>
              <span className="text-xs text-muted-foreground">{teamRecords.length} members</span>
            </div>
            {teamRecords.length === 0 ? (
              <div className="py-12 text-center text-sm text-muted-foreground">
                No team members found. Add Controllers/Employees from <strong>Admin → Users</strong>.
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Name</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Role</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Check In</th>
                    <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                    <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Mark</th>
                  </tr>
                </thead>
                <tbody>
                  {teamRecords.map((rec) => (
                    <tr key={rec.userId} className="border-b last:border-0 transition-colors hover:bg-muted/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-2.5">
                          <div className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${rec.role === "controller"
                              ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20"
                              : "bg-primary/10 text-primary"
                            }`}>
                            {rec.name.slice(0, 2).toUpperCase()}
                          </div>
                          <p className="text-sm font-medium text-foreground">{rec.name}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium capitalize ${rec.role === "controller"
                            ? "bg-violet-100 text-violet-700 dark:bg-violet-900/20 dark:text-violet-400"
                            : "bg-muted text-muted-foreground"
                          }`}>
                          {rec.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-sm font-tabular text-muted-foreground hidden md:table-cell">
                        {rec.checkIn}
                      </td>
                      <td className="px-5 py-3">
                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadge[rec.status]}`}>
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        {/* Quick mark buttons */}
                        <div className="flex items-center justify-end gap-1.5">
                          {STATUS_OPTIONS.map((s) => (
                            <button
                              key={s}
                              onClick={() => updateMemberStatus(rec.userId, s)}
                              title={`Mark ${s}`}
                              className={`rounded-lg px-2 py-1 text-[10px] font-medium transition-colors border ${rec.status === s
                                  ? "bg-foreground text-background border-foreground"
                                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                                }`}
                            >
                              {s === "On Leave" ? "Leave" : s}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
}
