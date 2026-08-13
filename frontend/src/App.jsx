import {
    BrowserRouter,
    Routes,
    Route
} from "react-router-dom";

import Navbar from "./components/Navbar";

import Home from "./pages/Home";
import Jovens from "./pages/Jovens";
import Ranking from "./pages/Ranking";
import Eventos from "./pages/Eventos";
import Chamada from "./pages/Chamada";

export default function App() {

    return (
        <BrowserRouter>

            <Navbar />

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

            </Routes>

        </BrowserRouter>
    );
}