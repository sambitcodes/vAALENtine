const fs = require('fs');
const path = require('path');

const memoriesDir = path.join(__dirname, 'pictures', 'memories');

// Hardcoded order and metadata as requested
const STOPS = [
    {
        folder: "when we talked for the first time",
        title: "First Talk",
        description: "You sent a one time view photo and I kept it open on my other phone the whole night. We talked for hours falling in love."
    },
    {
        folder: "the first meeting",
        title: "The First Meeting",
        description: "Remember how serious I was at the reception as If I knew you forever. Afterwards, Hugging tightly for half an hour and you took my tshirt. WOWWWW!"
    },
    {
        folder: "when we went on a trip for the first time",
        title: "First Trip",
        description: "Our first big adventure together, those food items on train, staying in a nice hotel, and Le Roi's food."
    },
    {
        folder: "a chillis date never disappoints",
        title: "Chilli's Date",
        description: "Thank you for introducing me to this class of a restaurant. It's my favourite! Kabhi le chalo hame firse!"
    },
    {
        folder: "my forever together moment",
        title: "Forever Moment",
        description: "I still remember every small detail of that day, you holding me tight. Standing side by side, because you saw me anxious and tensed. I felt so safe in your arms."
    },
    {
        folder: "the mandarmani trip",
        title: "Mandarmani",
        description: "The sea breeze and the sound of waves. The beauty of the ocean matched our joy. The memories we made at the coast."
    },
    {
        folder: "the rough patch",
        title: "The Rough Patch",
        description: "Every journey has its bumps, This was a big one. A pre-planned broken vacation where we came close and grew apart. "
    },
    {
        folder: "came back with a bang",
        title: "The Return",
        description: "Month of silence and then we slowly grew back. We both tried for better. Starting a fresh chapter with a bang."
    },
    {
        folder: "the last walk to remember",
        title: "Last Walk",
        description: "Standing on the bridge looking at the beauty of moon, returning with paan. Peaceful moments under the stars."
    },
    {
        folder: "the last call",
        title: "The Last Call",
        description: "It was just the end - the day after everything just sublimed. Had I any idea I wouldnt have let this call end. Hours felt like seconds on those calls."
    }
];

const manifest = [];

if (fs.existsSync(memoriesDir)) {
    STOPS.forEach((stop, index) => {
        const folderPath = path.join(memoriesDir, stop.folder);
        let images = [];

        if (fs.existsSync(folderPath) && fs.statSync(folderPath).isDirectory()) {
            const files = fs.readdirSync(folderPath);
            images = files
                .filter(f => /\.(jpg|jpeg|png|gif|webp)$/i.test(f))
                .map(img => `/pictures/memories/${stop.folder}/${img}`);
        } else {
            console.warn(`Warning: Folder not found: ${stop.folder}`);
        }

        manifest.push({
            id: `station-${index}`,
            name: stop.title, // User requested specific titles? Using mapped ones for now
            folder: stop.folder,
            displayTitle: `${index + 1}. ${stop.title}`,
            description: stop.description,
            images: images
        });
    });
}

const fileContent = `const TRAIN_DATA = ${JSON.stringify(manifest, null, 4)};\n`;
const outputPath = path.join(__dirname, 'js', 'train_data.js');

fs.writeFileSync(outputPath, fileContent);
console.log(`Manifest written to ${outputPath}`);
