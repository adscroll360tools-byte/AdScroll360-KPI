import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth, UserRole } from "./AuthContext";

export type TaskStatus = "Pending" | "In Progress" | "Completed" | "Approved";

export interface TaskMessage {
    id: string;
    senderId: string;
    senderName: string;
    text: string;
    fileUrl?: string; // dummy for file sharing
    timestamp: string;
}

export interface TaskSubmission {
    textExplanation?: string;
    proofImageUrl?: string;
    urlLink?: string;
    documentUrl?: string;
    submittedAt: string;
}

export interface AppTask {
    id: string;
    title: string;
    category: string;
    assigneeId: string; // User ID
    assigneeName: string; 
    assignedById: string; 
    assignedByName: string;
    kpiRelationId?: string; 
    kpiRelationName?: string;
    type: "Individual" | "Group";
    status: TaskStatus;
    deadline: string; 
    timeSpent: string;
    notes?: string;
    createdAt: string;
    messages: TaskMessage[];
    submission?: TaskSubmission;
}

interface TaskContextType {
    tasks: AppTask[];
    createTask: (task: Omit<AppTask, "id" | "createdAt" | "messages" | "submission">) => Promise<{ success: boolean; error?: string }>;
    updateTaskStatus: (taskId: string, status: TaskStatus) => Promise<{ success: boolean; error?: string }>;
    submitTaskProof: (taskId: string, submission: Omit<TaskSubmission, "submittedAt">) => Promise<{ success: boolean; error?: string }>;
    addMessage: (taskId: string, text: string, fileUrl?: string) => Promise<{ success: boolean; error?: string }>;
    deleteTask: (taskId: string) => Promise<{ success: boolean; error?: string }>;
}

const TaskContext = createContext<TaskContextType | null>(null);

const STORE_KEY = "adscroll360_tasks_v2";

function loadTasks(): AppTask[] {
    try {
        const t = localStorage.getItem(STORE_KEY);
        if (t) return JSON.parse(t);
    } catch {}
    return [];
}

export function TaskProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [tasks, setTasks] = useState<AppTask[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTasks = async () => {
            if (!currentUser) return;
            try {
                const { data, error } = await supabase
                    .from('tasks')
                    .select('*')
                    .order('created_at', { ascending: false });
                
                if (data) {
                    const mapped: AppTask[] = data.map((t: any) => ({
                        id: t.id,
                        title: t.title,
                        category: t.category,
                        assigneeId: t.assignee_id,
                        assigneeName: t.assignee_id, // We'll need a join or local lookup to get name
                        assignedById: t.assigned_by_id,
                        assignedByName: t.assigned_by_id,
                        kpiRelationId: t.kpi_relation_id,
                        type: t.type,
                        status: t.status,
                        deadline: t.deadline,
                        timeSpent: t.time_spent,
                        notes: t.notes,
                        createdAt: t.created_at,
                        messages: t.messages || [],
                        submission: t.submission
                    }));
                    setTasks(mapped);
                }
            } catch (err) {
                console.error("Error fetching tasks:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchTasks();
    }, [currentUser]);

    const createTask = async (t: Omit<AppTask, "id" | "createdAt" | "messages" | "submission">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        if (currentUser.role === "employee") return { success: false, error: "Employees cannot create tasks" };

        const newTask = {
            title: t.title,
            category: t.category,
            assignee_id: t.assigneeId,
            assigned_by_id: currentUser.id,
            kpi_relation_id: t.kpiRelationId,
            type: t.type,
            status: t.status,
            deadline: t.deadline,
            time_spent: t.timeSpent,
            notes: t.notes,
            messages: []
        };
        
        const { data, error } = await supabase
            .from('tasks')
            .insert([newTask])
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        const mapped: AppTask = {
            id: data.id,
            title: data.title,
            category: data.category,
            assigneeId: data.assignee_id,
            assigneeName: data.assignee_id,
            assignedById: data.assigned_by_id,
            assignedByName: data.assigned_by_id,
            kpiRelationId: data.kpi_relation_id,
            type: data.type,
            status: data.status,
            deadline: data.deadline,
            timeSpent: data.time_spent,
            notes: data.notes,
            createdAt: data.created_at,
            messages: data.messages,
            submission: data.submission
        };

        setTasks(prev => [mapped, ...prev]);
        return { success: true };
    };

    const updateTaskStatus = async (taskId: string, status: TaskStatus) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { success: false, error: "Task not found" };

        const { error } = await supabase
            .from('tasks')
            .update({ status })
            .eq('id', taskId);

        if (error) return { success: false, error: error.message };

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        return { success: true };
    };

    const submitTaskProof = async (taskId: string, sub: Omit<TaskSubmission, "submittedAt">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { success: false, error: "Task not found" };

        const submission: TaskSubmission = {
            ...sub,
            submittedAt: new Date().toISOString()
        };

        const { error } = await supabase
            .from('tasks')
            .update({ submission, status: "Completed" })
            .eq('id', taskId);

        if (error) return { success: false, error: error.message };

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, submission, status: "Completed" } : t));
        return { success: true };
    };

    const addMessage = async (taskId: string, text: string, fileUrl?: string) => {
        if (!currentUser) return { success: false, error: "Not logged in" };

        const task = tasks.find(t => t.id === taskId);
        if (!task) return { success: false, error: "Task not found" };

        const msg: TaskMessage = {
            id: crypto.randomUUID(),
            senderId: currentUser.id,
            senderName: currentUser.name,
            text,
            fileUrl,
            timestamp: new Date().toISOString(),
        };

        const updatedMessages = [...task.messages, msg];

        const { error } = await supabase
            .from('tasks')
            .update({ messages: updatedMessages })
            .eq('id', taskId);

        if (error) return { success: false, error: error.message };

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, messages: updatedMessages } : t));
        return { success: true };
    };

    const deleteTask = async (taskId: string) => {
        if (currentUser?.role !== "admin" && currentUser?.role !== "controller") {
            return { success: false, error: "No permission to delete" };
        }

        const { error } = await supabase
            .from('tasks')
            .delete()
            .eq('id', taskId);

        if (error) return { success: false, error: error.message };

        setTasks(prev => prev.filter(t => t.id !== taskId));
        return { success: true };
    };

    return (
        <TaskContext.Provider value={{
            tasks, createTask, updateTaskStatus, submitTaskProof, addMessage, deleteTask
        }}>
            {children}
        </TaskContext.Provider>
    );
}

export function useTask() {
    const ctx = useContext(TaskContext);
    if (!ctx) throw new Error("useTask must be used within TaskProvider");
    return ctx;
}
