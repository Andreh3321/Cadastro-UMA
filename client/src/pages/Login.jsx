import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

export default function Login() {
    const { user, loading, login } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [form, setForm] = useState({ login: "", senha: "" });
    const [error, setError] = useState("");
    const [sending, setSending] = useState(false);

    if (!loading && user) return <Navigate to={location.state?.from || "/"} replace />;

    async function submit(event) {
        event.preventDefault();
        setError("");
        setSending(true);
        try {
            await login(form.login, form.senha);
            navigate(location.state?.from || "/", { replace: true });
        } catch (err) {
            setError(err.message || "Não foi possível entrar");
        } finally {
            setSending(false);
        }
    }

    return (
        <main className="login-page">
            <section className="login-card">
                <div className="login-brand"><strong>UMADEB</strong><span>JOVENS</span></div>
                <p className="login-eyebrow">Área restrita</p>
                <h1>Entrar no sistema</h1>
                <p className="login-description">Use o login fornecido pelo administrador.</p>
                <form onSubmit={submit}>
                    <label>Login<input autoFocus value={form.login} onChange={(event) => setForm({ ...form, login: event.target.value })} autoComplete="username" /></label>
                    <label>Senha<input type="password" value={form.senha} onChange={(event) => setForm({ ...form, senha: event.target.value })} autoComplete="current-password" /></label>
                    {error && <div className="login-error">{error}</div>}
                    <button className="login-button" type="submit" disabled={sending}>{sending ? "Entrando..." : "Entrar"}</button>
                </form>
            </section>
        </main>
    );
}
