const express = require("express");
const cors = require("cors");
const path = require("path");

const jovensRoutes = require("./routes.jovens");
const eventosRoutes = require("./routes.eventos");
const rankingRoutes = require("./routes.ranking");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/jovens", jovensRoutes);
app.use("/api/eventos", eventosRoutes);
app.use("/api/ranking", rankingRoutes);

app.get("/", (req, res) => {
    res.json({
        mensagem: "API do sistema de jovens funcionando!"
    });
});

const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`)
});