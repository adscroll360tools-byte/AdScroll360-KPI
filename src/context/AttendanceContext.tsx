import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type AttendanceStatus = "Present" | "Late" | "Absent" | "Leave" | "Break" | "—";

export interface AttendanceRecord {
    id: string;
    userId: string;
    date: string; // YYYY-MM-DD
    checkInTime: string | null;
    checkOutTime: string | null;
    status: AttendanceStatus;
    breakStartTime: string | null;
    breakEndTime: string | null;
}

export interface BreakRequest {
    id: string;
    userId: string;
    date: string;
    reason: string;
    sessionTime: string; // duration or text
    status: "Pending" | "Approved" | "Rejected";
    requestedAt: string;
}

interface AttendanceContextType {
    records: AttendanceRecord[];
    breakRequests: BreakRequest[];
    checkIn: () => { success: boolean; error?: string; status?: AttendanceStatus };
    checkOut: () => { success: boolean; error?: string };
    requestBreak: (reason: string, sessionTime: string) => { success: boolean; error?: string };
    approveBreak: (requestId: string) => void;
    rejectBreak: (requestId: string) => void;
    endBreak: () => { success: boolean; error?: string };
    updateMemberAttendance: (userId: string, date: string, status: AttendanceStatus) => void;
}

const AttendanceContext = createContext<AttendanceContextType | null>(null);

const STORE_RECORDS = "adscroll360_attendance_records_v2";
const STORE_BREAKS = "adscroll360_break_requests_v2";

function loadData<T>(key: string, defaultValue: T): T {
    try {
        const d = localStorage.getItem(key);
        if (d) return JSON.parse(d);
    } catch {}
    return defaultValue;
}

export function AttendanceProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [records, setRecords] = useState<AttendanceRecord[]>(() => loadData(STORE_RECORDS, []));
    const [breakRequests, setBreakRequests] = useState<BreakRequest[]>(() => loadData(STORE_BREAKS, []));

    useEffect(() => {
        localStorage.setItem(STORE_RECORDS, JSON.stringify(records));
    }, [records]);

    useEffect(() => {
        localStorage.setItem(STORE_BREAKS, JSON.stringify(breakRequests));
    }, [breakRequests]);

    const getCurrentDateStr = () => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
    };

    const determineStatus = (time: Date): AttendanceStatus => {
        // Logic: 09:30 AM - 09:50 AM Present
        // 09:51 AM - 11:00 AM Late
        // After 11:01 AM Absent
        // For testing we will just compare hours and minutes
        const h = time.getHours();
        const m = time.getMinutes();
        const val = h * 60 + m; // minutes since midnight

        const t9_30 = 9 * 60 + 30;
        const t9_50 = 9 * 60 + 50;
        const t11_00 = 11 * 60;

        if (val <= t9_50) return "Present";
        if (val <= t11_00) return "Late";
        return "Absent";
    };

    const checkIn = () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const existing = records.find(r => r.userId === currentUser.id && r.date === date);
        if (existing && existing.checkInTime) {
            return { success: false, error: "Already checked in today" };
        }

        const now = new Date();
        const status = determineStatus(now);
        const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        const newRecord: AttendanceRecord = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            date,
            checkInTime: timeStr,
            checkOutTime: null,
            status,
            breakStartTime: null,
            breakEndTime: null,
        };

        if (existing) {
            setRecords(prev => prev.map(r => r.id === existing.id ? { ...r, checkInTime: timeStr, status } : r));
        } else {
            setRecords(prev => [...prev, newRecord]);
        }

        return { success: true, status };
    };

    const checkOut = () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || !record.checkInTime) return { success: false, error: "Not checked in yet" };
        if (record.checkOutTime) return { success: false, error: "Already checked out" };

        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        
        setRecords(prev => prev.map(r => r.id === record.id ? { ...r, checkOutTime: timeStr } : r));
        return { success: true };
    };

    // Break request system
    const requestBreak = (reason: string, sessionTime: string) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || !record.checkInTime) return { success: false, error: "Must check in first before requesting a break." };
        if (record.checkOutTime) return { success: false, error: "Already checked out." };
        if (record.status === "Break") return { success: false, error: "Already on break." };

        const pending = breakRequests.find(r => r.userId === currentUser.id && r.date === date && r.status === "Pending");
        if (pending) return { success: false, error: "You already have a pending break request." };

        const br: BreakRequest = {
            id: crypto.randomUUID(),
            userId: currentUser.id,
            date,
            reason,
            sessionTime,
            status: "Pending",
            requestedAt: new Date().toISOString(),
        };

        setBreakRequests(prev => [...prev, br]);
        return { success: true };
    };

    const approveBreak = (requestId: string) => {
        setBreakRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "Approved" } : r));
        const req = breakRequests.find(r => r.id === requestId);
        if (req) {
            const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            setRecords(prev => {
                const record = prev.find(r => r.userId === req.userId && r.date === req.date);
                if (record) {
                    return prev.map(r => r.id === record.id ? { ...r, status: "Break", breakStartTime: timeStr } : r);
                }
                return prev;
            });
        }
    };

    const rejectBreak = (requestId: string) => {
        setBreakRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "Rejected" } : r));
    };

    const endBreak = () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || record.status !== "Break") return { success: false, error: "Not currently on break." };

        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        // Need to restore previous status. For simplicity, re-run calculate based on check-in time or leave it as Present/Late.
        // Assuming check in time determines the base status:
        // Actually we can just keep Present or Late. 
        // Let's just set it relative to check in time.
        const baseStatus = determineStatus(new Date(getCurrentDateStr() + " " + record.checkInTime));
        // wait, parse time string "9:00 AM" back to Date to re-determine
        // simpler: assume original status was "Present" or "Late", but we didn't save it directly on the record if it changed to "Break".
        // Better way: determineStatus is based on checkInTime. Let's just restore it cleanly.

        setRecords(prev => prev.map(r => {
            if (r.id === record.id) {
                // Approximate restoring state - we'll just set it to Present to simplify, 
                // but realistically we should store the 'originalStatus'
                let restoredStatus: AttendanceStatus = "Present";
                if (r.checkInTime) {
                    const match = r.checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
                    if (match) {
                        let h = parseInt(match[1]);
                        const m = parseInt(match[2]);
                        if (match[3].toUpperCase() === "PM" && h !== 12) h += 12;
                        if (match[3].toUpperCase() === "AM" && h === 12) h = 0;
                        const tDate = new Date();
                        tDate.setHours(h, m, 0, 0);
                        restoredStatus = determineStatus(tDate);
                    }
                }
                return { ...r, status: restoredStatus, breakEndTime: timeStr };
            }
            return r;
        }));
        return { success: true };
    };

    const updateMemberAttendance = (userId: string, date: string, status: AttendanceStatus) => {
        setRecords(prev => {
            const existing = prev.find(r => r.userId === userId && r.date === date);
            if (existing) {
                return prev.map(r => r.id === existing.id ? { ...r, status } : r);
            } else {
                return [...prev, {
                    id: crypto.randomUUID(),
                    userId,
                    date,
                    checkInTime: null,
                    checkOutTime: null,
                    status,
                    breakStartTime: null,
                    breakEndTime: null
                }];
            }
        });
    };

    return (
        <AttendanceContext.Provider value={{ 
            records, breakRequests, checkIn, checkOut, requestBreak, approveBreak, rejectBreak, endBreak, updateMemberAttendance 
        }}>
            {children}
        </AttendanceContext.Provider>
    );
}

export function useAttendance() {
    const ctx = useContext(AttendanceContext);
    if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
    return ctx;
}
