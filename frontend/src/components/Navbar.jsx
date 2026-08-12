import { Link } from "react-router-dom";

export default function Navbar() {

    return (
        <nav className="navbar">

            <div className="logo">
                <span>UMADEB</span>
                <small>JOVENS</small>
            </div>

            <div className="nav-links">

                <Link to="/">
                    Início
                </Link>

                <Link to="/jovens">
                    Jovens
                </Link>

                <Link to="/ranking">
                    Ranking
                </Link>

                <Link to="/eventos">
                    Eventos
                </Link>

            </div>

        </nav>
    );
}