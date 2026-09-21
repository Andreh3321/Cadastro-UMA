import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    async function loadSession() {
        try {
            const response = await fetch("/api/auth/me", { credentials: "same-origin" });
            const data = await response.json();
            setUser(data.user || null);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { loadSession(); }, []);

    async function login(login, senha) {
        const response = await fetch("/api/auth/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "same-origin",
            body: JSON.stringify({ login, senha }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.erro || "Não foi possível entrar");
        setUser(data.user);
        return data.user;
    }

    async function logout() {
        await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
        setUser(null);
    }

    const value = useMemo(() => ({ user, loading, login, logout, reload: loadSession }), [user, loading]);
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth precisa estar dentro de AuthProvider");
    return context;
}
