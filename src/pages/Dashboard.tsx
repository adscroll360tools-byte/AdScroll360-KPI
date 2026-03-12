import { motion } from "framer-motion";
import { StatCard } from "@/components/StatCard";
import { KPIProgressBar } from "@/components/KPIProgressBar";
import {
  ClipboardCheck,
  CalendarClock,
  Trophy,
  Target,
  TrendingUp,
  Clock,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const weeklyData = [
  { day: "Mon", tasks: 5 },
  { day: "Tue", tasks: 7 },
  { day: "Wed", tasks: 4 },
  { day: "Thu", tasks: 6 },
  { day: "Fri", tasks: 8 },
];

const todayTasks = [
  { id: 1, title: "Instagram Reel – Product Launch", category: "Video Editing", status: "In Progress", time: "2h 15m" },
  { id: 2, title: "Blog: 5 SEO Tips for 2026", category: "Content Writing", status: "Completed", time: "1h 30m" },
  { id: 3, title: "Facebook Ad Creative – Spring Sale", category: "Poster Design", status: "Pending", time: "—" },
];

const statusColors: Record<string, string> = {
  Completed: "bg-accent/15 text-accent",
  "In Progress": "bg-primary/15 text-primary",
  Pending: "bg-muted text-muted-foreground",
};

import { stagger, fadeUp } from "@/lib/animations";

export default function Dashboard() {
  const navigate = useNavigate();
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Today is for <span className="text-primary">Video Editing</span>.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Thursday, March 12 · Reel & short video creation day</p>
        </div>
        <Button
          id="submit-task-btn"
          className="hidden h-10 gap-2 rounded-lg px-5 text-sm font-medium sm:flex"
          onClick={() => navigate("/tasks")}
        >
          Submit Task <ArrowRight className="h-4 w-4" />
        </Button>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={fadeUp} className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Tasks Today" value="3" subtitle="1 completed" icon={ClipboardCheck} />
        <StatCard title="Attendance" value="On Time" subtitle="Checked in at 8:55 AM" icon={CalendarClock} variant="primary" />
        <StatCard title="Weekly Score" value="88" subtitle="Good Performance" icon={Trophy} trend={{ value: "+4 vs last week", positive: true }} />
        <StatCard title="Monthly KPI" value="72%" subtitle="15 days remaining" icon={Target} />
      </motion.div>

      {/* Main content */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Tasks */}
        <motion.div variants={fadeUp} className="lg:col-span-7">
          <div className="rounded-2xl bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Today's Tasks</h2>
              <span className="font-tabular text-xs text-muted-foreground">3 tasks</span>
            </div>
            <div className="space-y-1">
              {todayTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between rounded-xl px-3 py-3 transition-colors hover:bg-muted"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{task.title}</p>
                    <p className="text-xs text-muted-foreground">{task.category}</p>
                  </div>
                  <div className="flex items-center gap-3">
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
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-semibold text-foreground">Monthly Progress</h2>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-5">
              <KPIProgressBar label="Written Content" current={32} target={55} unit="pieces" />
              <KPIProgressBar label="Poster Designs" current={18} target={35} />
              <KPIProgressBar label="Videos" current={12} target={22} />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Chart */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-card p-5 shadow-card">
        <h2 className="mb-4 text-base font-semibold text-foreground">Weekly Task Completion</h2>
        <div className="h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(240 6% 90%)" vertical={false} />
              <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(240 4% 46%)" }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "hsl(240 4% 46%)" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "none",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,.1)",
                  fontSize: "13px",
                }}
              />
              <Bar dataKey="tasks" fill="hsl(217, 91%, 60%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </motion.div>
  );
}
