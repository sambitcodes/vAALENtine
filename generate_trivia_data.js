const fs = require('fs');
const path = require('path');

const ASSETS_DIR = path.join(__dirname, 'assets');
const OUTPUT_FILE = path.join(ASSETS_DIR, 'trivia_data.json');

const FILES = [
    { filename: 'modernfamily.json', category: 'Modern Family', type: 'object_options' },
    { filename: 'greyanatomy.json', category: "Grey's Anatomy", type: 'array_options' },
    { filename: 'hospitalplaylist.json', category: 'Hospital Playlist', type: 'array_options' },
    { filename: 'reply1988.json', category: 'Reply 1988', type: 'array_options' },
    { filename: 'tangerines.json', category: 'When Life Gives you Tangerines', type: 'array_options' }
];

function getRandomItems(arr, n) {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, n);
}

function processFile(fileConfig) {
    const filePath = path.join(ASSETS_DIR, fileConfig.filename);
    try {
        const rawData = fs.readFileSync(filePath, 'utf8');
        let data = JSON.parse(rawData);
        let questions = [];

        // Handle different root structures (some are array, some are object with "questions" key)
        if (Array.isArray(data)) {
            questions = data;
        } else if (data.questions && Array.isArray(data.questions)) {
            questions = data.questions;
        } else {
            console.error(`Unknown structure in ${fileConfig.filename}`);
            return [];
        }

        const normalized = questions.map(q => {
            let options = [];
            let correctIndex = -1;

            if (fileConfig.type === 'object_options') {
                // Handle properties like "A": "...", "B": "..."
                // Assuming keys are A, B, C, D in order usually, but safer to extract values.
                // However, modernfamily uses "answer": "A".
                // We need to ensure the order of options matches the keys.
                const keys = ['A', 'B', 'C', 'D'];
                options = keys.map(k => q.options[k]);
                correctIndex = keys.indexOf(q.answer);
            } else {
                // Options are already an array
                options = q.options;
                // Answer is the full string
                correctIndex = options.indexOf(q.answer);

                if (correctIndex === -1) {
                    // Fallback: try trimming or loose matching if needed, 
                    // or sometimes answer is just the string text.
                    // Verified user files seem to have exact matches or formatted strings.
                    // Let's warn if not found.
                    console.warn(`Answer not found in options for question in ${fileConfig.filename}: "${q.question}"`);
                }
            }

            return {
                category: fileConfig.category,
                question: q.question,
                options: options,
                correctIndex: correctIndex
            };
        }).filter(q => q.correctIndex !== -1 && q.options.length > 0);

        // Select 10 random questions
        const selected = getRandomItems(normalized, 10);
        console.log(`Processed ${fileConfig.filename}: Found ${normalized.length}, Selected ${selected.length}`);
        return selected;

    } catch (err) {
        console.error(`Error processing ${fileConfig.filename}:`, err.message);
        return [];
    }
}

function main() {
    let allQuestions = [];

    FILES.forEach(fileConfig => {
        const questions = processFile(fileConfig);
        allQuestions = allQuestions.concat(questions);
    });

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(allQuestions, null, 4));
    console.log(`Successfully wrote ${allQuestions.length} questions to ${OUTPUT_FILE}`);
}

main();
