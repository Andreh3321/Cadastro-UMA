const Database = require("better-sqlite3");
const path = require("path");

const dbPath = path.join(__dirname, "igreja.db");

const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

/*
|--------------------------------------------------------------------------
| SISTEMA DE PONTUAÇÃO
|--------------------------------------------------------------------------
*/

const PONTUACAO = {
    "Culto das irmãs": 100,
    "Culto de doutrina": 200,
    "Culto de quinta-feira": 200,
    "EBD": 500,
    "Ensaio local": 500,
    "Culto de domingo": 300,
    "Santa Ceia": 500,
    "Culto no lar": 200,
    "Culto ao ar livre (missão)": 200,
    "Cooperação na Sede": 350,
    "Cooperação Belenzinho": 500,
    "Ensaio Sede": 300,
    "Eventos com a UMA local": 750,
    "Cultos na direção da UMA": 400
};

/*
|--------------------------------------------------------------------------
| BANCO DE DADOS
|--------------------------------------------------------------------------
*/

db.exec(`
    CREATE TABLE IF NOT EXISTS jovens (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        data_nascimento TEXT NOT NULL,
        telefone TEXT,
        telefone_emergencia TEXT,
        endereco TEXT,
        data_batismo TEXT,
        instagram TEXT,
        foto TEXT
    );

    CREATE TABLE IF NOT EXISTS eventos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        tipo TEXT NOT NULL,
        data TEXT NOT NULL,
        horario TEXT,
        local TEXT,
        descricao TEXT
    );

    CREATE TABLE IF NOT EXISTS presencas (
        id INTEGER PRIMARY KEY AUTOINCREMENT,

        jovem_id INTEGER NOT NULL,

        evento_id INTEGER NOT NULL,

        status TEXT NOT NULL CHECK (
            status IN (
                'presente',
                'ausente',
                'justificado'
            )
        ),

        pontos INTEGER DEFAULT 0,

        FOREIGN KEY (jovem_id)
            REFERENCES jovens(id)
            ON DELETE CASCADE,

        FOREIGN KEY (evento_id)
            REFERENCES eventos(id)
            ON DELETE CASCADE,

        UNIQUE(jovem_id, evento_id)
    );
`);

module.exports = {
    db,
    PONTUACAO
};