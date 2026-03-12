import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Clock, CheckCircle2, AlertCircle, Eye,
  Trash2, X, ChevronDown, User,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { stagger, fadeUp } from "@/lib/animations";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type TaskStatus = "Pending" | "In Progress" | "Completed" | "Approved";

interface Task {
  id: number;
  title: string;
  category: string;
  assignedTo: string; // name of assignee
  status: TaskStatus;
  date: string;
  time: string;
  notes?: string;
}

const CATEGORIES = [
  "Video Editing", "Content Writing", "Poster Design",
  "Social Media", "SEO", "Other",
];

const STATUSES: TaskStatus[] = ["Pending", "In Progress", "Completed", "Approved"];
const FILTER_TABS = ["All", "Pending", "In Progress", "Completed", "Approved"] as const;
type FilterTab = (typeof FILTER_TABS)[number];

const statusConfig: Record<TaskStatus, { color: string; icon: React.ElementType }> = {
  Pending: { color: "bg-muted text-muted-foreground", icon: Clock },
  "In Progress": { color: "bg-primary/15 text-primary", icon: AlertCircle },
  Completed: { color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400", icon: CheckCircle2 },
  Approved: { color: "bg-accent/15 text-accent", icon: Eye },
};

const initialTasks: Task[] = [
  { id: 1, title: "Instagram Reel – Product Launch", category: "Video Editing", assignedTo: "Fahad", status: "In Progress", date: "Mar 12", time: "2h 15m" },
  { id: 2, title: "Blog: 5 SEO Tips for 2026", category: "Content Writing", assignedTo: "Ajmal", status: "Completed", date: "Mar 12", time: "1h 30m" },
  { id: 3, title: "Facebook Ad Creative – Spring Sale", category: "Poster Design", assignedTo: "Ijaz", status: "Pending", date: "Mar 12", time: "—" },
  { id: 4, title: "LinkedIn Carousel – Agency Portfolio", category: "Poster Design", assignedTo: "Nafih", status: "Approved", date: "Mar 11", time: "3h 00m" },
  { id: 5, title: "YouTube Thumbnail – Client Case Study", category: "Poster Design", assignedTo: "Fahad", status: "Approved", date: "Mar 11", time: "45m" },
  { id: 6, title: "Twitter Thread – Marketing Trends", category: "Content Writing", assignedTo: "Ajmal", status: "Completed", date: "Mar 10", time: "1h 10m" },
  { id: 7, title: "Short Reel – Behind the Scenes", category: "Video Editing", assignedTo: "Fahad", status: "Approved", date: "Mar 10", time: "2h 45m" },
];

const emptyForm = {
  title: "", category: CATEGORIES[0], assignedTo: "",
  status: "Pending" as TaskStatus, time: "", notes: "",
};

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

export default function TasksPage() {
  const { users } = useAuth();

  // All non-admin users as assignable people
  const assignees = users.filter((u) => u.role !== "admin");

  const [tasks, setTasks] = useState<Task[]>(initialTasks);
  const [activeFilter, setActiveFilter] = useState<FilterTab>("All");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [openStatusMenu, setOpenStatusMenu] = useState<number | null>(null);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  useOutsideClick(statusMenuRef, () => setOpenStatusMenu(null));

  const filtered = activeFilter === "All" ? tasks : tasks.filter((t) => t.status === activeFilter);

  const handleOpen = () => {
    setForm({ ...emptyForm, assignedTo: assignees[0]?.name ?? "" });
    setFormError("");
    setShowModal(true);
  };
  const handleClose = () => setShowModal(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Task title is required."); return; }
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const newTask: Task = {
      id: Date.now(),
      title: form.title.trim(),
      category: form.category,
      assignedTo: form.assignedTo || "Unassigned",
      status: form.status,
      date: dateStr,
      time: form.time.trim() || "—",
      notes: form.notes.trim(),
    };
    setTasks((prev) => [newTask, ...prev]);
    setShowModal(false);
    toast.success("Task added!", { description: `"${newTask.title}" assigned to ${newTask.assignedTo}.` });
  };

  const handleDelete = (id: number) => {
    const task = tasks.find((t) => t.id === id);
    setTasks((prev) => prev.filter((t) => t.id !== id));
    toast.error("Task deleted", { description: task?.title });
  };

  const handleStatusChange = (id: number, newStatus: TaskStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: newStatus } : t)));
    setOpenStatusMenu(null);
    toast.success("Status updated");
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        {/* Header */}
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Tasks</h1>
            <p className="mt-1 text-sm text-muted-foreground">Submit and track your daily work</p>
          </div>
          <Button id="new-task-btn" className="h-10 gap-2 rounded-lg px-5 text-sm font-medium" onClick={handleOpen}>
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </motion.div>

        {/* Filter tabs */}
        <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
          {FILTER_TABS.map((filter) => {
            const count = filter === "All" ? tasks.length : tasks.filter((t) => t.status === filter).length;
            const isActive = activeFilter === filter;
            return (
              <button
                key={filter}
                id={`filter-${filter.replace(" ", "-").toLowerCase()}`}
                onClick={() => setActiveFilter(filter)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 ${isActive
                    ? "bg-foreground text-background shadow-sm"
                    : "bg-muted text-muted-foreground hover:bg-border hover:text-foreground"
                  }`}
              >
                {filter}
                <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${isActive ? "bg-background/20 text-background" : "bg-background text-muted-foreground"
                  }`}>{count}</span>
              </button>
            );
          })}
        </motion.div>

        {/* Task list */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-visible">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-muted">
                <CheckCircle2 className="h-7 w-7 text-muted-foreground" />
              </div>
              <p className="font-medium text-foreground">No tasks found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {activeFilter === "All" ? "Add your first task using the button above." : `No tasks with status "${activeFilter}".`}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Task</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Assigned To</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Category</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Time</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {filtered.map((task) => {
                    const config = statusConfig[task.status];
                    return (
                      <motion.tr
                        key={task.id}
                        layout
                        initial={{ opacity: 0, y: -6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
                        className="border-b last:border-0 transition-colors hover:bg-muted/50 group"
                      >
                        <td className="px-5 py-3">
                          <p className="text-sm font-medium text-foreground">{task.title}</p>
                          {task.notes && <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-xs">{task.notes}</p>}
                        </td>
                        <td className="px-5 py-3 hidden sm:table-cell">
                          <div className="flex items-center gap-1.5">
                            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-[9px] font-bold text-primary">
                              {task.assignedTo.slice(0, 2).toUpperCase()}
                            </div>
                            <span className="text-sm text-muted-foreground">{task.assignedTo}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{task.category}</td>
                        <td className="px-5 py-3 font-tabular text-sm text-muted-foreground hidden md:table-cell">{task.date}</td>
                        <td className="px-5 py-3 text-right font-tabular text-sm text-muted-foreground hidden md:table-cell">{task.time}</td>
                        {/* Status dropdown — rendered outside table flow */}
                        <td className="px-5 py-3 text-right">
                          <div className="relative inline-block" ref={openStatusMenu === task.id ? statusMenuRef : null}>
                            <button
                              onClick={() => setOpenStatusMenu(openStatusMenu === task.id ? null : task.id)}
                              className={`inline-flex cursor-pointer items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${config.color}`}
                            >
                              {task.status}
                              <ChevronDown className="h-3 w-3 opacity-60" />
                            </button>
                            {openStatusMenu === task.id && (
                              <div className="absolute right-0 top-7 z-[200] w-36 rounded-xl border bg-card shadow-2xl">
                                {STATUSES.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => handleStatusChange(task.id, s)}
                                    className={`flex w-full items-center gap-2 px-3 py-2 text-xs font-medium transition-colors first:rounded-t-xl last:rounded-b-xl hover:bg-muted ${task.status === s ? "text-primary" : "text-foreground"
                                      }`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${statusConfig[s].color.split(" ")[0]}`} />
                                    {s}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => handleDelete(task.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Delete task"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </motion.tr>
                    );
                  })}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </motion.div>

        {/* Summary */}
        <motion.div variants={fadeUp} className="flex items-center justify-between text-xs text-muted-foreground px-1">
          <span>Showing <span className="font-medium text-foreground">{filtered.length}</span> of <span className="font-medium text-foreground">{tasks.length}</span> tasks</span>
          <span>{tasks.filter((t) => t.status === "Completed" || t.status === "Approved").length} completed</span>
        </motion.div>
      </motion.div>

      {/* ── New Task Modal ─────────────────────────────────────────────── */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={handleClose} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Add New Task</h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Fill in the details and assign to a team member</p>
                  </div>
                  <button onClick={handleClose} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  {/* Title */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-title">Task Title <span className="text-destructive">*</span></Label>
                    <Input id="task-title" placeholder="e.g. Instagram Reel – Product Launch"
                      value={form.title}
                      onChange={(e) => { setForm({ ...form, title: e.target.value }); setFormError(""); }}
                      className="h-9" autoFocus />
                    {formError && <p className="text-xs text-destructive">{formError}</p>}
                  </div>

                  {/* Assign To */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-assign" className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      Assign To
                    </Label>
                    {assignees.length > 0 ? (
                      <select id="task-assign" value={form.assignedTo}
                        onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        <option value="">— Unassigned —</option>
                        {assignees.map((u) => (
                          <option key={u.id} value={u.name}>
                            {u.name} ({u.role === "controller" ? "Controller" : "Employee"})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="flex h-9 items-center rounded-md border border-dashed border-border bg-muted/50 px-3 text-xs text-muted-foreground gap-2">
                        <User className="h-3.5 w-3.5" />
                        No team members yet — add from <strong className="text-foreground ml-1">Admin → Users</strong>
                      </div>
                    )}
                  </div>

                  {/* Category & Status */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="task-category">Category</Label>
                      <select id="task-category" value={form.category}
                        onChange={(e) => setForm({ ...form, category: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="task-status">Status</Label>
                      <select id="task-status" value={form.status}
                        onChange={(e) => setForm({ ...form, status: e.target.value as TaskStatus })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  </div>

                  {/* Time */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-time">Time Spent</Label>
                    <Input id="task-time" placeholder="e.g. 2h 30m (optional)"
                      value={form.time} onChange={(e) => setForm({ ...form, time: e.target.value })} className="h-9" />
                  </div>

                  {/* Notes */}
                  <div className="space-y-1.5">
                    <Label htmlFor="task-notes">Notes</Label>
                    <textarea id="task-notes" rows={2} placeholder="Any additional notes… (optional)"
                      value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none" />
                  </div>

                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1 h-9" onClick={handleClose}>Cancel</Button>
                    <Button type="submit" className="flex-1 h-9 gap-1.5"><Plus className="h-4 w-4" /> Add Task</Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
