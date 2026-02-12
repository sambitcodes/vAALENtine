const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'arcade.db');
const db = new sqlite3.Database(dbPath);

console.log(`Cleaning up user data in: ${dbPath}`);

db.serialize(() => {
    // 1. Drop user records (tickets)
    db.run("DROP TABLE IF EXISTS users", (err) => {
        if (err) console.error("Error dropping users:", err.message);
        else console.log("✅ Users table dropped (reset).");
    });

    // 2. Drop purchase history
    db.run("DROP TABLE IF EXISTS purchases", (err) => {
        if (err) console.error("Error dropping purchases:", err.message);
        else console.log("✅ Purchases table dropped (reset).");
    });
});

db.close((err) => {
    if (err) console.error(err.message);
    else console.log('Database reset successfully. User data removed.');
});
