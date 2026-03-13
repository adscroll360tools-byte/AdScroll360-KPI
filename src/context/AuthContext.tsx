import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/lib/supabase";

export type UserRole = "admin" | "controller" | "employee";

export interface AppUser {
    id: string;
    name: string;
    email: string;
    password: string; // plain text for demo; in production use hashed
    role: UserRole;
    department?: string;
    position?: string;
    createdAt: string;
}

interface AuthContextType {
    currentUser: AppUser | null;
    users: AppUser[];
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string; role?: UserRole }>;
    logout: () => void;
    addUser: (user: Omit<AppUser, "id" | "createdAt">) => Promise<{ success: boolean; error?: string }>;
    updateUser: (id: string, updates: Partial<AppUser>) => Promise<void>;
    removeUser: (id: string) => Promise<void>;
    changePassword: (id: string, currentPw: string, newPw: string) => Promise<{ success: boolean; error?: string }>;
    forceResetPassword: (id: string, newPw: string) => Promise<{ success: boolean; error?: string }>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "adscroll360_users_v3";
const SESSION_KEY = "adscroll360_session_v3";

const DEFAULT_ADMIN: AppUser = {
    id: "admin-001",
    name: "Basith",
    email: "basith@adscroll360.com",
    password: "AAAAAAAAAA@123456789",
    role: "admin",
    department: "CEO",
    position: "Admin Control",
    createdAt: new Date().toISOString(),
};

const INITIAL_TEAM: AppUser[] = [
    DEFAULT_ADMIN,
    {
        id: "ctrl-001",
        name: "Nafih",
        email: "nafih@adscroll360.com",
        password: "Nafih@123",
        role: "controller",
        position: "Project Manager",
        department: "Management",
        createdAt: new Date().toISOString(),
    },
    { id: "emp-001", name: "Aboobacker", email: "aboobacker@adscroll360.com", password: "Aboobacker@123", role: "employee", position: "Marketing Strategist", department: "Marketing", createdAt: new Date().toISOString() },
    { id: "emp-002", name: "Fahad", email: "fahad@adscroll360.com", password: "Fahad@123", role: "employee", position: "Senior Graphic Designer", department: "Design", createdAt: new Date().toISOString() },
    { id: "emp-003", name: "Ijaz", email: "ijaz@adscroll360.com", password: "Ijaz@123", role: "employee", position: "Video Editor", department: "Video", createdAt: new Date().toISOString() },
    { id: "emp-004", name: "Ajmal", email: "ajmal@adscroll360.com", password: "Ajmal@123", role: "employee", position: "Content Strategist", department: "Content", createdAt: new Date().toISOString() },
    { id: "emp-005", name: "Faiz", email: "faiz@adscroll360.com", password: "Faiz@123", role: "employee", position: "Video Editor", department: "Video", createdAt: new Date().toISOString() },
    { id: "emp-006", name: "Shammas", email: "shammas@adscroll360.com", password: "Shammas@123", role: "employee", position: "Content Writer", department: "Content", createdAt: new Date().toISOString() },
    { id: "emp-007", name: "Jazeel", email: "jazeel@adscroll360.com", password: "Jazeel@123", role: "employee", position: "Graphic Designer", department: "Design", createdAt: new Date().toISOString() },
];

function loadUsers(): AppUser[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return INITIAL_TEAM;
}

function mapUser(u: any): AppUser {
    return {
        id: u.id,
        name: u.name,
        email: u.email,
        password: u.password,
        role: u.role,
        department: u.department,
        position: u.position,
        createdAt: u.created_at
    };
}

function saveUsers(users: AppUser[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
}

function loadSession(): AppUser | null {
    try {
        const saved = localStorage.getItem(SESSION_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
    const [users, setUsers] = useState<AppUser[]>([]);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(loadSession);
    const [loading, setLoading] = useState(true);

    // Fetch users from Supabase
    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data, error } = await supabase
                    .from('users')
                    .select('*');
                
                if (error) {
                    console.error("Error fetching users from Supabase:", error);
                    return;
                }
                
                if (data) {
                    setUsers(data.map(mapUser));
                }
            } catch (err) {
                console.error("Failed to connect to Supabase:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    // Keep session in sync
    useEffect(() => {
        if (currentUser) {
            localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    }, [currentUser]);

    const login = async (email: string, password: string) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .eq('password', password)
                .single();

            if (error || !data) {
                return { success: false, error: "Invalid email or password." };
            }

            const found = mapUser(data);
            setCurrentUser(found);
            return { success: true, role: found.role };
        } catch (err) {
            return { success: false, error: "Database connection failed." };
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(SESSION_KEY);
    };

    const addUser = async (user: any) => {
        const { name, email, password, role, department, position } = user;
        const newUser = {
            name,
            email,
            password,
            role,
            department,
            position,
            created_at: new Date().toISOString(),
        };

        const { data, error } = await supabase
            .from('users')
            .insert([newUser])
            .select()
            .single();

        if (error) {
            console.error("Supabase error in addUser:", error);
            return { success: false, error: error.message };
        }
        
        const mapped = mapUser(data);
        setUsers(prev => [...prev, mapped]);
        return { success: true };
    };

    const updateUser = async (id: string, updates: any) => {
        // Filter out unwanted fields like confirmPassword, createdAt, etc.
        const allowed = ['name', 'email', 'password', 'role', 'department', 'position', 'score'];
        const filtered: any = {};
        Object.keys(updates).forEach(key => {
            if (allowed.includes(key)) filtered[key] = updates[key];
        });

        const { error } = await supabase
            .from('users')
            .update(filtered)
            .eq('id', id);

        if (error) {
            console.error("Error updating user:", error);
            return;
        }

        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...filtered } : u)));
        if (currentUser?.id === id) {
            setCurrentUser((prev) => prev ? { ...prev, ...filtered } : prev);
        }
    };

    const removeUser = async (id: string) => {
        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error("Error removing user:", error);
            return;
        }
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const changePassword = async (id: string, currentPw: string, newPw: string) => {
        const user = users.find((u) => u.id === id);
        if (!user) return { success: false, error: "User not found." };
        if (user.password !== currentPw) return { success: false, error: "Current password is incorrect." };
        if (newPw.length < 6) return { success: false, error: "New password must be at least 6 characters." };
        
        await updateUser(id, { password: newPw });
        return { success: true };
    };

    const forceResetPassword = async (id: string, newPw: string) => {
        const user = users.find((u) => u.id === id);
        if (!user) return { success: false, error: "User not found." };
        if (newPw.length < 6) return { success: false, error: "Password must be at least 6 characters." };
        
        await updateUser(id, { password: newPw });
        return { success: true };
    };

    return (
        <AuthContext.Provider value={{ currentUser, users, login, logout, addUser, updateUser, removeUser, changePassword, forceResetPassword }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used within AuthProvider");
    return ctx;
}
