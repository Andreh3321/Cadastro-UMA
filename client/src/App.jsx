import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import BotaoInstalar from "./components/BotaoInstalar";
import ProtectedRoute from "./components/ProtectedRoute";
import { AuthProvider } from "./contexts/AuthContext";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Jovens from "./pages/Jovens";
import Ranking from "./pages/Ranking";
import Eventos from "./pages/Eventos";
import ImportarChamadas from "./pages/ImportarChamadas";
import Administracao from "./pages/Administracao";

const FULL_ACCESS = ["admin", "secretario", "lider", "eventos"];
const CALL_ACCESS = ["admin", "secretario", "lider"];
const ADMIN_ACCESS = ["admin"];

function AppRoutes() {
    return (
        <BrowserRouter>
            <Navbar />
            <BotaoInstalar />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<ProtectedRoute roles={FULL_ACCESS} />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/jovens" element={<Jovens />} />
                    <Route path="/eventos" element={<Eventos />} />
                    <Route path="/importar-chamadas" element={<ImportarChamadas />} />
                </Route>
                <Route element={<ProtectedRoute roles={CALL_ACCESS} />}>
                    <Route path="/ranking" element={<Ranking />} />
                </Route>
                <Route element={<ProtectedRoute roles={ADMIN_ACCESS} />}>
                    <Route path="/administracao" element={<Administracao />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default function App() {
    return <AuthProvider><AppRoutes /></AuthProvider>;
}
