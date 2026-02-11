const fs = require('fs');
const path = require('path');

const memoriesDir = path.join(__dirname, 'pictures', 'memories');

if (fs.existsSync(memoriesDir)) {
    const items = fs.readdirSync(memoriesDir);
    items.forEach(item => {
        const fullPath = path.join(memoriesDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            const lowerName = item.toLowerCase();
            const lowerPath = path.join(memoriesDir, lowerName);

            if (fullPath !== lowerPath) {
                console.log(`Renaming folder: "${item}" -> "${lowerName}"`);
                // Windows renaming case-only requires temp rename usually, but Node's fs.rename might handle it or we do a double rename
                const tempPath = path.join(memoriesDir, `temp_${item}`);
                fs.renameSync(fullPath, tempPath);
                fs.renameSync(tempPath, lowerPath);
            }

            // Now rename files inside to lowercase too
            const files = fs.readdirSync(lowerPath);
            files.forEach(file => {
                const filePath = path.join(lowerPath, file);
                const lowerFile = file.toLowerCase();
                const lowerFilePath = path.join(lowerPath, lowerFile);
                if (filePath !== lowerFilePath) {
                    console.log(`  Renaming file: "${file}" -> "${lowerFile}"`);
                    const tempFile = path.join(lowerPath, `temp_${file}`);
                    fs.renameSync(filePath, tempFile);
                    fs.renameSync(tempFile, lowerFilePath);
                }
            });
        }
    });
}
