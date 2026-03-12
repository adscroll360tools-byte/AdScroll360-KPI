import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { ClipboardCheck, CalendarClock, Trophy, Target, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { KPIProgressBar } from "@/components/KPIProgressBar";

const myTasks = [
    { id: 1, title: "Instagram Reel – Product Launch", category: "Video Editing", status: "In Progress", time: "2h 15m" },
    { id: 2, title: "Blog: 5 SEO Tips for 2026", category: "Content Writing", status: "Completed", time: "1h 30m" },
    { id: 3, title: "Facebook Ad Creative", category: "Poster Design", status: "Pending", time: "—" },
];

const statusColors: Record<string, string> = {
    Completed: "bg-green-100 text-green-700 dark:bg-green-900/20",
    "In Progress": "bg-primary/15 text-primary",
    Pending: "bg-muted text-muted-foreground",
};

export default function EmployeeDashboard() {
    const { currentUser } = useAuth();
    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Hello, <span className="text-emerald-600">{currentUser?.name}</span> 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · Keep up the great work!
                </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="Tasks Today" value="3" subtitle="1 completed" icon={ClipboardCheck} />
                <StatCard title="Attendance" value="On Time" subtitle="Checked in 8:55 AM" icon={CalendarClock} variant="primary" />
                <StatCard title="Weekly Score" value="88" subtitle="Good Performance" icon={Trophy} trend={{ value: "+4 vs last week", positive: true }} />
                <StatCard title="Monthly KPI" value="72%" subtitle="15 days remaining" icon={Target} />
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Today's tasks */}
                <motion.div variants={fadeUp} className="lg:col-span-7">
                    <div className="rounded-2xl bg-card p-5 shadow-card">
                        <div className="mb-4 flex items-center justify-between">
                            <h2 className="text-base font-semibold text-foreground">Today's Tasks</h2>
                            <span className="text-xs text-muted-foreground font-tabular">{myTasks.length} tasks</span>
                        </div>
                        <div className="space-y-1">
                            {myTasks.map((task) => (
                                <div key={task.id} className="flex items-center justify-between rounded-xl px-3 py-3 hover:bg-muted transition-colors">
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                                        <p className="text-xs text-muted-foreground">{task.category}</p>
                                    </div>
                                    <div className="flex items-center gap-3 ml-3">
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                            <Clock className="h-3 w-3" />
                                            <span className="font-tabular">{task.time}</span>
                                        </div>
                                        <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusColors[task.status]}`}>
                                            {task.status}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* KPI Progress */}
                <motion.div variants={fadeUp} className="lg:col-span-5">
                    <div className="rounded-2xl bg-card p-5 shadow-card">
                        <h2 className="mb-5 text-base font-semibold text-foreground">My Monthly KPIs</h2>
                        <div className="space-y-5">
                            <KPIProgressBar label="Written Content" current={32} target={55} unit="pieces" />
                            <KPIProgressBar label="Poster Designs" current={18} target={35} />
                            <KPIProgressBar label="Videos" current={12} target={22} />
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
