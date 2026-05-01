/*
 * Shart gpt test code
 */

const fs = require("fs");
const path = require("path");
const record = require("node-record-lpcm16");

const recordingsDir = path.join(__dirname, "recordings");

if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir);
}

function getFilename() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    return path.join(recordingsDir, `recording-${timestamp}.wav`);
}

function recordAudioFor(seconds = 10) {
    const filename = getFilename();
    const file = fs.createWriteStream(filename, { encoding: "binary" });

    console.log(`Recording ${seconds} seconds to ${filename}`);

    const recording = record.record({
        sampleRate: 16000,
        channels: 1,
        audioType: "wav",
        recorder: "sox",
        device: "plughw:1,0", // change this if your mic uses a different device
    });

    recording.stream().pipe(file);

    setTimeout(() => {
        recording.stop();
        console.log(`Finished recording: ${filename}`);
    }, seconds * 1000);
}

// Example: record 10 seconds every minute
recordAudioFor(10);

setInterval(() => {
    recordAudioFor(10);
}, 60 * 1000);