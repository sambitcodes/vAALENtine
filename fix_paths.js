const fs = require('fs');
const path = require('path');

// 1. Fix aal_prof.JPG -> aal_prof.jpg
const profDir = path.join(__dirname, 'pictures', 'prof-pics');
const aalOld = path.join(profDir, 'aal_prof.JPG');
const aalNew = path.join(profDir, 'aal_prof.jpg');

if (fs.existsSync(aalOld)) {
    console.log(`Renaming: ${aalOld} -> ${aalNew}`);
    fs.renameSync(aalOld, aalNew);
} else {
    console.log(`aal_prof.JPG not found (maybe already renamed?)`);
}

// 2. Fix memories folders
const memoriesDir = path.join(__dirname, 'pictures', 'memories');
if (fs.existsSync(memoriesDir)) {
    const items = fs.readdirSync(memoriesDir);
    items.forEach(item => {
        const fullPath = path.join(memoriesDir, item);
        if (fs.statSync(fullPath).isDirectory()) {
            const lowerName = item.toLowerCase();
            const lowerPath = path.join(memoriesDir, lowerName);

            if (item !== lowerName) {
                console.log(`Renaming Folder: "${item}" -> "${lowerName}"`);
                const tempPath = path.join(memoriesDir, `temp_${item}_${Date.now()}`);
                fs.renameSync(fullPath, tempPath);
                fs.renameSync(tempPath, lowerPath);
            } else {
                console.log(`v: "${item}" is already lowercase`);
            }

            // Check files inside
            const lowerPathFinal = path.join(memoriesDir, lowerName);
            const files = fs.readdirSync(lowerPathFinal);
            files.forEach(file => {
                const lowerFile = file.toLowerCase();
                if (file !== lowerFile) {
                    console.log(`  Renaming File: "${file}" -> "${lowerFile}"`);
                    const filePath = path.join(lowerPathFinal, file);
                    const lowerFilePath = path.join(lowerPathFinal, lowerFile);
                    const tempFile = path.join(lowerPathFinal, `temp_${file}_${Date.now()}`);
                    fs.renameSync(filePath, tempFile);
                    fs.renameSync(tempFile, lowerFilePath);
                }
            });
        }
    });
}
