const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./arcade.db');

db.serialize(() => {
    // Create tables
    db.run(`CREATE TABLE IF NOT EXISTS config (
        key TEXT PRIMARY KEY,
        value TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS quiz_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        options TEXT,
        correctIndex INTEGER,
        explanation TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS trivia_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        category TEXT,
        question TEXT,
        options TEXT,
        correctIndex INTEGER
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS memories (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        dateLabel TEXT,
        description TEXT,
        emoji TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS playlist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        artist TEXT,
        moodTag TEXT,
        link TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS scambled_words (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT,
        hint TEXT,
        compliment TEXT
    )`);

    db.run(`CREATE TABLE IF NOT EXISTS indian_states (
        id TEXT PRIMARY KEY,
        name TEXT,
        capital TEXT
    )`);

    // Helper to insert initial data
    const insertInitialData = () => {
        const CONFIG = {
            herNameDefault: "YOU",
            favourites: {
                games: ["word games", "puzzles", "arcade"],
                topics: ["Modern Family", "Grey's Anatomy", "Hospital Playlist", "Reply 1988", "When Life Gives you Tangerines"],
                songsOrArtists: ["Memories more than love by Kevin Oh", "Dekha hi nahin by Osho Jain"]
            },
            quizResults: {
                perfect: { title: "🏆 PhD Level Knowledge!", message: "You clearly have PhD level knowledge in yourself..." },
                good: { title: "😊 Pretty Solid!", message: "Not bad at all! You know yourself well..." },
                decent: { title: "🤔 Room for Improvement", message: "Okay, someone needs a small revision class..." },
                low: { title: "😅 Uh Oh...", message: "I think I need to update my notes..." }
            },
            valentineFinal: {
                question: "Will you be my Valentine this year, just for one silly day?",
                respectNote: "Jokes apart, answer honestly. I'll respect it.",
                yesTitle: "🎉 Best Decision Ever!",
                yesMessage: "Deal. One drama-free Valentine's with food and laughs on me.",
                noTitle: "💙 Fair Enough",
                noMessage: "Thanks for playing along with my nerdy experiment.",
                noMessages: [
                    "Error 404: 'No' not found in database.",
                    "System malfunction detected. Please try 'Yes' instead.",
                    "Warning: This button appears to be broken.",
                    "Are you sure? The 'Yes' button looks way friendlier.",
                    "Final warning: Clicking 'No' may cause regret (just kidding... or am I?)"
                ]
            }
        };

        db.run("INSERT OR REPLACE INTO config (key, value) VALUES ('base_config', ?)", [JSON.stringify(CONFIG)]);

        db.run(`CREATE TABLE IF NOT EXISTS him_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        options TEXT,
        correctIndex INTEGER,
        explanation TEXT
    )`);

        db.run(`CREATE TABLE IF NOT EXISTS her_questions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        question TEXT,
        options TEXT,
        correctIndex INTEGER,
        explanation TEXT
    )`);

        // ... (rest of tables)

        // Him Questions (Questions about Him)
        const himQuestions = [
            ["What is his favorite food?", JSON.stringify(["Pizza", "Burgers", "Sushi", "Tacos"]), 0, "He could eat pizza for every meal."],
            ["What is his dream travel destination?", JSON.stringify(["Japan", "Paris", "New York", "Maldives"]), 0, "Japan, for the anime and the food!"],
            ["What is his weirdest habit?", JSON.stringify(["Talking to himself", "Coding at 3AM", "Eating ice cream with a fork", "Singing in the shower"]), 1, "Coding at 3AM is his natural state."],
            ["What is his love language?", JSON.stringify(["Words of Affirmation", "Acts of Service", "Gifts", "Quality Time"]), 3, "He just wants to hang out with you."]
        ];
        himQuestions.forEach(q => db.run("INSERT INTO him_questions (question, options, correctIndex, explanation) VALUES (?, ?, ?, ?)", q));

        // Her Questions (Questions about Her)
        const herQuestions = [
            ["What is her favorite color?", JSON.stringify(["Pink", "Blue", "Black", "Purple"]), 0, "Pink, obviously!"],
            ["What is her go-to coffee order?", JSON.stringify(["Latte", "Cappuccino", "Black Coffee", "Iced Americano"]), 3, "Iced Americano, specifically."],
            ["What is her biggest pet peeve?", JSON.stringify(["Slow walkers", "Loud chewing", "Bad grammar", "Being late"]), 0, "Slow walkers drive her crazy."],
            ["What makes her smile the most?", JSON.stringify(["Food", "Shopping", "You", "Puppies"]), 2, "Hopefully, it's you! (But puppies are a close second)"]
        ];
        herQuestions.forEach(q => db.run("INSERT INTO her_questions (question, options, correctIndex, explanation) VALUES (?, ?, ?, ?)", q));

        // Legacy Quiz Questions (Optional/Keep for now or delete)
        const quizQuestions = [
            ["What show can you rewatch endlessly without getting bored?", JSON.stringify(["Modern Family", "The Office", "Friends", "Breaking Bad"]), 0, "Modern Family never gets old..."],
            ["Which medical drama makes you emotional every single time?", JSON.stringify(["House", "Grey's Anatomy", "ER", "Scrubs"]), 1, "Grey's Anatomy - where we learned that loving people means accepting their flaws."],
            ["What's your comfort K-Drama that feels like home?", JSON.stringify(["Crash Landing on You", "Reply 1988", "Goblin", "Itaewon Class"]), 1, "Reply 1988 - nostalgia, warmth, and that neighborhood that feels like family."],
            ["Which Korean drama hits different with its hospital vibes?", JSON.stringify(["Romantic Doctor", "Hospital Playlist", "Good Doctor", "Life"]), 1, "Hospital Playlist - friendship, music, and those wholesome moments."],
            ["What's the one song that's 'memories more than love'?", JSON.stringify(["Some random pop", "Memories more than love by Kevin Oh", "A breakup anthem", "Classical music"]), 1, "That Kevin Oh song that hits right in the feels every time."],
            ["Which underrated gem would you recommend: 'When Life Gives You...'", JSON.stringify(["Lemons", "Tangerines", "Oranges", "Grapes"]), 1, "When Life Gives You Tangerines - quirky, heartfelt, and totally your vibe."]
        ];
        quizQuestions.forEach(q => db.run("INSERT INTO quiz_questions (question, options, correctIndex, explanation) VALUES (?, ?, ?, ?)", q));

        // Trivia Questions
        db.run("DELETE FROM trivia_questions");

        try {
            const fs = require('fs');
            const path = require('path');
            const dataPath = path.resolve(__dirname, 'assets', 'trivia_data.json');

            if (fs.existsSync(dataPath)) {
                const fileData = fs.readFileSync(dataPath, 'utf8');
                const triviaQuestions = JSON.parse(fileData);

                const stmt = db.prepare("INSERT INTO trivia_questions (category, question, options, correctIndex) VALUES (?, ?, ?, ?)");
                triviaQuestions.forEach(q => {
                    stmt.run(q.category, q.question, JSON.stringify(q.options), q.correctIndex);
                });
                stmt.finalize();
                console.log(`Seeded ${triviaQuestions.length} trivia questions.`);
            } else {
                console.warn("Trivia data file not found, skipping.");
            }
        } catch (e) {
            console.error("Failed to seed trivia:", e);
        }

        // Memories
        const memories = [
            ["The Beginning", "2023 - Early Days", "When we first started talking and I realized you were way cooler than I deserved.", "🌟"],
            ["Late Night Conversations", "Those Endless Nights", "When 'good night' at 11 PM turned into 'okay for real this time' at 3 AM.", "🌙"],
            ["The Inside Jokes", "Anytime, Really", "All those moments that became 'remember when...' stories.", "😂"],
            ["The Rough Patch", "When I Messed Up", "That time I didn't show up the way you needed.", "💔"],
            ["Today", "Right Now", "Building this silly arcade, hoping to make you smile.", "💝"]
        ];
        memories.forEach(m => db.run("INSERT INTO memories (title, dateLabel, description, emoji) VALUES (?, ?, ?, ?)", m));

        // Playlist
        const playlist = [
            ["Memories more than love", "Kevin Oh", "nostalgic", "https://www.youtube.com/results?search_query=memories+more+than+love+kevin+oh"],
            ["Dekha hi nahin", "Osho Jain", "chill", "https://www.youtube.com/results?search_query=dekha+hi+nahin+osho+jain"],
            ["Mujhe tum nazar se", "Lisa Mishra", "happy", "https://www.youtube.com/results?search_query=mujhe+tum+nazar+se+lisa+mishra"],
            ["Woh humsafar tha", "Qurat Ul Balouch", "nostalgic", "https://www.youtube.com/results?search_query=woh+humsafar+tha+qurat+ul+balouch"]
        ];
        playlist.forEach(s => db.run("INSERT INTO playlist (title, artist, moodTag, link) VALUES (?, ?, ?, ?)", s));

        // Scrambled Words
        const words = [
            ["MODERNFAMILY", "Your go-to comfort show", "Just like this show, you bring warmth and laughter!"],
            ["GREYS", "Medical drama that makes you cry", "As unforgettable as Meredith and Derek!"],
            ["HOSPITALPLAYLIST", "Korean medical drama with heart", "Like this show, you make everything better!"],
            ["REPLY1988", "Nostalgic K-Drama about neighborhood", "Timeless and precious, just like certain memories!"],
            ["TANGERINES", "When life gives you...", "Quirky and delightful, much like you!"],
            ["PUZZLE", "Your favorite type of game", "You're the best puzzle I've tried to understand!"]
        ];
        words.forEach(w => db.run("INSERT INTO scambled_words (word, hint, compliment) VALUES (?, ?, ?)", w));

        // Indian States (IDs match assets/india.svg)
        const states = [
            ["ap", "Andhra Pradesh", "Amaravati"],
            ["ar", "Arunachal Pradesh", "Itanagar"],
            ["as", "Assam", "Dispur"],
            ["br", "Bihar", "Patna"],
            ["ct", "Chhattisgarh", "Raipur"],
            ["ga", "Goa", "Panaji"],
            ["gj", "Gujarat", "Gandhinagar"],
            ["hr", "Haryana", "Chandigarh"],
            ["hp", "Himachal Pradesh", "Shimla"],
            ["jh", "Jharkhand", "Ranchi"],
            ["ka", "Karnataka", "Bengaluru"],
            ["kl", "Kerala", "Thiruvananthapuram"],
            ["mp", "Madhya Pradesh", "Bhopal"],
            ["mh", "Maharashtra", "Mumbai"],
            ["mn", "Manipur", "Imphal"],
            ["ml", "Meghalaya", "Shillong"],
            ["mz", "Mizoram", "Aizawl"],
            ["nl", "Nagaland", "Kohima"],
            ["or", "Odisha", "Bhubaneswar"],
            ["pb", "Punjab", "Chandigarh"],
            ["rj", "Rajasthan", "Jaipur"],
            ["sk", "Sikkim", "Gangtok"],
            ["tn", "Tamil Nadu", "Chennai"],
            ["tg", "Telangana", "Hyderabad"],
            ["tr", "Tripura", "Agartala"],
            ["up", "Uttar Pradesh", "Lucknow"],
            ["ut", "Uttarakhand", "Dehradun"],
            ["wb", "West Bengal", "Kolkata"],
            ["an", "Andaman and Nicobar Islands", "Port Blair"],
            ["ch", "Chandigarh", "Chandigarh"],
            ["dn", "Dadra and Nagar Haveli", "Silvassa"],
            ["dd", "Daman and Diu", "Daman"],
            ["dl", "Delhi", "New Delhi"],
            ["jk", "Jammu and Kashmir", "Srinagar (Summer), Jammu (Winter)"],
            ["ld", "Lakshadweep", "Kavaratti"],
            ["py", "Puducherry", "Puducherry"]
        ];
        states.forEach(s => db.run("INSERT OR REPLACE INTO indian_states (id, name, capital) VALUES (?, ?, ?)", s));
    };

    insertInitialData();
});

db.close((err) => {
    if (err) {
        console.error(err.message);
    }
    console.log('Database initialized successfully.');
});
