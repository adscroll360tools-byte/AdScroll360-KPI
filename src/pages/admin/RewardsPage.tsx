import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Gift, Plus, Trophy, Star, Award, X, Trash2, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";

interface Reward {
  id: number;
  title: string;
  recipient: string;
  type: string;
  date: string;
  status: string;
}

const rewardTypeOptions = ["Certificate", "Bonus", "Gift", "Recognition"];

const rewardTypes = [
  { icon: Trophy, label: "Bonus", count: 3, color: "bg-primary/10 text-primary" },
  { icon: Award, label: "Certificate", count: 5, color: "bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400" },
  { icon: Star, label: "Recognition", count: 8, color: "bg-amber-100 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400" },
  { icon: Gift, label: "Gift", count: 2, color: "bg-destructive/10 text-destructive" },
];

const statusBadge: Record<string, string> = {
  Awarded: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  Pending: "bg-muted text-muted-foreground",
};

const initialRewards: Reward[] = [
  { id: 1, title: "Best Content of the Week", recipient: "Ajmal", type: "Certificate", date: "Mar 10", status: "Awarded" },
  { id: 2, title: "Best Video Production", recipient: "Fahad", type: "Bonus", date: "Mar 10", status: "Awarded" },
  { id: 3, title: "Highest Productivity", recipient: "Ijaz", type: "Gift", date: "Mar 3", status: "Awarded" },
  { id: 4, title: "Best Social Media Campaign", recipient: "—", type: "Recognition", date: "Mar 17", status: "Pending" },
];

const emptyForm = { title: "", recipient: "", type: rewardTypeOptions[0], status: "Pending" };

export default function RewardsPage() {
  const [rewards, setRewards] = useState<Reward[]>(initialRewards);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);

  const openAdd = () => { setForm(emptyForm); setFormError(""); setShowModal(true); };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { setFormError("Reward title is required."); return; }
    const dateStr = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric" });
    setRewards((prev) => [{ id: Date.now(), ...form, date: dateStr }, ...prev]);
    toast.success("Reward added!", { description: form.title });
    setShowModal(false);
  };

  const handleAward = (id: number) => {
    setRewards((prev) => prev.map((r) => r.id === id ? { ...r, status: "Awarded" } : r));
    toast.success("Reward marked as Awarded!");
  };

  const handleRemove = (id: number, title: string) => {
    setRewards((prev) => prev.filter((r) => r.id !== id));
    setMenuOpen(null);
    toast.error("Reward removed", { description: title });
  };

  return (
    <>
      <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
        <motion.div variants={fadeUp} className="flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Rewards & Incentives</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage employee recognition and rewards</p>
          </div>
          <Button id="add-reward-btn" className="h-10 gap-2 rounded-lg px-5 text-sm font-medium" onClick={openAdd}>
            <Plus className="h-4 w-4" /> Add Reward
          </Button>
        </motion.div>

        {/* Reward type cards */}
        <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {rewardTypes.map((type) => (
            <div key={type.label} className="rounded-2xl bg-card p-4 shadow-card">
              <div className={`mb-3 inline-flex rounded-xl p-2.5 ${type.color}`}>
                <type.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold text-foreground">{type.count}</p>
              <p className="text-xs text-muted-foreground">{type.label}s given</p>
            </div>
          ))}
        </motion.div>

        {/* Rewards table */}
        <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-hidden">
          <div className="px-5 py-4 border-b flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">Recent Rewards</h2>
            <span className="text-xs text-muted-foreground">{rewards.length} reward{rewards.length !== 1 ? "s" : ""}</span>
          </div>
          {rewards.length === 0 ? (
            <div className="py-14 text-center text-sm text-muted-foreground">
              No rewards yet. Click <strong>Add Reward</strong> to create one.
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Reward</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Recipient</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden sm:table-cell">Type</th>
                  <th className="px-5 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground hidden md:table-cell">Date</th>
                  <th className="px-5 py-3 text-center text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Status</th>
                  <th className="px-5 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence mode="popLayout">
                  {rewards.map((reward) => (
                    <motion.tr
                      key={reward.id}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="border-b last:border-0 transition-colors hover:bg-muted/50 group"
                    >
                      <td className="px-5 py-3 text-sm font-medium text-foreground">{reward.title}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{reward.recipient}</td>
                      <td className="px-5 py-3 text-sm text-muted-foreground hidden sm:table-cell">{reward.type}</td>
                      <td className="px-5 py-3 font-tabular text-sm text-muted-foreground hidden md:table-cell">{reward.date}</td>
                      <td className="px-5 py-3 text-center">
                        {reward.status === "Pending" ? (
                          <button
                            onClick={() => handleAward(reward.id)}
                            className="rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-muted text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                            title="Click to mark as awarded"
                          >
                            Pending
                          </button>
                        ) : (
                          <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusBadge[reward.status]}`}>
                            {reward.status}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={() => setMenuOpen(menuOpen === reward.id ? null : reward.id)}
                            className="rounded-lg p-1.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:bg-muted"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </button>
                          <AnimatePresence>
                            {menuOpen === reward.id && (
                              <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: -4 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: -4 }}
                                transition={{ duration: 0.1 }}
                                className="absolute right-0 top-8 z-20 w-36 rounded-xl border bg-card shadow-xl"
                              >
                                {reward.status === "Pending" && (
                                  <button
                                    onClick={() => { handleAward(reward.id); setMenuOpen(null); }}
                                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-foreground hover:bg-muted rounded-t-xl"
                                  >
                                    <Award className="h-3.5 w-3.5 text-green-600" /> Mark Awarded
                                  </button>
                                )}
                                <button
                                  onClick={() => handleRemove(reward.id, reward.title)}
                                  className={`flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 ${reward.status !== "Pending" ? "rounded-t-xl" : ""} rounded-b-xl`}
                                >
                                  <Trash2 className="h-3.5 w-3.5" /> Remove
                                </button>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </AnimatePresence>
              </tbody>
            </table>
          )}
        </motion.div>
      </motion.div>

      {/* Add Reward Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div key="backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)} className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
            <motion.div key="modal"
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
            >
              <div className="w-full max-w-md rounded-2xl bg-card shadow-2xl border border-border">
                <div className="flex items-center justify-between border-b px-6 py-4">
                  <h2 className="text-base font-semibold text-foreground">Add Reward</h2>
                  <button onClick={() => setShowModal(false)} className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="reward-title">Reward Title <span className="text-destructive">*</span></Label>
                    <Input id="reward-title" placeholder="e.g. Best Content of the Week"
                      value={form.title} onChange={(e) => { setForm({ ...form, title: e.target.value }); setFormError(""); }}
                      className="h-9" autoFocus />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="reward-recipient">Recipient</Label>
                      <Input id="reward-recipient" placeholder="Employee name"
                        value={form.recipient} onChange={(e) => setForm({ ...form, recipient: e.target.value })} className="h-9" />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="reward-type">Type</Label>
                      <select id="reward-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                        {rewardTypeOptions.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="reward-status">Status</Label>
                    <select id="reward-status" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
                      <option value="Pending">Pending</option>
                      <option value="Awarded">Awarded</option>
                    </select>
                  </div>
                  {formError && <p className="text-xs text-destructive">{formError}</p>}
                  <div className="flex gap-2 pt-1">
                    <Button type="button" variant="outline" className="flex-1 h-9" onClick={() => setShowModal(false)}>Cancel</Button>
                    <Button type="submit" className="flex-1 h-9 gap-1.5"><Plus className="h-4 w-4" /> Add Reward</Button>
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
