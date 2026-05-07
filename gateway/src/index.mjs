import mic from "mic";
import 'dotenv/config'
import wav from "wav"
import fs from "node:fs";

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;
const BYTES_PER_SAMPLE = BIT_DEPTH / 8;
const PRE_RECORD_SECONDS = 1;



// rolling buffer
const preRecordChunks = [];
let preRecordBytes = 0;
const MAX_PRE_RECORD_BYTES = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE * PRE_RECORD_SECONDS;


const STATES = {
    IDLE: "idle",
    LISTENING: "listening",
    THINKING: "thinking",
    TALKING: "talking"
}

const NOISE_LEVEL = {
    LOW: "low",
    MEDIUM: "medium",
    HIGH: "high"
}


const globalState = {
    currentState: STATES.IDLE,
    currentNoiseLevel: NOISE_LEVEL.LOW,
    noiseAccumulator: 0
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
        globalState.currentNoiseLevel = level;

        if (globalState.isRecording) {
            globalState.currentFileWriter.write(data);
        }
		addToPreRecordBuffer(data);
    });

    globalState.audioInputStream.on("error", (err) => {
        console.error("Microphone error:", err);
    });
    globalState.micHandle.start();

    console.log("starting primary loop");
    // launch primare loop
    setInterval(primaryLoop, 50);
}




function primaryLoop() {

    //console.log("current noise level :", globalState.currentNoiseLevel, "accumulator:", globalState.noiseAccumulator);
    // handle current state
    switch (globalState.currentState) {
        case STATES.IDLE:
            handleIdleState();
            break;
        case STATES.LISTENING:
            handleListeningState();
            break;
    }

}


function handleIdleState() {
    if (globalState.currentNoiseLevel === NOISE_LEVEL.MEDIUM) {
        globalState.noiseAccumulator += 1;
    }
    else if (globalState.currentNoiseLevel === NOISE_LEVEL.HIGH) {
        globalState.noiseAccumulator += 3;
    }
    else if (globalState.currentNoiseLevel === NOISE_LEVEL.LOW && globalState.noiseAccumulator > 0) {
        globalState.noiseAccumulator -= 1;
    }

    if (globalState.noiseAccumulator > 5) {
        // start listening
        startRecording();
        globalState.noiseAccumulator = 0;
        globalState.currentState = STATES.LISTENING;
    }
}


function handleListeningState() {
    if (globalState.currentNoiseLevel === NOISE_LEVEL.LOW) {
        globalState.noiseAccumulator += 1;
    }else {
        globalState.noiseAccumulator = 0;
    }


    if (globalState.noiseAccumulator > 10) {
        globalState.currentState = STATES.IDLE;
        globalState.noiseAccumulator = 0;
        stopRecording();
    }
}


// region noise calculation functions
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
    if (db < QUIET_THRESHOLD) return NOISE_LEVEL.LOW;
    if (db < LOUD_THRESHOLD) return NOISE_LEVEL.MEDIUM;
    return NOISE_LEVEL.HIGH;
}

function addToPreRecordBuffer(chunk) {
 	preRecordChunks.push(chunk);
  	preRecordBytes += chunk.length;

  	while (preRecordBytes > MAX_PRE_RECORD_BYTES) {
    	const removedChunk = preRecordChunks.shift();
    	preRecordBytes -= removedChunk.length;
  	}
}


// endregion

// region recording functions
let recordingCounter = 0;

function startRecording() {
    const filename = `recording-${recordingCounter}.wav`;
    recordingCounter++;

	
    globalState.currentFileWriter = new wav.FileWriter(filename, {
        sampleRate: SAMPLE_RATE,
        channels: CHANNELS,
        bitDepth: BIT_DEPTH,
    });

	// push prerecord buffer to current recording
	for (const bufferedChunk of preRecordChunks) {
	    globalState.currentFileWriter.write(bufferedChunk);
  	}



	// start recording
    globalState.isRecording = true;

    console.log(`Started recording: ${filename}`);
}

function stopRecording() {
    if (!globalState.currentFileWriter) return;

    globalState.currentFileWriter.end();

    globalState.currentFileWriter = null;
    globalState.isRecording = false;

    console.log("Stopped recording");
}
// endregion

main();
