import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ROLE_LABELS = { admin: "Administrador", secretario: "Secretário", lider: "Líder", eventos: "Eventos" };

export default function Navbar() {
    const { user, logout } = useAuth();
    if (!user) return null;
    const canCall = ["admin", "secretario", "lider"].includes(user.role);

    return (
        <nav className="navbar">
            <div className="logo"><span>UMADEB</span><small>JOVENS</small></div>
            <div className="nav-links">
                <Link to="/">Início</Link>
                <Link to="/jovens">Jovens</Link>
                {canCall && <Link to="/ranking">Ranking</Link>}
                <Link to="/eventos">Eventos</Link>
                {canCall && <Link to="/chamada">Chamada</Link>}
                <Link to="/importar-chamadas">Importar</Link>
            </div>
            <div className="user-menu">
                <span title={ROLE_LABELS[user.role]}>{user.nome}</span>
                <button type="button" onClick={logout}>Sair</button>
            </div>
        </nav>
    );
}
