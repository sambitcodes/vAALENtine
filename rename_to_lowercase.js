const fs = require('fs');
const path = require('path');

const imgDir = path.join(__dirname, 'pictures', 'slide-aal');
const files = fs.readdirSync(imgDir);

files.forEach(file => {
    const oldPath = path.join(imgDir, file);
    const newName = file.toLowerCase();
    const newPath = path.join(imgDir, newName);

    if (oldPath !== newPath) {
        console.log(`Renaming: ${file} -> ${newName}`);
        fs.renameSync(oldPath, newPath);
    }
});

const memoriesDir = path.join(__dirname, 'pictures', 'memories');
if (fs.existsSync(memoriesDir)) {
    const categories = fs.readdirSync(memoriesDir);
    categories.forEach(cat => {
        const catPath = path.join(memoriesDir, cat);
        if (fs.lstatSync(catPath).isDirectory()) {
            const memoryFiles = fs.readdirSync(catPath);
            memoryFiles.forEach(file => {
                const oldMPath = path.join(catPath, file);
                const newMName = file.toLowerCase();
                const newMPath = path.join(catPath, newMName);
                if (oldMPath !== newMPath) {
                    console.log(`Renaming Memory: ${cat}/${file} -> ${cat}/${newMName}`);
                    fs.renameSync(oldMPath, newMPath);
                }
            });
        }
    });
}
