import mic from "mic";
import 'dotenv/config'


const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;

const STATES = {
    IDLE: "idle",
    LISTENING: "listening",
    THINKING: "thinking",
    TALKING: "talking"
}


const globalState = {
    currentState: STATES.IDLE,
    noiseLevelAccumulator: [],
    averageNoiseLevel: 0,
}



function main(){
    console.log("initializing gateway");
    console.log("starting microphone");
    // setup mic
    globalState.micHandle = mic({
        rate: String(SAMPLE_RATE),
        channels: String(CHANNELS),
        bitwidth: String(BIT_DEPTH),
        encoding: "signed-integer",
        endian: "little",
        fileType: "raw",

        // Optional: choose your ALSA device.
        // Run `arecord -l` to find it.
        // device: "plughw:1,0",
    });


    globalState.audioInputStream = globalState.micHandle.getAudioStream();
    globalState.audioInputStream.on("data", (data) => {
        const rms = calculateRms(data);
        const db = rmsToDb(rms);
        const level = classifyNoise(db);

        console.log({
            rms: rms.toFixed(4),
            db: db.toFixed(1),
            level,
        });
    });

    globalState.audioInputStream.on("error", (err) => {
        console.error("Microphone error:", err);
    });
    globalState.micHandle.start();

    console.log("starting primary loop");
    // launch primare loop
    setInterval(primaryLoop, 300);
}




function primaryLoop() {
    // handle current state
    switch (globalState.currentState) {
        case STATES.IDLE:
            handleIdleState();
            break;
    }
}


function handleIdleState() {

}


// region noise functions
const QUIET_THRESHOLD = process.env.QUIET_THRESHOLD;
const LOUD_THRESHOLD = process.env.LOUDNESS_THRESHOLD;

function calculateRms(buffer) {
    let sumSquares = 0;
    let sampleCount = 0;

    // 16-bit signed little-endian PCM = 2 bytes per sample
    for (let i = 0; i < buffer.length; i += 2) {
        const sample = buffer.readInt16LE(i) / 32768;
        sumSquares += sample * sample;
        sampleCount++;
    }

    return Math.sqrt(sumSquares / sampleCount);
}

function rmsToDb(rms) {
    // Avoid log10(0)
    if (rms <= 0) return -Infinity;

    // This is dBFS, not calibrated sound pressure dB SPL.
    return 20 * Math.log10(rms);
}

function classifyNoise(db) {
    if (db < QUIET_THRESHOLD) return "quiet";
    if (db < LOUD_THRESHOLD) return "normal";
    return "loud";
}
// endregion



main();