const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../../database/cepa.sqlite');
const dbDir = path.dirname(dbPath);

if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
}

const sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao banco de dados SQLite:', err.message);
    } else {
        console.log('✅ Conexão com SQLite estabelecida:', dbPath);
    }
});

// Wrapper com Promises para consultas assíncronas limpas (async/await)
const db = {
    run: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            sqliteDb.run(sql, params, function (err) {
                if (err) reject(err);
                else resolve({ id: this.lastID, changes: this.changes });
            });
        });
    },
    get: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            sqliteDb.get(sql, params, (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });
    },
    all: (sql, params = []) => {
        return new Promise((resolve, reject) => {
            sqliteDb.all(sql, params, (err, rows) => {
                if (err) reject(err);
                else resolve(rows || []);
            });
        });
    },
    exec: (sql) => {
        return new Promise((resolve, reject) => {
            sqliteDb.exec(sql, (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    },
    raw: sqliteDb
};

// Inicialização Automática do Esquema
async function initDatabase() {
    try {
        const schemaPath = path.resolve(__dirname, '../../database/schema.sql');
        if (fs.existsSync(schemaPath)) {
            const schemaSql = fs.readFileSync(schemaPath, 'utf8');
            await db.exec(schemaSql);
            console.log('✅ Esquema DDL verificado e atualizado com sucesso.');
        }
    } catch (e) {
        console.error('Erro ao inicializar tabelas:', e.message);
    }
}

initDatabase();

module.exports = db;
