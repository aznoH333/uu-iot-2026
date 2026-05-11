import mic from "mic";
import 'dotenv/config'
// import wav from "wav"
import fs from "node:fs";
import Speaker from "speaker-arm64";
import {Readable} from "stream";
import webrtcvad from "webrtcvad";

const VAD = webrtcvad.default ?? webrtcvad;

const SAMPLE_RATE = 16000;
const CHANNELS = 1;
const BIT_DEPTH = 16;
const BYTES_PER_SAMPLE = BIT_DEPTH / 8;
const PRE_RECORD_SECONDS = process.env.PRE_RECORD_SECONDS === undefined ? process.env.PRE_RECORD_SECONDS : 1;

const vad = new VAD(SAMPLE_RATE, 2);


// vad analysis
const FRAME_MS = 30;
const FRAME_BYTES = SAMPLE_RATE * (FRAME_MS / 1000) * BYTES_PER_SAMPLE;

// rolling buffer
const MAX_PRE_RECORD_BYTES = SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE * PRE_RECORD_SECONDS;


const STATES = {
	IDLE: "IDLE",
	LISTENING: "LISTENING",
	THINKING: "THINKING",
	TALKING: "TALKING"
};

const DEVICE_MODE = {
	LIVE: "LIVE",
	DEBUG_PLAYBACK: "DEBUG_PLAYBACK",
};


const NOISE_LEVEL = {
	LOW: "low",
	MEDIUM: "medium",
	HIGH: "high"
};


const globalState = {
	currentState: STATES.IDLE,
	currentNoiseLevel: NOISE_LEVEL.LOW,
	noiseAccumulator: 0,
	preRecordChunks: [],
	preRecordBytes: 0,
	currentAudio: [],
}



function main(){
	console.log("initializing gateway");

	// check device configuration for errors
	globalState.deviceMode = DEVICE_MODE[process.env.DEVICE_MODE];
	console.log(`device mode : [${globalState.deviceMode}]`);
	if (globalState.deviceMode === undefined) {
		console.error(`Failed to start device, unsuported DEVICE_MODE: ${process.env.DEVICE_MODE}, must be one of ${Object.values(DEVICE_MODE)}`)
		return;
	}


	if (globalState.deviceMode === DEVICE_MODE.LIVE) {
		if (process.env.API_KEY === undefined) {
			console.error("Device needs API_KEY to function");
			return;
		}

		if (process.env.SERVER_ENDPOINT === undefined) {
			console.error("Device needs SERVER_ENDPOINT to function");
			return;
		}
	}




	console.log("starting microphone");
	// setup mic
	globalState.micHandle = mic({
		rate: String(SAMPLE_RATE),
		channels: String(CHANNELS),
		bitwidth: String(BIT_DEPTH),
		encoding: "signed-integer",
		endian: "little",
		fileType: "raw",
		debug: true,
		// Optional: choose your ALSA device.
		// Run `arecord -l` to find it.
		device: "dmic",
	});


	globalState.audioInputStream = globalState.micHandle.getAudioStream();
	globalState.audioInputStream.on("data", (data) => {
		if (globalState.isRecording) {
			globalState.currentRecording.push(data);
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



function switchState(nextState) {
	if (globalState.currentState === nextState) {
		return;
	}

	console.log("Current device status :", nextState);
	globalState.currentState = nextState;
	globalState.noiseAccumulator = 0;

	globalState.preRecordChunks = [];
	globalState.preRecordBytes = 0;
}


async function primaryLoop() {

	try {

		let buffer = Buffer.concat(globalState.preRecordChunks);
		let speechFrames = 0;
		let silenceFrames = 0;


		while (buffer.length >= FRAME_BYTES) {
			const frame = buffer.subarray(0, FRAME_BYTES);
			buffer = buffer.subarray(FRAME_BYTES);

			const isSpeech = await vad.process(frame);

			if (isSpeech) {
				speechFrames += 1;
			}else {
				silenceFrames += 1;
			}
		}

		globalState.isSpeaking = speechFrames > 10;

		// handle current state
		switch (globalState.currentState) {
			case STATES.IDLE:
				await handleIdleState();
				break;
			case STATES.LISTENING:
				await handleListeningState();
				break;

			case STATES.THINKING:
				handleThinkingState();
				break;
			case STATES.TALKING:
				handleSpeakingState();
				break;
		}
	} catch (e) {
		console.log(e);
		switchState(STATES.IDLE);
	}

}


async function handleIdleState() {

	if (globalState.isSpeaking) {
		// start listening
		startRecording();
		switchState(STATES.LISTENING);
	}
}


async function handleListeningState() {
	if (!globalState.isSpeaking) {
		globalState.noiseAccumulator += 1;
	}else {
		globalState.noiseAccumulator = 0;
	}


	if (globalState.noiseAccumulator > 10) {


		const recordingLengthSeconds = stopRecording();

		if (recordingLengthSeconds <= 3 || globalState.currentRecordingAsString === undefined) {
			switchState(STATES.IDLE);
		} else {
			switchState(STATES.THINKING);

			// call api
			try {
				if (globalState.deviceMode === DEVICE_MODE.LIVE) {
					await handleAskingServerForResponse();
				} else {
					handlePlaybackResponse();
				}


				switchState(STATES.TALKING);

				playBase64Pcm16(
					globalState.assistantPlaybackData,
					{
						sampleRate: 24000,
						channels: 1,
						bitDepth: 16,
					},
					()=>{
						switchState(STATES.IDLE);
					}
				);

			} catch(e) {
				console.log("Failed to play audio : ", e);
				switchState(STATES.IDLE);
			}
		}


	}
}

function handlePlaybackResponse() {
	globalState.assistantPlaybackData = globalState.currentRecordingAsString;
}

async function handleAskingServerForResponse() {
	console.log("calling endpoit", process.env.SERVER_ENDPOINT, process.env.API_KEY);

	const response = await fetch(process.env.SERVER_ENDPOINT, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify({
			content: globalState.currentRecordingAsString,
			apiKey: process.env.API_KEY
		}),
	});

	const data = await response.json();

	globalState.assistantPlaybackData = data.content;

}


function handleThinkingState() {
	globalState.currentState = STATES.SPEAKING;
}

function handleSpeakingState() {
	// do nothing
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
	globalState.preRecordChunks.push(chunk);
	globalState.preRecordBytes += chunk.length;

	while (globalState.preRecordBytes > MAX_PRE_RECORD_BYTES) {
		const removedChunk = globalState.preRecordChunks.shift();
		globalState.preRecordBytes -= removedChunk.length;
	}
}


// endregion

// region recording functions
let recordingCounter = 0;

function startRecording() {

	globalState.currentRecording = [];


	// push prerecord buffer to current recording
	for (const bufferedChunk of globalState.preRecordChunks) {
		globalState.currentRecording.push(bufferedChunk);
	}

	// start recording
	globalState.isRecording = true;
}

function stopRecording() {
	globalState.isRecording = false;


	const buffer = Buffer.concat(globalState.currentRecording);
	globalState.currentRecordingAsString = resamplePcm16Mono(buffer).toString("base64");
	const currentRecordingLength = buffer.length / (SAMPLE_RATE * CHANNELS * BYTES_PER_SAMPLE);
	console.log("Recording length :", currentRecordingLength);

	return currentRecordingLength;
}


function resamplePcm16Mono(buffer, fromRate = 16000, toRate = 24000) {
	if (!Buffer.isBuffer(buffer)) {
		throw new TypeError("Expected a Node.js Buffer");
	}

	if (buffer.length % 2 !== 0) {
		throw new Error("PCM16 buffer length must be even");
	}

	const inputSamples = new Int16Array(
		buffer.buffer,
		buffer.byteOffset,
		buffer.length / 2
	);

	const ratio = toRate / fromRate;
	const outputLength = Math.round(inputSamples.length * ratio);
	const outputSamples = new Int16Array(outputLength);

	for (let i = 0; i < outputLength; i++) {
		const srcIndex = i / ratio;
		const srcIndexFloor = Math.floor(srcIndex);
		const srcIndexCeil = Math.min(srcIndexFloor + 1, inputSamples.length - 1);
		const t = srcIndex - srcIndexFloor;

		const sample =
			inputSamples[srcIndexFloor] * (1 - t) +
			inputSamples[srcIndexCeil] * t;

		outputSamples[i] = Math.max(-32768, Math.min(32767, Math.round(sample)));
	}

	return Buffer.from(
		outputSamples.buffer,
		outputSamples.byteOffset,
		outputSamples.byteLength
	);
}

// endregion


// region audio playing
function amplifyPcm16Le(buffer, gain = 2.0) {
	const amplified = Buffer.allocUnsafe(buffer.length);

	for (let i = 0; i < buffer.length; i += 2) {
		let sample = buffer.readInt16LE(i);

		sample = Math.round(sample * gain);

		// Prevent clipping overflow
		if (sample > 32767) sample = 32767;
		if (sample < -32768) sample = -32768;

		amplified.writeInt16LE(sample, i);
	}

	return amplified;
}


function playBase64Pcm16(base64Audio, options = {}, onAudioComplete) {
	const {
		sampleRate = 24000,
		channels = 1,
		bitDepth = 16,
	} = options;

	return new Promise((resolve, reject) => {
		const audioBuffer = Buffer.from(base64Audio, "base64");

		const speaker = new Speaker({
			channels,
			bitDepth,
			sampleRate,
			signed: true,
			endian: "little",
		});

		const audioStream = Readable.from(audioBuffer);

		const handleError = (error) => {
			console.log("failed to play audio");
			onAudioComplete();
			reject();
		}

		speaker.on("close", ()=>{
			resolve();
			onAudioComplete();
		});
		speaker.on("error", handleError);
		audioStream.on("error", handleError);

		audioStream.pipe(speaker);

	});
}
// endregion

main();