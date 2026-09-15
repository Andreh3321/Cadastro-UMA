import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Navbar from "./components/Navbar";
import BotaoInstalar from "./components/BotaoInstalar";

import Home from "./pages/Home";
import Jovens from "./pages/Jovens";
import Ranking from "./pages/Ranking";
import Eventos from "./pages/Eventos";
import Chamada from "./pages/Chamada";
import ImportarChamadas from "./pages/ImportarChamadas";

export default function App() {

    return (
        <BrowserRouter>

            <Navbar />

            <BotaoInstalar />

            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/jovens"
                    element={<Jovens />}
                />

                <Route
                    path="/ranking"
                    element={<Ranking />}
                />

                <Route
                    path="/eventos"
                    element={<Eventos />}
                />

                <Route
                    path="/chamada"
                    element={<Chamada />}
                />

                <Route
                    path="/importar-chamadas"
                    element={<ImportarChamadas />}
                />

            </Routes>

        </BrowserRouter>
    );
}