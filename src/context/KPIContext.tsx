import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useAuth } from "./AuthContext";

export type KPIType = "Company" | "Group" | "Individual";

export interface AppKPI {
    id: string;
    title: string;
    description?: string;
    type: KPIType;
    target: number;
    current: number;
    unit: string; // e.g., leads, pieces, %, etc.
    dailyMin?: number;
    dailyMax?: number;
    assignedToId?: string; // Only for Individual KPI
    assignedToName?: string;
    groupId?: string; // Only for Group KPI (e.g. Design Team, Video Team)
    createdAt: string;
}

export interface QualityMetric {
    id: string;
    metric: string;
    weight: number;
    description: string;
}

export interface AppQualityScore {
    id: string;
    employeeId: string;
    score: number;
    breakdown: Record<string, number>; // metricId -> score (0-100)
    month: string; // YYYY-MM
    createdAt: string;
}

interface KPIContextType {
    kpis: AppKPI[];
    qualityMetrics: QualityMetric[];
    qualityScores: AppQualityScore[];
    createKPI: (kpi: Omit<AppKPI, "id" | "createdAt" | "current">) => { success: boolean; error?: string };
    updateKPIProgress: (kpiId: string, progress: number) => { success: boolean; error?: string };
    deleteKPI: (kpiId: string) => { success: boolean; error?: string };
    updateQualityMetrics: (metrics: QualityMetric[]) => { success: boolean; error?: string };
    addQualityScore: (score: Omit<AppQualityScore, "id" | "createdAt">) => { success: boolean; error?: string };
}

const KPIContext = createContext<KPIContextType | null>(null);

const STORE_KEY = "adscroll360_kpis_v4";
const METRICS_KEY = "adscroll360_metrics_v4";
const SCORES_KEY = "adscroll360_scores_v4";

const DEFAULT_METRICS: QualityMetric[] = [
    { id: "1", metric: "Quality", weight: 40, description: "Accuracy, detail, and polish" },
    { id: "2", metric: "Creativity", weight: 30, description: "Originality and innovation" },
    { id: "3", metric: "Communication", weight: 15, description: "Clarity and responsiveness" },
    { id: "4", metric: "Task Completion", weight: 15, description: "On-time delivery rate" },
];

function loadKPIs(): AppKPI[] {
    try {
        const d = localStorage.getItem(STORE_KEY);
        if (d) return JSON.parse(d);
    } catch {}
    return [];
}

function loadMetrics(): QualityMetric[] {
    try {
        const d = localStorage.getItem(METRICS_KEY);
        if (d) return JSON.parse(d);
    } catch {}
    return DEFAULT_METRICS;
}

function loadScores(): AppQualityScore[] {
    try {
        const d = localStorage.getItem(SCORES_KEY);
        if (d) return JSON.parse(d);
    } catch {}
    return [];
}

export function KPIProvider({ children }: { children: ReactNode }) {
    const { currentUser } = useAuth();
    const [kpis, setKPIs] = useState<AppKPI[]>(loadKPIs);
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>(loadMetrics);
    const [qualityScores, setQualityScores] = useState<AppQualityScore[]>(loadScores);

    useEffect(() => {
        localStorage.setItem(STORE_KEY, JSON.stringify(kpis));
    }, [kpis]);

    useEffect(() => {
        localStorage.setItem(METRICS_KEY, JSON.stringify(qualityMetrics));
    }, [qualityMetrics]);

    useEffect(() => {
        localStorage.setItem(SCORES_KEY, JSON.stringify(qualityScores));
    }, [qualityScores]);

    const createKPI = (k: Omit<AppKPI, "id" | "createdAt" | "current">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        if (currentUser.role === "employee") return { success: false, error: "Employees cannot create KPIs" };
        if (k.type === "Company" && currentUser.role !== "admin") return { success: false, error: "Only Admins can create Company KPIs" };

        const newKPI: AppKPI = {
            ...k,
            id: crypto.randomUUID(),
            current: 0,
            createdAt: new Date().toISOString()
        };

        setKPIs(prev => [...prev, newKPI]);
        return { success: true };
    };

    const updateKPIProgress = (kpiId: string, currentVal: number) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const kpi = kpis.find(k => k.id === kpiId);
        if (!kpi) return { success: false, error: "KPI not found" };

        if (kpi.type === "Company" && currentUser.role !== "admin") return { success: false, error: "Only Admins can edit Company KPIs" };
        if (kpi.type === "Group" && currentUser.role === "employee") return { success: false, error: "Employees cannot update Group KPIs" };
        if (kpi.type === "Individual" && currentUser.role === "employee" && kpi.assignedToId !== currentUser.id) return { success: false, error: "You can only edit your own Individual KPIs" };

        setKPIs(prev => prev.map(k => k.id === kpiId ? { ...k, current: currentVal } : k));
        return { success: true };
    };

    const deleteKPI = (kpiId: string) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        const kpi = kpis.find(k => k.id === kpiId);
        if (!kpi) return { success: false, error: "KPI not found" };

        if (currentUser.role === "employee") return { success: false, error: "Employees cannot delete KPIs" };
        if (kpi.type === "Company" && currentUser.role !== "admin") return { success: false, error: "Only Admins can delete Company KPIs" };

        setKPIs(prev => prev.filter(k => k.id !== kpiId));
        return { success: true };
    };

    const updateQualityMetrics = (metrics: QualityMetric[]) => {
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "controller")) {
            return { success: false, error: "Unauthorized" };
        }
        setQualityMetrics(metrics);
        return { success: true };
    };

    const addQualityScore = (s: Omit<AppQualityScore, "id" | "createdAt">) => {
        if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "controller")) {
            return { success: false, error: "Unauthorized" };
        }
        const newScore: AppQualityScore = {
            ...s,
            id: crypto.randomUUID(),
            createdAt: new Date().toISOString()
        };
        // Remove old score for same month/emp if exists
        setQualityScores(prev => [newScore, ...prev.filter(x => !(x.employeeId === s.employeeId && x.month === s.month))]);
        return { success: true };
    };

    return (
        <KPIContext.Provider value={{ kpis, qualityMetrics, qualityScores, createKPI, updateKPIProgress, deleteKPI, updateQualityMetrics, addQualityScore }}>
            {children}
        </KPIContext.Provider>
    );
}

export function useKPI() {
    const ctx = useContext(KPIContext);
    if (!ctx) throw new Error("useKPI must be used within KPIProvider");
    return ctx;
}
