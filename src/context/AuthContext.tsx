import { createContext, useContext, useState, useEffect, ReactNode } from "react";

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
    login: (email: string, password: string, role: UserRole) => { success: boolean; error?: string };
    logout: () => void;
    addUser: (user: Omit<AppUser, "id" | "createdAt">) => { success: boolean; error?: string };
    updateUser: (id: string, updates: Partial<AppUser>) => void;
    removeUser: (id: string) => void;
    changePassword: (id: string, currentPw: string, newPw: string) => { success: boolean; error?: string };
    forceResetPassword: (id: string, newPw: string) => { success: boolean; error?: string };
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = "adscroll360_users";
const SESSION_KEY = "adscroll360_session";

const DEFAULT_ADMIN: AppUser = {
    id: "admin-001",
    name: "Basith",
    email: "basith@adscroll360.com",
    password: "password",
    role: "admin",
    department: "Management",
    position: "Core Admin",
    createdAt: new Date().toISOString(),
};

function loadUsers(): AppUser[] {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) return JSON.parse(saved);
    } catch { }
    return [DEFAULT_ADMIN];
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
    const [users, setUsers] = useState<AppUser[]>(loadUsers);
    const [currentUser, setCurrentUser] = useState<AppUser | null>(loadSession);

    // Sync users to localStorage whenever they change
    useEffect(() => {
        saveUsers(users);
    }, [users]);

    // Keep session in sync whenever currentUser's data is updated
    useEffect(() => {
        if (currentUser) {
            // Re-fetch latest data for current user from users list
            const fresh = users.find((u) => u.id === currentUser.id);
            if (fresh) localStorage.setItem(SESSION_KEY, JSON.stringify(fresh));
        } else {
            localStorage.removeItem(SESSION_KEY);
        }
    }, [currentUser, users]);

    const login = (email: string, password: string, role: UserRole) => {
        const found = users.find(
            (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password && u.role === role
        );
        if (!found) {
            return { success: false, error: "Invalid email, password, or role." };
        }
        setCurrentUser(found);
        localStorage.setItem(SESSION_KEY, JSON.stringify(found));
        return { success: true };
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem(SESSION_KEY);
    };

    const addUser = (user: Omit<AppUser, "id" | "createdAt">) => {
        const emailExists = users.some((u) => u.email.toLowerCase() === user.email.toLowerCase());
        if (emailExists) return { success: false, error: "This email is already registered." };
        if (!user.email.trim()) return { success: false, error: "Email is required." };
        if (!user.password || user.password.length < 6) return { success: false, error: "Password must be at least 6 characters." };

        const newUser: AppUser = {
            ...user,
            id: `user-${Date.now()}`,
            createdAt: new Date().toISOString(),
        };
        setUsers((prev) => [...prev, newUser]);
        return { success: true };
    };

    const updateUser = (id: string, updates: Partial<AppUser>) => {
        setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...updates } : u)));
        if (currentUser?.id === id) {
            setCurrentUser((prev) => prev ? { ...prev, ...updates } : prev);
        }
    };

    const removeUser = (id: string) => {
        setUsers((prev) => prev.filter((u) => u.id !== id));
    };

    const changePassword = (id: string, currentPw: string, newPw: string) => {
        const user = users.find((u) => u.id === id);
        if (!user) return { success: false, error: "User not found." };
        if (user.password !== currentPw) return { success: false, error: "Current password is incorrect." };
        if (newPw.length < 6) return { success: false, error: "New password must be at least 6 characters." };
        updateUser(id, { password: newPw });
        return { success: true };
    };

    const forceResetPassword = (id: string, newPw: string) => {
        const user = users.find((u) => u.id === id);
        if (!user) return { success: false, error: "User not found." };
        if (newPw.length < 6) return { success: false, error: "Password must be at least 6 characters." };
        updateUser(id, { password: newPw });
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
