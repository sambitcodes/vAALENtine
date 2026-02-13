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

// Email & Excel Dependencies
const nodemailer = require('nodemailer');
const ExcelJS = require('exceljs');

// Email Transporter (Configure with your credentials in .env)
const transporter = nodemailer.createTransport({
    service: 'gmail', // or your provider
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

app.post('/api/analytics/logout', async (req, res) => {
    const { phone, sessionData } = req.body;

    console.log(`Received logout report for user: ${phone}`);

    try {
        // 1. Create Excel Workbook
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'vAALENtine Arcade SYSTEM';
        workbook.created = new Date();

        // SHEET 1: Summary
        const summarySheet = workbook.addWorksheet('Session Summary');
        summarySheet.columns = [
            { header: 'Metric', key: 'metric', width: 20 },
            { header: 'Value', key: 'value', width: 50 }
        ];

        summarySheet.addRows([
            { metric: 'User Phone', value: phone },
            { metric: 'Login Time', value: sessionData.startTime },
            { metric: 'Logout Time', value: sessionData.endTime },
            { metric: 'Browser/Agent', value: sessionData.deviceInfo.userAgent },
            { metric: 'Platform', value: sessionData.deviceInfo.platform },
            { metric: 'Screen Res', value: sessionData.deviceInfo.screenResolution },
            {
                metric: 'Location (Lat, Long)', value: sessionData.location && !sessionData.location.error
                    ? `${sessionData.location.latitude}, ${sessionData.location.longitude}`
                    : (sessionData.location?.error || 'Unknown')
            }
        ]);

        // SHEET 2: Click Log
        const clickSheet = workbook.addWorksheet('Click Activity');
        clickSheet.columns = [
            { header: 'Time', key: 'timestamp', width: 25 },
            { header: 'Page', key: 'page', width: 20 },
            { header: 'Element', key: 'element', width: 15 },
            { header: 'Label/Text', key: 'label', width: 30 },
            { header: 'ID', key: 'id', width: 15 },
            { header: 'Class', key: 'class', width: 20 },
            { header: 'X, Y', key: 'coords', width: 15 }
        ];

        if (sessionData.clicks && sessionData.clicks.length > 0) {
            sessionData.clicks.forEach(click => {
                clickSheet.addRow({
                    timestamp: click.timestamp,
                    page: click.page,
                    element: click.element,
                    label: click.label,
                    id: click.id,
                    class: click.class,
                    coords: `${click.x}, ${click.y}`
                });
            });
        }

        // SHEET 2.5: Participation Matrix (Key Actions Check)
        const matrixSheet = workbook.addWorksheet('Participation Matrix');
        matrixSheet.columns = [
            { header: 'Action Category', key: 'category', width: 20 },
            { header: 'Specific Action / Button', key: 'action', width: 30 },
            { header: 'Interacted? (Yes/No)', key: 'clicked', width: 15 }
        ];

        // NEW SHEET: Horizontal Checklist (Buttons as Columns)
        const checklistSheet = workbook.addWorksheet('Quick Checklist');

        // Define key actions to track
        const keyActions = [
            { category: 'Navigation', label: 'Home' },
            { category: 'Navigation', label: 'Us' },
            { category: 'Navigation', label: 'Memories' },
            { category: 'Navigation', label: 'Mixtape' },
            { category: 'Navigation', label: 'Trivia' },
            { category: 'Navigation', label: 'Map' },
            { category: 'Navigation', label: 'Arcade' },
            { category: 'Navigation', label: 'BuildUP' },
            { category: 'Navigation', label: 'Finale' },
            { category: 'Arcade', label: 'Heartbreak Breakout' },
            { category: 'Arcade', label: 'Red Flag Dodger' },
            { category: 'Arcade', label: 'Whack-A-Regret' },
            { category: 'Arcade', label: 'Clumsy Claw' },
            { category: 'Arcade', label: 'Open Prize Shop' },
            { category: 'Finale', label: 'Yes' },
            { category: 'Finale', label: 'No' },
            { category: 'US', label: 'Match' },
            { category: 'US', label: 'Unmatch' },
            { category: 'States', label: 'Show Hint' },
            { category: 'States', label: 'End Game' }
        ];

        const sessionLabels = sessionData.clicks.map(c => c.label.toLowerCase());

        // Populate Vertical Matrix
        keyActions.forEach(item => {
            const wasClicked = sessionLabels.some(s => s.includes(item.label.toLowerCase()));
            matrixSheet.addRow({
                category: item.category,
                action: item.label,
                clicked: wasClicked ? 'YES' : 'NO'
            });
        });

        // Populate Horizontal Checklist (Column-based)
        const headerRow = ['User Phone', ...keyActions.map(k => k.label)];
        const valueRow = [phone, ...keyActions.map(item => {
            const wasClicked = sessionLabels.some(s => s.includes(item.label.toLowerCase()));
            return wasClicked ? 'YES' : 'NO';
        })];

        checklistSheet.addRow(headerRow);
        checklistSheet.addRow(valueRow);

        // Styling the horizontal headers
        checklistSheet.getRow(1).font = { bold: true };
        checklistSheet.columns.forEach(column => {
            column.width = 18;
        });

        // Add any other unique buttons clicked that weren't in the key list
        const extraLabels = [...new Set(sessionData.clicks.map(c => c.label))].filter(l =>
            !keyActions.some(k => l.toLowerCase().includes(k.label.toLowerCase()))
        );

        if (extraLabels.length > 0) {
            extraLabels.forEach(l => {
                if (l && l.length > 0) {
                    matrixSheet.addRow({
                        category: 'Other Interaction',
                        action: l,
                        clicked: 'YES'
                    });
                }
            });
        }

        // SHEET 3: User Game Stats (Fetch from DB)
        const statsSheet = workbook.addWorksheet('Overall Stats');
        statsSheet.columns = [
            { header: 'Tickets', key: 'tickets', width: 15 },
            { header: 'Purchases', key: 'purchases', width: 50 }
        ];

        // Fetch user data synchronously-ish
        const userRow = await new Promise((resolve, reject) => {
            db.get("SELECT tickets FROM users WHERE phone = ?", [phone], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        const purchases = await new Promise((resolve, reject) => {
            db.all("SELECT item_name, cost, timestamp FROM purchases WHERE phone = ?", [phone], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        statsSheet.addRow({
            tickets: userRow ? userRow.tickets : 'N/A',
            purchases: purchases.map(p => `${p.item_name} (${p.cost})`).join(', ')
        });


        // 2. Generate Buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // 3. Send Email
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: process.env.EMAIL_USER, // Send to yourself
            subject: `📊 Session Report: ${phone} - ${new Date().toLocaleString()}`,
            text: `User ${phone} has logged out.\n\nAttached is the session activity report containing:\n- Device & Location Info\n- Clickstream Data\n- Game Stats & Purchases\n\n- vAALENtine System`,
            attachments: [
                {
                    filename: `Session_${phone}_${Date.now()}.xlsx`,
                    content: buffer,
                    contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                }
            ]
        };

        if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
            await transporter.sendMail(mailOptions);
            console.log("Email sent successfully.");
            res.json({ success: true, message: "Report generated and emailed." });
        } else {
            console.warn("Email credentials missing in .env. Saving file locally instead (optional).");
            res.json({ success: true, message: "Report generated but email skipped (no credentials)." });
        }

    } catch (error) {
        console.error("Analytics Error:", error);
        res.status(500).json({ error: "Failed to generate report." });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${port}`);
});
