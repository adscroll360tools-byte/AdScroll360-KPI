import { motion } from "framer-motion";
import { stagger, fadeUp } from "@/lib/animations";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { ClipboardCheck, Users, Trophy, Target, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const weeklyData = [
    { day: "Mon", tasks: 18 }, { day: "Tue", tasks: 22 }, { day: "Wed", tasks: 15 },
    { day: "Thu", tasks: 24 }, { day: "Fri", tasks: 19 },
];

const teamStatus = [
    { name: "Fahad", status: "On Time", score: 92, tasks: 4 },
    { name: "Ijaz", status: "On Time", score: 88, tasks: 3 },
    { name: "Ajmal", status: "Late", score: 82, tasks: 2 },
    { name: "Nafih", status: "On Time", score: 85, tasks: 5 },
    { name: "Aboobacker", status: "On Leave", score: 79, tasks: 0 },
    { name: "Naimuddin", status: "On Time", score: 76, tasks: 3 },
];

export default function ControllerDashboard() {
    const { currentUser } = useAuth();
    return (
        <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
            <motion.div variants={fadeUp}>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    Good morning, <span className="text-violet-600">{currentUser?.name}</span> 👋
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                    {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })} · Controller Overview
                </p>
            </motion.div>

            <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard title="Team Size" value="6" subtitle="active members" icon={Users} />
                <StatCard title="Tasks Today" value="17" subtitle="across all employees" icon={ClipboardCheck} variant="primary" />
                <StatCard title="Avg Team Score" value="84" subtitle="Good performance" icon={Trophy} trend={{ value: "+2 vs last week", positive: true }} />
                <StatCard title="Monthly KPI" value="72%" subtitle="15 days remaining" icon={Target} />
            </motion.div>

            <div className="grid gap-6 lg:grid-cols-12">
                {/* Team status */}
                <motion.div variants={fadeUp} className="lg:col-span-6">
                    <div className="rounded-2xl bg-card p-5 shadow-card">
                        <h2 className="mb-4 text-base font-semibold text-foreground">Team Status Today</h2>
                        <div className="space-y-2">
                            {teamStatus.map((member) => (
                                <div key={member.name} className="flex items-center justify-between rounded-xl px-3 py-2.5 hover:bg-muted transition-colors">
                                    <div className="flex items-center gap-2.5">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-900/20 text-[11px] font-semibold text-violet-600">
                                            {member.name.slice(0, 2).toUpperCase()}
                                        </div>
                                        <p className="text-sm font-medium text-foreground">{member.name}</p>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <span className="text-xs text-muted-foreground font-tabular">{member.tasks} tasks</span>
                                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${member.status === "On Time" ? "bg-green-100 text-green-700 dark:bg-green-900/20" :
                                                member.status === "Late" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/20" :
                                                    "bg-muted text-muted-foreground"
                                            }`}>{member.status}</span>
                                        <span className="text-xs font-semibold text-foreground font-tabular">{member.score}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Chart */}
                <motion.div variants={fadeUp} className="lg:col-span-6">
                    <div className="rounded-2xl bg-card p-5 shadow-card h-full">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-semibold text-foreground">Weekly Task Volume</h2>
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barCategoryGap="30%">
                                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(240 4% 46%)" }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(240 4% 46%)" }} />
                                    <Tooltip contentStyle={{ borderRadius: "12px", border: "none", boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)", fontSize: "13px" }} />
                                    <Bar dataKey="tasks" fill="hsl(271, 76%, 53%)" radius={[6, 6, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
