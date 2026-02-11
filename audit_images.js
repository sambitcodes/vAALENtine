const fs = require('fs');
const path = require('path');

const projectRoot = __dirname;
const picturesDir = path.join(projectRoot, 'pictures');

// 1. Collect all actual files in pictures directory (recursive)
const actualFiles = new Set();
const actualFilePaths = {}; // lowercase relative path -> actual relative path

function scanDir(dir, relativeDir = '') {
    const items = fs.readdirSync(dir);
    items.forEach(item => {
        const fullPath = path.join(dir, item);
        const relativePath = path.join(relativeDir, item).replace(/\\/g, '/');

        if (fs.statSync(fullPath).isDirectory()) {
            scanDir(fullPath, relativePath);
        } else {
            actualFiles.add(relativePath);
            actualFilePaths[relativePath.toLowerCase()] = relativePath;
        }
    });
}

console.log('Scanning pictures directory...');
scanDir(picturesDir);
console.log(`Found ${actualFiles.size} files in pictures directory.`);

// 2. Define files to scan for references
const filesToScan = [
    'index.html',
    'us.html',
    'memories.html',
    'js/home.js',
    'js/memories.js',
    'js/us.js',
    'css/us.css',
    'css/styles.css'
];

// 3. Scan for references and check against actual files
let errorCount = 0;

filesToScan.forEach(file => {
    const filePath = path.join(projectRoot, file);
    if (!fs.existsSync(filePath)) {
        console.warn(`Skipping missing file: ${file}`);
        return;
    }

    console.log(`\nScanning ${file}...`);
    const content = fs.readFileSync(filePath, 'utf8');

    // Regex to find image paths: matches /pictures/... or pictures/...
    // supporting simple quotes, double quotes, or css url()
    const regex = /(?:src="|url\('|url\("|image:\s*")(\/?pictures\/[^"'\)]+)/g;
    let match;

    while ((match = regex.exec(content)) !== null) {
        let refPath = match[1];

        // Normalize: remove leading slash if present for comparison
        let normalizedRef = refPath;
        if (normalizedRef.startsWith('/')) {
            normalizedRef = normalizedRef.substring(1);
        }

        // Remove 'pictures/' prefix to match our relative scan
        const relativeRef = normalizedRef.replace(/^pictures\//, '');

        if (!actualFilePaths[relativeRef.toLowerCase()]) {
            console.error(`❌ MISSING FILE: "${refPath}" in ${file}`);
            errorCount++;
        } else {
            const actualPath = actualFilePaths[relativeRef.toLowerCase()];
            // Check for case mismatch
            if (relativeRef !== actualPath) {
                console.warn(`⚠️  CASE MISMATCH: "${refPath}" in ${file}`);
                console.warn(`   Actual on disk: pictures/${actualPath}`);
                errorCount++; // Treat as error to force fix
            } else {
                // console.log(`✅ OK: ${refPath}`);
            }
        }
    }
});

if (errorCount === 0) {
    console.log('\nAll image references match files on disk exactly! ✅');
} else {
    console.log(`\nFound ${errorCount} issues. Use these results to fix paths/filenames.`);
}
