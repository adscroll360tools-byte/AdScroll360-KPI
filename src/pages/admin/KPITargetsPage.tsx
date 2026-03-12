import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { KPIProgressBar } from "@/components/KPIProgressBar";
import { Target, Plus, Edit, X, Save } from "lucide-react";
import { toast } from "sonner";

interface KPICategory {
  id: number;
  category: string;
  dailyMin: number;
  dailyMax: number;
  monthlyTarget: number;
  current: number;
  unit: string;
}

const qualityScoring = [
  { metric: "Quality", weight: 40, description: "Accuracy, detail, and polish" },
  { metric: "Creativity", weight: 30, description: "Originality and innovation" },
  { metric: "Communication", weight: 15, description: "Clarity and responsiveness" },
  { metric: "Task Completion", weight: 15, description: "On-time delivery rate" },
];

const initialKpi: KPICategory[] = [
  { id: 1, category: "Content Writing", dailyMin: 2, dailyMax: 3, monthlyTarget: 55, current: 32, unit: "pieces" },
  { id: 2, category: "Poster Design", dailyMin: 1, dailyMax: 2, monthlyTarget: 35, current: 18, unit: "designs" },
  { id: 3, category: "Short Video", dailyMin: 1, dailyMax: 1, monthlyTarget: 22, current: 12, unit: "videos" },
  { id: 4, category: "Medium Video", dailyMin: 0.33, dailyMax: 0.5, monthlyTarget: 8, current: 5, unit: "videos" },
];

const emptyForm = { category: "", dailyMin: 1, dailyMax: 2, monthlyTarget: 20, current: 0, unit: "pieces" };

export default function KPITargetsPage() {
  const [kpiList, setKpiList] = useState<KPICategory[]>(initialKpi);
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<KPICategory | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");

  const openAdd = () => {
    setEditTarget(null);
    setForm(emptyForm);
    setFormError("");
    setShowModal(true);
  };

  const openEdit = (kpi: KPICategory) => {
    setEditTarget(kpi);
    setForm({
      category: kpi.category,
      dailyMin: kpi.dailyMin,
      dailyMax: kpi.dailyMax,
      monthlyTarget: kpi.monthlyTarget,
      current: kpi.current,
      unit: kpi.unit,
    });
    setFormError("");
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category.trim()) { setFormError("Category name is required."); return; }

    if (editTarget) {
      setKpiList((prev) =>
        prev.map((k) => (k.id === editTarget.id ? { ...k, ...form } : k))
      );
      toast.success("KPI updated!", { description: form.category });
    } else {
      setKpiList((prev) => [...prev, { id: Date.now(), ...form }]);
      toast.success("KPI category added!", { description: form.category });
    }
    setShowModal(false);
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">KPI Targets</h1>
            <p className="mt-1 text-sm text-muted-foreground">Configure production targets and scoring rules</p>
          </div>
          <Button id="add-kpi-btn" className="h-10 gap-2 rounded-lg px-5 text-sm font-medium" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Category
          </Button>
        </motion.div>

        {/* Monthly targets */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="mb-5 text-base font-semibold text-foreground">Monthly Production Targets</h2>
          <div className="space-y-4">
            {kpiList.map((kpi) => (
              <div key={kpi.id} className="flex items-center gap-4 rounded-xl p-3 transition-colors hover:bg-muted group">
                <div className="flex-1">
                  <KPIProgressBar label={kpi.category} current={kpi.current} target={kpi.monthlyTarget} unit={kpi.unit} />
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-muted-foreground">Daily: {kpi.dailyMin}–{kpi.dailyMax}</p>
                </div>
                <button
                  onClick={() => openEdit(kpi)}
                  className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-border hover:text-foreground opacity-0 group-hover:opacity-100"
                  title="Edit KPI"
                >
                  <Edit className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Quality scoring */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-hidden">
          <div className="px-6 py-4 border-b">
            <h2 className="text-base font-semibold text-foreground">Quality Scoring System (Out of 100)</h2>
          </div>
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Metric</th>
                <th className="px-6 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Description</th>
                <th className="px-6 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Weight</th>
              </tr>
            </thead>
            <tbody>
              {qualityScoring.map((item) => (
                <tr key={item.metric} className="border-b last:border-0 transition-colors hover:bg-muted">
                  <td className="px-6 py-3 text-sm font-medium text-foreground">{item.metric}</td>
                  <td className="px-6 py-3 text-sm text-muted-foreground">{item.description}</td>
                  <td className="px-6 py-3 text-right font-tabular text-sm font-semibold text-foreground">{item.weight}pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Performance tiers */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-card p-6 shadow-card">
          <h2 className="mb-4 text-base font-semibold text-foreground">Performance Tiers</h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between rounded-xl bg-green-100 dark:bg-green-900/20 px-4 py-3">
              <span className="text-sm font-medium text-green-700 dark:text-green-400">Top Performer</span>
              <span className="font-tabular text-sm text-green-700 dark:text-green-400">85 – 100</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-primary/10 px-4 py-3">
              <span className="text-sm font-medium text-primary">Good Performance</span>
              <span className="font-tabular text-sm text-primary">70 – 84</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-amber-100 dark:bg-amber-900/20 px-4 py-3">
              <span className="text-sm font-medium text-amber-700 dark:text-amber-400">Needs Improvement</span>
              <span className="font-tabular text-sm text-amber-700 dark:text-amber-400">Below 70</span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Add / Edit KPI Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h2 className="text-base font-semibold text-foreground">
                    {editTarget ? "Edit KPI Category" : "Add KPI Category"}
                  </h2>
                  <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-category">Category Name <span className="text-destructive">*</span></Label>
                    <Input
                      id="kpi-category"
                      placeholder="e.g. Content Writing"
                      value={form.category}
                      onChange={(e) => { setForm({ ...form, category: e.target.value }); setFormError(""); }}
                      className="h-9"
                      autoFocus
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="kpi-daily-min">Daily Min</Label>
                      <Input id="kpi-daily-min" type="number" min={0} step={0.25}
                        value={form.dailyMin}
                        onChange={(e) => setForm({ ...form, dailyMin: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kpi-daily-max">Daily Max</Label>
                      <Input id="kpi-daily-max" type="number" min={0} step={0.25}
                        value={form.dailyMax}
                        onChange={(e) => setForm({ ...form, dailyMax: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kpi-target">Monthly Target</Label>
                      <Input id="kpi-target" type="number" min={1}
                        value={form.monthlyTarget}
                        onChange={(e) => setForm({ ...form, monthlyTarget: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="kpi-current">Current Progress</Label>
                      <Input id="kpi-current" type="number" min={0}
                        value={form.current}
                        onChange={(e) => setForm({ ...form, current: Number(e.target.value) })}
                        className="h-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="kpi-unit">Unit</Label>
                    <Input id="kpi-unit" placeholder="e.g. pieces, videos, designs"
                      value={form.unit}
                      onChange={(e) => setForm({ ...form, unit: e.target.value })}
                      className="h-9"
                    />
                  </div>
                  {formError && <p className="text-xs text-destructive">{formError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 h-9 gap-1.5">
                      {editTarget ? <><Save className="h-4 w-4" /> Save</> : <><Plus className="h-4 w-4" /> Add</>}
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
