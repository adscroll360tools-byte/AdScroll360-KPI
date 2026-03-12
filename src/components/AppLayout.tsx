import { useState, useRef, useEffect } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { Outlet } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bell, CheckCheck, ClipboardCheck, Trophy, AlertCircle, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/context/AuthContext";

interface Notification {
  id: number;
  title: string;
  description: string;
  time: string;
  read: boolean;
  icon: React.ElementType;
  iconColor: string;
}

const initialNotifications: Notification[] = [
  {
    id: 1,
    title: "Task Approved",
    description: "Your task \"Short Reel – Behind the Scenes\" was approved.",
    time: "2m ago",
    read: false,
    icon: CheckCheck,
    iconColor: "text-green-600 bg-green-100 dark:bg-green-900/30",
  },
  {
    id: 2,
    title: "KPI Target Updated",
    description: "Monthly KPI target for Video Editing has been updated to 22.",
    time: "1h ago",
    read: false,
    icon: Trophy,
    iconColor: "text-amber-600 bg-amber-100 dark:bg-amber-900/30",
  },
  {
    id: 3,
    title: "Task Pending Review",
    description: "\"LinkedIn Carousel – Agency Portfolio\" is awaiting review.",
    time: "3h ago",
    read: false,
    icon: ClipboardCheck,
    iconColor: "text-primary bg-primary/10",
  },
  {
    id: 4,
    title: "Attendance Reminder",
    description: "Don't forget to check out before end of day.",
    time: "5h ago",
    read: true,
    icon: AlertCircle,
    iconColor: "text-orange-600 bg-orange-100 dark:bg-orange-900/30",
  },
];

export function AppLayout() {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    if (notifOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [notifOpen]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const dismiss = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markRead = (id: number) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 flex items-center justify-between border-b bg-card px-4">
            <div className="flex items-center gap-3">
              <SidebarTrigger />
              <div className="h-5 w-px bg-border" />
              <span className="text-sm text-muted-foreground">
                {new Date().toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            <div className="flex items-center gap-3">
              {/* Notification Bell */}
              <div className="relative" ref={notifRef}>
                <button
                  id="notification-bell"
                  onClick={() => {
                    setNotifOpen((v) => !v);
                    if (!notifOpen) markRead; // mark unread as read when opened
                  }}
                  className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  aria-label="Notifications"
                >
                  <Bell className="h-[18px] w-[18px]" />
                  {unreadCount > 0 && (
                    <span className="absolute right-1.5 top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
                      {unreadCount}
                    </span>
                  )}
                </button>

                {/* Dropdown panel */}
                <AnimatePresence>
                  {notifOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.97 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.97 }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute right-0 top-11 z-50 w-80 rounded-2xl border bg-card shadow-xl"
                    >
                      {/* Header */}
                      <div className="flex items-center justify-between border-b px-4 py-3">
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
                          {unreadCount > 0 && (
                            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              {unreadCount} new
                            </span>
                          )}
                        </div>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllRead}
                            className="text-[11px] font-medium text-primary hover:underline"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>

                      {/* List */}
                      <div className="max-h-80 overflow-y-auto divide-y">
                        {notifications.length === 0 ? (
                          <div className="flex flex-col items-center justify-center py-10 text-center">
                            <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">No notifications</p>
                          </div>
                        ) : (
                          notifications.map((notif) => {
                            const Icon = notif.icon;
                            return (
                              <div
                                key={notif.id}
                                onClick={() => markRead(notif.id)}
                                className={`group relative flex gap-3 px-4 py-3 transition-colors cursor-pointer hover:bg-muted/50 ${!notif.read ? "bg-primary/[0.03]" : ""
                                  }`}
                              >
                                {/* Unread indicator */}
                                {!notif.read && (
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 h-1.5 w-1.5 rounded-full bg-primary" />
                                )}
                                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${notif.iconColor}`}>
                                  <Icon className="h-4 w-4" />
                                </div>
                                <div className="min-w-0 flex-1">
                                  <p className="text-xs font-medium text-foreground">{notif.title}</p>
                                  <p className="mt-0.5 text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                                    {notif.description}
                                  </p>
                                  <p className="mt-1 text-[10px] text-muted-foreground/70">{notif.time}</p>
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    dismiss(notif.id);
                                  }}
                                  className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded-md hover:bg-muted"
                                >
                                  <X className="h-3 w-3 text-muted-foreground" />
                                </button>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Footer */}
                      {notifications.length > 0 && (
                        <div className="border-t px-4 py-2.5 text-center">
                          <button
                            onClick={() => setNotifications([])}
                            className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
                          >
                            Clear all notifications
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* User */}
              <div className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-xs font-medium">
                    {currentUser?.name.slice(0, 2).toUpperCase() ?? "CA"}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-medium leading-none text-foreground">{currentUser?.name ?? "Admin"}</p>
                  <p className="text-[11px] text-muted-foreground">Core Admin</p>
                </div>
              </div>
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
