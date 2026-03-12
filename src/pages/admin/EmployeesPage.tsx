import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Search, MoreHorizontal, X, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";

interface Employee {
  id: number;
  name: string;
  email: string;
  role: string;
  department: string;
  status: string;
  score: number;
}

const initialEmployees: Employee[] = [
  { id: 1, name: "Fahad", email: "fahad@adscroll360.com", role: "Video Editor", department: "Content", status: "Active", score: 92 },
  { id: 2, name: "Ijaz", email: "ijaz@adscroll360.com", role: "Graphic Designer", department: "Design", status: "Active", score: 88 },
  { id: 3, name: "Nafih", email: "nafih@adscroll360.com", role: "Project Manager", department: "Management", status: "Active", score: 85 },
  { id: 4, name: "Ajmal", email: "ajmal@adscroll360.com", role: "Content Writer", department: "Content", status: "Active", score: 82 },
  { id: 5, name: "Aboobacker", email: "aboobacker@adscroll360.com", role: "Marketing Lead", department: "Marketing", status: "Active", score: 79 },
  { id: 6, name: "Naimuddin", email: "naimuddin@adscroll360.com", role: "Business Analyst", department: "Analytics", status: "Active", score: 76 },
];

const DEPARTMENTS = ["Content", "Design", "Management", "Marketing", "Analytics", "Other"];
const ROLES = ["Video Editor", "Graphic Designer", "Content Writer", "Project Manager", "Marketing Lead", "Business Analyst", "Other"];

const emptyForm = { name: "", email: "", role: ROLES[0], department: DEPARTMENTS[0], score: 80 };

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(initialEmployees);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Employee | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(search.toLowerCase()) ||
      e.role.toLowerCase().includes(search.toLowerCase()) ||
      e.department.toLowerCase().includes(search.toLowerCase())
  );

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (emp: Employee) => {
    setEditTarget(emp);
    setForm({ name: emp.name, email: emp.email, role: emp.role, department: emp.department, score: emp.score });
    setFormError("");
    setShowModal(true);
    setMenuOpen(null);
  };

  const handleDelete = (id: number) => {
    const emp = employees.find((e) => e.id === id);
    setEmployees((prev) => prev.filter((e) => e.id !== id));
    setMenuOpen(null);
    toast.error("Employee removed", { description: emp?.name });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.email.trim()) { setFormError("Email is required."); return; }

    if (editTarget) {
      setEmployees((prev) =>
        prev.map((emp) =>
          emp.id === editTarget.id ? { ...emp, ...form } : emp
        )
      );
      toast.success("Employee updated!", { description: form.name });
    } else {
      const newEmp: Employee = {
        id: Date.now(),
        ...form,
        status: "Active",
      };
      setEmployees((prev) => [newEmp, ...prev]);
      toast.success("Employee added!", { description: form.name });
    }
    setShowModal(false);
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Employees</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage team members and roles</p>
          </div>
          <Button id="add-employee-btn" className="h-10 gap-2 rounded-lg px-5 text-sm font-medium" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Employee
          </Button>
        </motion.div>

        <motion.div variants={fadeUp} className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="employee-search"
            placeholder="Search employees..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 rounded-lg border-0 bg-muted pl-10 text-sm"
          />
        </motion.div>

        <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-hidden">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <p className="font-medium text-foreground">No employees found</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {search ? `No results for "${search}"` : "Add your first employee."}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Role</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Department</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Score</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((emp) => (
                  <tr key={emp.id} className="border-b last:border-0 transition-colors hover:bg-muted/50 group">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary/10 text-xs font-medium text-primary">
                            {emp.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="text-sm font-medium text-foreground">{emp.name}</p>
                          <p className="text-xs text-muted-foreground">{emp.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{emp.role}</td>
                    <td className="px-5 py-3 text-sm text-muted-foreground hidden md:table-cell">{emp.department}</td>
                    <td className="px-5 py-3 text-right font-tabular text-sm font-semibold text-foreground">{emp.score}</td>
                    <td className="px-5 py-3 text-right">
                      <span className="rounded-full bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 px-2.5 py-0.5 text-[11px] font-medium">
                        {emp.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="relative inline-block">
                        <button
                          onClick={() => setMenuOpen(menuOpen === emp.id ? null : emp.id)}
                          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                        <AnimatePresence>
                          {menuOpen === emp.id && (
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95, y: -4 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.95, y: -4 }}
                              transition={{ duration: 0.1 }}
                              className="absolute right-0 top-8 z-10 w-36 rounded-xl border bg-card shadow-lg"
                            >
                              <button
                                onClick={() => openEdit(emp)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-t-xl"
                              >
                                <Edit className="h-3.5 w-3.5" /> Edit
                              </button>
                              <button
                                onClick={() => handleDelete(emp.id)}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 rounded-b-xl"
                              >
                                <Trash2 className="h-3.5 w-3.5" /> Remove
                              </button>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>

      {/* Add / Edit Employee Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div
              key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      {editTarget ? "Edit Employee" : "Add Employee"}
                    </h2>
                    <p className="text-xs text-muted-foreground mt-0.5">Fill in the employee details</p>
                  </div>
                  <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="emp-name">Full Name <span className="text-destructive">*</span></Label>
                      <Input
                        id="emp-name"
                        placeholder="e.g. Fahad"
                        value={form.name}
                        onChange={(e) => { setForm({ ...form, name: e.target.value }); setFormError(""); }}
                        className="h-9"
                        autoFocus
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emp-score">Score</Label>
                      <Input
                        id="emp-score"
                        type="number"
                        min={0} max={100}
                        value={form.score}
                        onChange={(e) => setForm({ ...form, score: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="emp-email">Email <span className="text-destructive">*</span></Label>
                    <Input
                      id="emp-email"
                      type="email"
                      placeholder="e.g. fahad@adscroll360.com"
                      value={form.email}
                      onChange={(e) => { setForm({ ...form, email: e.target.value }); setFormError(""); }}
                      className="h-9"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="emp-role">Role</Label>
                      <select
                        id="emp-role"
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="emp-dept">Department</Label>
                      <select
                        id="emp-dept"
                        value={form.department}
                        onChange={(e) => setForm({ ...form, department: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                      >
                        {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                      </select>
                    </div>
                  </div>
                  {formError && <p className="text-xs text-destructive">{formError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 h-9">
                      {editTarget ? "Save Changes" : <><Plus className="h-4 w-4 mr-1" />Add Employee</>}
                    </Button>
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
