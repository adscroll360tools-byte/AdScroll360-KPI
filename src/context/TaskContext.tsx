import { createContext, useContext, useState, useEffect, ReactNode } from "react";
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
    createTask: (task: Omit<AppTask, "id" | "createdAt" | "messages" | "submission">) => { success: boolean; error?: string };
    updateTaskStatus: (taskId: string, status: TaskStatus) => { success: boolean; error?: string };
    submitTaskProof: (taskId: string, submission: Omit<TaskSubmission, "submittedAt">) => { success: boolean; error?: string };
    addMessage: (taskId: string, text: string, fileUrl?: string) => { success: boolean; error?: string };
    deleteTask: (taskId: string) => { success: boolean; error?: string };
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
    const [tasks, setTasks] = useState<AppTask[]>(loadTasks);

    useEffect(() => {
        localStorage.setItem(STORE_KEY, JSON.stringify(tasks));
    }, [tasks]);

    const createTask = (t: Omit<AppTask, "id" | "createdAt" | "messages" | "submission">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        if (currentUser.role === "employee") return { success: false, error: "Employees cannot create tasks" };

        const newTask: AppTask = {
            ...t,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString(),
            messages: []
        };
        
        setTasks(prev => [newTask, ...prev]);
        return { success: true };
    };

    const updateTaskStatus = (taskId: string, status: TaskStatus) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { success: false, error: "Task not found" };

        if (currentUser.role === "employee" && task.assigneeId !== currentUser.id) {
            return { success: false, error: "You can only update your own tasks" };
        }

        if (currentUser.role === "employee" && status === "Approved") {
            return { success: false, error: "Only Admins/Controllers can approve tasks" };
        }

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status } : t));
        return { success: true };
    };

    const submitTaskProof = (taskId: string, sub: Omit<TaskSubmission, "submittedAt">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        
        const task = tasks.find(t => t.id === taskId);
        if (!task) return { success: false, error: "Task not found" };

        if (currentUser.role === "employee" && task.assigneeId !== currentUser.id) {
            return { success: false, error: "You can only submit your own tasks" };
        }

        const submission: TaskSubmission = {
            ...sub,
            submittedAt: new Date().toISOString()
        };

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, submission, status: "Completed" } : t));
        return { success: true };
    };

    const addMessage = (taskId: string, text: string, fileUrl?: string) => {
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

        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, messages: [...t.messages, msg] } : t));
        return { success: true };
    };

    const deleteTask = (taskId: string) => {
        if (currentUser?.role !== "admin" && currentUser?.role !== "controller") {
            return { success: false, error: "No permission to delete" };
        }
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
