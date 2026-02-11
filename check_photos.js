const fs = require('fs');
const path = require('path');

const jsPath = path.join(__dirname, 'js', 'home.js');
const imgDir = path.join(__dirname, 'pictures', 'slide-aal');

const jsContent = fs.readFileSync(jsPath, 'utf8');
const photoListMatch = jsContent.match(/const photoList = \[\s*([\s\S]*?)\s*\];/);

if (!photoListMatch) {
    console.error('Could not find photoList in js/home.js');
    process.exit(1);
}

const photoList = photoListMatch[1]
    .split(',')
    .map(s => s.trim().replace(/"/g, ''))
    .filter(s => s.length > 0);

console.log(`Found ${photoList.length} photos in js/home.js`);

const filesOnDisk = fs.readdirSync(imgDir);
const diskSet = new Set(filesOnDisk);

let brokenCount = 0;
photoList.forEach(name => {
    if (!diskSet.has(name)) {
        console.log(`BROKEN: ${name}`);
        brokenCount++;
    }
});

if (brokenCount === 0) {
    console.log('All photos in js/home.js exist on disk with matching casing.');
} else {
    console.log(`${brokenCount} broken photos found.`);
}

// Check for files on disk but NOT in JS
filesOnDisk.forEach(file => {
    if (!photoList.includes(file) && (file.endsWith('.jpg') || file.endsWith('.png') || file.endsWith('.PNG') || file.endsWith('.JPG'))) {
        console.log(`On disk but missing from JS: ${file}`);
    }
});
