import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
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
    checkIn: () => Promise<{ success: boolean; error?: string; status?: AttendanceStatus }>;
    checkOut: () => Promise<{ success: boolean; error?: string }>;
    requestBreak: (reason: string, sessionTime: string) => Promise<{ success: boolean; error?: string }>;
    approveBreak: (requestId: string) => Promise<void>;
    rejectBreak: (requestId: string) => Promise<void>;
    endBreak: () => Promise<{ success: boolean; error?: string }>;
    updateMemberAttendance: (userId: string, date: string, status: AttendanceStatus) => Promise<void>;
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
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [breakRequests, setBreakRequests] = useState<BreakRequest[]>([]);
    const [loading, setLoading] = useState(true);

    // Initial load from Supabase
    useEffect(() => {
        const fetchData = async () => {
            if (!currentUser) return;
            
            try {
                // Fetch attendance records
                const { data: attData, error: attError } = await supabase
                    .from('attendance')
                    .select('*');
                
                if (attData) {
                    const mapped: AttendanceRecord[] = attData.map((r: any) => ({
                        id: r.id,
                        userId: r.user_id,
                        date: r.date,
                        status: r.status,
                        checkInTime: r.check_in_time,
                        checkOutTime: r.check_out_time,
                        breakStartTime: r.break_start_time,
                        breakEndTime: r.break_end_time
                    }));
                    setRecords(mapped);
                }

                // Fetch break requests
                const { data: brData, error: brError } = await supabase
                    .from('break_requests')
                    .select('*');
                
                if (brData) {
                    const mapped: BreakRequest[] = brData.map((r: any) => ({
                        id: r.id,
                        userId: r.user_id,
                        date: r.date,
                        reason: r.reason,
                        sessionTime: r.session_time,
                        status: r.status,
                        requestedAt: r.requested_at
                    }));
                    setBreakRequests(mapped);
                }
            } catch (err) {
                console.error("Error loading attendance data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [currentUser]);

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

    const checkIn = async () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const existing = records.find(r => r.userId === currentUser.id && r.date === date);
        if (existing && existing.checkInTime) {
            return { success: false, error: "Already checked in today" };
        }

        const now = new Date();
        const status = determineStatus(now);
        const timeStr = now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        const newRecord = {
            user_id: currentUser.id,
            date,
            check_in_time: timeStr,
            status: status
        };

        const { data, error } = await supabase
            .from('attendance')
            .upsert(newRecord, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        const mapped: AttendanceRecord = {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            status: data.status,
            checkInTime: data.check_in_time,
            checkOutTime: data.check_out_time,
            breakStartTime: data.break_start_time,
            breakEndTime: data.break_end_time
        };

        setRecords(prev => {
            const index = prev.findIndex(r => r.userId === currentUser.id && r.date === date);
            if (index !== -1) {
                const updated = [...prev];
                updated[index] = mapped;
                return updated;
            }
            return [...prev, mapped];
        });

        return { success: true, status };
    };

    const checkOut = async () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || !record.checkInTime) return { success: false, error: "Not checked in yet" };
        if (record.checkOutTime) return { success: false, error: "Already checked out" };

        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
        
        const { error } = await supabase
            .from('attendance')
            .update({ check_out_time: timeStr })
            .eq('id', record.id);

        if (error) return { success: false, error: error.message };

        setRecords(prev => prev.map(r => r.id === record.id ? { ...r, checkOutTime: timeStr } : r));
        return { success: true };
    };

    // Break request system
    const requestBreak = async (reason: string, sessionTime: string) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || !record.checkInTime) return { success: false, error: "Must check in first before requesting a break." };
        if (record.checkOutTime) return { success: false, error: "Already checked out." };
        if (record.status === "Break") return { success: false, error: "Already on break." };

        const pending = breakRequests.find(r => r.userId === currentUser.id && r.date === date && r.status === "Pending");
        if (pending) return { success: false, error: "You already have a pending break request." };

        const br = {
            user_id: currentUser.id,
            date,
            reason,
            session_time: sessionTime,
            status: "Pending",
        };

        const { data, error } = await supabase
            .from('break_requests')
            .insert([br])
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        const mapped: BreakRequest = {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            reason: data.reason,
            sessionTime: data.session_time,
            status: data.status,
            requestedAt: data.requested_at
        };

        setBreakRequests(prev => [...prev, mapped]);
        return { success: true };
    };

    const approveBreak = async (requestId: string) => {
        const { error: brError } = await supabase
            .from('break_requests')
            .update({ status: "Approved" })
            .eq('id', requestId);

        if (brError) return;

        setBreakRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "Approved" } : r));
        const req = breakRequests.find(r => r.id === requestId);
        if (req) {
            const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
            
            await supabase
                .from('attendance')
                .update({ status: "Break", break_start_time: timeStr })
                .eq('user_id', req.userId)
                .eq('date', req.date);

            setRecords(prev => {
                const record = prev.find(r => r.userId === req.userId && r.date === req.date);
                if (record) {
                    return prev.map(r => r.id === record.id ? { ...r, status: "Break", breakStartTime: timeStr } : r);
                }
                return prev;
            });
        }
    };

    const rejectBreak = async (requestId: string) => {
        await supabase
            .from('break_requests')
            .update({ status: "Rejected" })
            .eq('id', requestId);
            
        setBreakRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: "Rejected" } : r));
    };

    const endBreak = async () => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const date = getCurrentDateStr();
        const record = records.find(r => r.userId === currentUser.id && r.date === date);
        if (!record || record.status !== "Break") return { success: false, error: "Not currently on break." };

        const timeStr = new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });

        // Restore status based on check-in time
        let restoredStatus: AttendanceStatus = "Present";
        if (record.checkInTime) {
            const match = record.checkInTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
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

        const { error } = await supabase
            .from('attendance')
            .update({ status: restoredStatus, break_end_time: timeStr })
            .eq('id', record.id);

        if (error) return { success: false, error: error.message };

        setRecords(prev => prev.map(r => {
            if (r.id === record.id) {
                return { ...r, status: restoredStatus, breakEndTime: timeStr };
            }
            return r;
        }));
        return { success: true };
    };

    const updateMemberAttendance = async (userId: string, date: string, status: AttendanceStatus) => {
        const { data, error } = await supabase
            .from('attendance')
            .upsert({ user_id: userId, date, status }, { onConflict: 'user_id,date' })
            .select()
            .single();

        if (error) return;

        const mapped: AttendanceRecord = {
            id: data.id,
            userId: data.user_id,
            date: data.date,
            status: data.status,
            checkInTime: data.check_in_time,
            checkOutTime: data.check_out_time,
            breakStartTime: data.break_start_time,
            breakEndTime: data.break_end_time
        };

        setRecords(prev => {
            const existing = prev.find(r => r.userId === userId && r.date === date);
            if (existing) {
                return prev.map(r => r.id === existing.id ? mapped : r);
            } else {
                return [...prev, mapped];
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
