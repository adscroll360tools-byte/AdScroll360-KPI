import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";
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
    createKPI: (kpi: Omit<AppKPI, "id" | "createdAt" | "current">) => Promise<{ success: boolean; error?: string }>;
    updateKPIProgress: (kpiId: string, progress: number) => Promise<{ success: boolean; error?: string }>;
    deleteKPI: (kpiId: string) => Promise<{ success: boolean; error?: string }>;
    updateQualityMetrics: (metrics: QualityMetric[]) => Promise<{ success: boolean; error?: string }>;
    addQualityScore: (score: Omit<AppQualityScore, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
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
    const [kpis, setKPIs] = useState<AppKPI[]>([]);
    const [qualityMetrics, setQualityMetrics] = useState<QualityMetric[]>([]);
    const [qualityScores, setQualityScores] = useState<AppQualityScore[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchKPIs = async () => {
            if (!currentUser) return;
            try {
                // Fetch KPIs
                const { data: kData } = await supabase.from('kpis').select('*');
                if (kData) {
                    setKPIs(kData.map((k: any) => ({
                        id: k.id,
                        title: k.title,
                        description: k.description,
                        type: k.type,
                        target: k.target,
                        current: k.current,
                        unit: k.unit,
                        dailyMin: k.daily_min,
                        dailyMax: k.daily_max,
                        assignedToId: k.assigned_to_id,
                        groupId: k.group_id,
                        createdAt: k.created_at
                    })));
                }

                // Fetch Metrics
                const { data: mData } = await supabase.from('quality_metrics').select('*');
                if (mData) {
                    setQualityMetrics(mData.map((m: any) => ({
                        id: m.id,
                        metric: m.metric,
                        weight: m.weight,
                        description: m.description
                    })));
                }

                // Fetch Scores
                const { data: sData } = await supabase.from('quality_scores').select('*');
                if (sData) {
                    setQualityScores(sData.map((s: any) => ({
                        id: s.id,
                        employeeId: s.employee_id,
                        score: s.score,
                        breakdown: s.breakdown,
                        month: s.month,
                        createdAt: s.created_at
                    })));
                }
            } catch (err) {
                console.error("Error fetching KPI data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchKPIs();
    }, [currentUser]);

    const createKPI = async (k: Omit<AppKPI, "id" | "createdAt" | "current">) => {
        if (!currentUser) return { success: false, error: "Not logged in" };
        
        const newKPI = {
            title: k.title,
            description: k.description,
            type: k.type,
            target: k.target,
            unit: k.unit,
            daily_min: k.dailyMin,
            daily_max: k.dailyMax,
            assigned_to_id: k.assignedToId,
            group_id: k.groupId,
        };

        const { data, error } = await supabase
            .from('kpis')
            .insert([newKPI])
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        setKPIs(prev => [...prev, {
            ...k,
            id: data.id,
            current: 0,
            createdAt: data.created_at
        } as AppKPI]);
        return { success: true };
    };

    const updateKPIProgress = async (kpiId: string, currentVal: number) => {
        const { error } = await supabase
            .from('kpis')
            .update({ current: currentVal })
            .eq('id', kpiId);

        if (error) return { success: false, error: error.message };

        setKPIs(prev => prev.map(k => k.id === kpiId ? { ...k, current: currentVal } : k));
        return { success: true };
    };

    const deleteKPI = async (kpiId: string) => {
        const { error } = await supabase
            .from('kpis')
            .delete()
            .eq('id', kpiId);

        if (error) return { success: false, error: error.message };

        setKPIs(prev => prev.filter(k => k.id !== kpiId));
        return { success: true };
    };

    const updateQualityMetrics = async (metrics: QualityMetric[]) => {
        // For simplicity, we'll just upsert them
        for (const m of metrics) {
             await supabase.from('quality_metrics').upsert({
                id: m.id,
                metric: m.metric,
                weight: m.weight,
                description: m.description
            });
        }
        setQualityMetrics(metrics);
        return { success: true };
    };

    const addQualityScore = async (s: Omit<AppQualityScore, "id" | "createdAt">) => {
        const newScore = {
            employee_id: s.employeeId,
            score: s.score,
            breakdown: s.breakdown,
            month: s.month
        };

        const { data, error } = await supabase
            .from('quality_scores')
            .insert([newScore])
            .select()
            .single();

        if (error) return { success: false, error: error.message };

        setQualityScores(prev => [
            { ...s, id: data.id, createdAt: data.created_at },
            ...prev.filter(x => !(x.employeeId === s.employeeId && x.month === s.month))
        ]);
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
