require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const dbPath = process.env.DB_PATH || path.resolve(__dirname, 'arcade.db');
const db = new sqlite3.Database(dbPath);
console.log(`Using database at: ${dbPath}`);

// Initialize relevant tables if they don't exist
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS users (
        phone TEXT PRIMARY KEY,
        tickets INTEGER DEFAULT 0
    )`);
    db.run(`CREATE TABLE IF NOT EXISTS purchases (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phone TEXT,
        item_name TEXT,
        cost INTEGER,
        timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
});

app.use(cors());
app.use(express.json());
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});
app.use(express.static(__dirname));
app.use('/pictures', express.static(path.join(__dirname, 'pictures')));

// --- USER & ARCADE TICKETS ---

// Get user data (tickets + purchases)
app.get('/api/user/:phone', (req, res) => {
    const { phone } = req.params;
    db.get("SELECT tickets FROM users WHERE phone = ?", [phone], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });

        // If user doesn't exist, create them with 5 initial tickets
        if (!user) {
            db.run("INSERT INTO users (phone, tickets) VALUES (?, ?)", [phone, 5], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                return res.json({ phone, tickets: 5, purchases: [] });
            });
        } else {
            db.all("SELECT item_name, cost, timestamp FROM purchases WHERE phone = ? ORDER BY timestamp DESC", [phone], (err, purchases) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ phone, tickets: user.tickets, purchases });
            });
        }
    });
});

// Update user tickets
app.post('/api/user/:phone/tickets', (req, res) => {
    const { phone } = req.params;
    const { tickets } = req.body;
    db.run("UPDATE users SET tickets = ? WHERE phone = ?", [tickets, phone], function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ success: true, updatedTickets: tickets });
    });
});

// Record a purchase
app.post('/api/user/:phone/purchase', (req, res) => {
    const { phone } = req.params;
    const { itemName, cost } = req.body;

    db.serialize(() => {
        // 1. Check balance
        db.get("SELECT tickets FROM users WHERE phone = ?", [phone], (err, user) => {
            if (err || !user || user.tickets < cost) {
                return res.status(400).json({ error: "Insufficient tickets" });
            }

            // 2. Deduct tickets
            db.run("UPDATE users SET tickets = tickets - ? WHERE phone = ?", [cost, phone]);

            // 3. Record purchase
            db.run("INSERT INTO purchases (phone, item_name, cost) VALUES (?, ?, ?)", [phone, itemName, cost], function (err) {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true, newBalance: user.tickets - cost });
            });
        });
    });
});

// API to get full configuration
app.get('/api/config', (req, res) => {
    const fullConfig = {};

    db.get("SELECT value FROM config WHERE key = 'base_config'", (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        Object.assign(fullConfig, JSON.parse(row.value));

        // Get Quiz Questions (Legacy)
        db.all("SELECT * FROM quiz_questions", (err, rows) => {
            if (err) return res.status(500).json({ error: err.message });
            fullConfig.quizQuestions = rows.map(r => ({ ...r, options: JSON.parse(r.options) }));

            // Get Him Questions
            db.all("SELECT * FROM him_questions", (err, rows) => {
                if (err) return res.status(500).json({ error: err.message });
                fullConfig.himQuestions = rows.map(r => ({ ...r, options: JSON.parse(r.options) }));

                // Get Her Questions
                db.all("SELECT * FROM her_questions", (err, rows) => {
                    if (err) return res.status(500).json({ error: err.message });
                    fullConfig.herQuestions = rows.map(r => ({ ...r, options: JSON.parse(r.options) }));

                    // Get Trivia
                    db.all("SELECT * FROM trivia_questions", (err, rows) => {
                        if (err) return res.status(500).json({ error: err.message });
                        fullConfig.triviaQuestions = rows.map(r => ({ ...r, options: JSON.parse(r.options) }));

                        // Get Memories
                        db.all("SELECT * FROM memories", (err, rows) => {
                            if (err) return res.status(500).json({ error: err.message });
                            fullConfig.memories = rows;

                            // Get Playlist
                            db.all("SELECT * FROM playlist", (err, rows) => {
                                if (err) return res.status(500).json({ error: err.message });
                                fullConfig.playlist = rows;

                                // Get Scrambled Words
                                db.all("SELECT * FROM scambled_words", (err, rows) => {
                                    if (err) return res.status(500).json({ error: err.message });
                                    fullConfig.favGame = fullConfig.favGame || {};
                                    fullConfig.favGame.words = rows;

                                    // Get Indian States
                                    db.all("SELECT * FROM indian_states", (err, rows) => {
                                        if (err) return res.status(500).json({ error: err.message });
                                        fullConfig.indianStates = rows;
                                        res.json(fullConfig);
                                    });
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

// Groq API Integration
const Groq = require('groq-sdk');
let groq = null;
if (process.env.GROQ_API_KEY) {
    groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
}

app.post('/api/trivia/generate', async (req, res) => {
    const { category } = req.body;

    if (!groq) {
        return res.status(500).json({ error: "Groq API Key missing. Check .env file." });
    }

    try {
        const completion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: "You are a trivia master. Generate EXACTLY 10 unique, fun, and challenging trivia questions about the given TV show or topic. Return ONLY a valid JSON array of objects. Each object must have: 'question' (string), 'options' (array of 4 strings), and 'correctIndex' (integer 0-3). No markdown, no intro text, no ```json wrapper."
                },
                {
                    role: "user",
                    content: `Generate 10 trivia questions for: ${category}`
                }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.7,
        });

        let content = completion.choices[0]?.message?.content;
        // Clean up markdown if present
        content = content.replace(/```json/g, '').replace(/```/g, '').trim();

        const questions = JSON.parse(content);

        // Ensure we have 10
        if (Array.isArray(questions) && questions.length > 0) {
            res.json(questions.slice(0, 10));
        } else {
            throw new Error("Invalid format from AI");
        }

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to generate questions." });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
