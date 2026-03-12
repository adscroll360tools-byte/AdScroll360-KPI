import { motion } from "framer-motion";
import { Trophy, Medal, Star, Crown } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const leaderboard = [
  { rank: 1, name: "Fahad", role: "Video Editor", score: 92, tasks: 48, badge: "Top Performer" },
  { rank: 2, name: "Ijaz", role: "Graphic Designer", score: 88, tasks: 44, badge: "Consistent" },
  { rank: 3, name: "Nafih", role: "Project Manager", score: 85, tasks: 41, badge: null },
  { rank: 4, name: "Ajmal", role: "Content Writer", score: 82, tasks: 39, badge: null },
  { rank: 5, name: "Aboobacker", role: "Marketing Lead", score: 79, tasks: 36, badge: null },
  { rank: 6, name: "Naimuddin", role: "Business Analyst", score: 76, tasks: 33, badge: null },
];

const rankIcons: Record<number, React.ReactNode> = {
  1: <Crown className="h-5 w-5 text-warning" />,
  2: <Medal className="h-5 w-5 text-muted-foreground" />,
  3: <Medal className="h-5 w-5 text-warning" />,
};

import { stagger, fadeUp } from "@/lib/animations";

export default function LeaderboardPage() {
  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      <motion.div variants={fadeUp} className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Weekly Leaderboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">Week of March 10 – 14, 2026</p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-accent/15 px-3 py-1.5">
          <Trophy className="h-4 w-4 text-accent" />
          <span className="text-xs font-medium text-accent">Published</span>
        </div>
      </motion.div>

      {/* Top 3 highlight */}
      <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
        {leaderboard.slice(0, 3).map((person, i) => (
          <div
            key={person.name}
            className={`flex flex-col items-center rounded-2xl p-5 text-center shadow-card transition-shadow hover:shadow-card-hover ${
              i === 0 ? "bg-primary text-primary-foreground" : "bg-card"
            }`}
          >
            <div className="mb-2">{rankIcons[person.rank]}</div>
            <Avatar className="mb-2 h-12 w-12">
              <AvatarFallback className={`font-medium ${i === 0 ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-foreground"}`}>
                {person.name.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <p className="text-sm font-semibold">{person.name}</p>
            <p className={`text-xs ${i === 0 ? "opacity-70" : "text-muted-foreground"}`}>{person.role}</p>
            <p className="font-tabular mt-2 text-2xl font-bold">{person.score}</p>
            <p className={`text-[11px] ${i === 0 ? "opacity-60" : "text-muted-foreground"}`}>points</p>
          </div>
        ))}
      </motion.div>

      {/* Full table */}
      <motion.div variants={fadeUp} className="rounded-2xl bg-card shadow-card overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Rank</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Employee</th>
              <th className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Role</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Tasks</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Score</th>
              <th className="px-4 py-3 text-right text-[11px] font-medium uppercase tracking-wider text-muted-foreground">Badge</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((person) => (
              <tr key={person.name} className="border-b last:border-0 transition-colors hover:bg-muted">
                <td className="px-4 py-3">
                  <span className="font-tabular text-sm font-semibold text-foreground">#{person.rank}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
                        {person.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium text-foreground">{person.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground">{person.role}</td>
                <td className="px-4 py-3 text-right font-tabular text-sm text-foreground">{person.tasks}</td>
                <td className="px-4 py-3 text-right font-tabular text-sm font-semibold text-foreground">{person.score}</td>
                <td className="px-4 py-3 text-right">
                  {person.badge ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent/15 px-2.5 py-0.5 text-[11px] font-medium text-accent">
                      <Star className="h-3 w-3" />
                      {person.badge}
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}
