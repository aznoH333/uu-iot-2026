require('dotenv').config({ quiet: true })

const fs = require('fs/promises')
const path = require('path')
const { PassThrough } = require('stream')
const { spawn } = require('child_process')
const assert = require('assert')
const recorder = require('node-record-lpcm16')

const STATES = {
  STANDBY: 'standby',
  LISTENING: 'listening',
  THINKING: 'thinking',
  TALKING: 'talking'
}

function numberFromEnv (name, fallback) {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback

  const parsed = Number(value)
  if (!Number.isFinite(parsed)) {
    throw new Error(`${name} must be a number`)
  }

  return parsed
}

function debugModeFromEnv (name, fallback) {
  const value = process.env[name]
  if (value === undefined || value === '') return fallback

  if (/^(0|false|no|off)$/i.test(value)) return 'false'
  if (/^(local)$/i.test(value)) return 'local'
  if (/^(api|1|true|yes|on)$/i.test(value)) return 'api'

  throw new Error(`${name} must be false, local, or api`)
}

function normalizeEndpoint (endpoint) {
  if (!endpoint) {
    throw new Error('SERVER_ENDPOINT is required')
  }

  if (/^https?:\/\//i.test(endpoint)) return endpoint

  return `http://${endpoint}`
}

function getConfig () {
  return {
    endpoint: normalizeEndpoint(process.env.SERVER_ENDPOINT),
    apiKey: process.env.API_KEY || '',
    sampleRate: numberFromEnv('SAMPLE_RATE', 24000),
    channels: numberFromEnv('CHANNELS', 1),
    volumeThreshold: numberFromEnv('VOLUME_THRESHOLD', 0.02),
    silenceMillis: numberFromEnv('SILENCE_MS', 1000),
    preRollMillis: numberFromEnv('PRE_ROLL_MS', 500),
    recorder: process.env.RECORDER || 'ffmpeg',
    inputDevice: process.env.INPUT_DEVICE || null,
    player: process.env.PLAYER || 'ffplay',
    audioDir: process.env.AUDIO_DIR || 'recordings',
    requestTimeoutMillis: numberFromEnv('REQUEST_TIMEOUT_MS', 30000),
    debugMode: debugModeFromEnv('DEBUG', 'false')
  }
}

function isDebugMode (config) {
  return config.debugMode !== 'false'
}

function calculatePcm16Level (chunk) {
  if (!chunk.length) return 0

  const samples = Math.floor(chunk.length / 2)
  if (samples === 0) return 0

  let sumSquares = 0

  for (let offset = 0; offset + 1 < chunk.length; offset += 2) {
    const sample = chunk.readInt16LE(offset) / 32768
    sumSquares += sample * sample
  }

  return Math.sqrt(sumSquares / samples)
}

function trimBase64Payload (value) {
  const trimmed = String(value || '').trim()
  const commaIndex = trimmed.indexOf(',')

  if (trimmed.startsWith('data:') && commaIndex !== -1) {
    return trimmed.slice(commaIndex + 1)
  }

  return trimmed
}

function decodeBase64Pcm16 (value) {
  const payload = trimBase64Payload(value)

  if (!payload) {
    throw new Error('Response did not include base64 audio')
  }

  return Buffer.from(payload, 'base64')
}

async function readResponseAudio (response) {
  const contentType = response.headers.get('content-type') || ''

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`Server returned ${response.status}${details ? `: ${details}` : ''}`)
  }

  if (contentType.includes('application/json')) {
    const body = await response.json()
    const audio = body.audio || body.audioBase64 || body.pcm16 || body.data || body.response || body.file
    return decodeBase64Pcm16(audio)
  }

  const body = await response.text()
  return decodeBase64Pcm16(body)
}

function getPlayerArgs (config) {
  const sampleRate = String(config.sampleRate)
  const channels = String(config.channels)

  if (config.player === 'sox') {
    return [
      '-q',
      '-t', 'raw',
      '-r', sampleRate,
      '-c', channels,
      '-e', 'signed-integer',
      '-b', '16',
      '-',
      '-d'
    ]
  }

  if (config.player === 'aplay') {
    return ['-q', '-f', 'S16_LE', '-r', sampleRate, '-c', channels]
  }

  if (config.player === 'ffplay') {
    return [
      '-autoexit',
      '-nodisp',
      '-loglevel', 'error',
      '-f', 's16le',
      '-ar', sampleRate,
      '-ac', channels,
      '-'
    ]
  }

  return [
    '-q',
    '-t', 'raw',
    '-r', sampleRate,
    '-c', channels,
    '-e', 'signed-integer',
    '-b', '16',
    '-'
  ]
}

function getFfmpegInputArgs (config) {
  if (process.platform === 'darwin') {
    return ['-f', 'avfoundation', '-i', config.inputDevice || ':0']
  }

  if (process.platform === 'linux') {
    return ['-f', 'alsa', '-i', config.inputDevice || 'default']
  }

  if (process.platform === 'win32') {
    if (!config.inputDevice) {
      throw new Error('INPUT_DEVICE is required for FFmpeg recording on Windows')
    }

    return ['-f', 'dshow', '-i', config.inputDevice]
  }

  throw new Error(`Unsupported platform for FFmpeg recording: ${process.platform}`)
}

function getFfmpegRecorderArgs (config) {
  return [
    '-hide_banner',
    '-loglevel', 'error',
    ...getFfmpegInputArgs(config),
    '-ac', String(config.channels),
    '-ar', String(config.sampleRate),
    '-f', 's16le',
    '-acodec', 'pcm_s16le',
    '-'
  ]
}

class FfmpegRecording {
  constructor (config) {
    this.config = config
    this.paused = false
    this._stream = new PassThrough()
    this.process = spawn('ffmpeg', getFfmpegRecorderArgs(config), {
      stdio: ['ignore', 'pipe', 'pipe']
    })

    this.process.stdout.pipe(this._stream)
    this.process.stderr.on('data', chunk => {
      const message = chunk.toString().trim()
      if (message) console.error(`ffmpeg: ${message}`)
    })
    this.process.on('error', error => this._stream.emit('error', error))
    this.process.on('close', code => {
      if (code && code !== 255) {
        this._stream.emit('error', new Error(`ffmpeg exited with code ${code}`))
      }

      this._stream.end()
    })
  }

  stop () {
    if (this.process && !this.process.killed) {
      this.process.kill('SIGINT')
    }
  }

  pause () {
    if (this.process && !this.paused) {
      this.process.kill('SIGSTOP')
      this._stream.pause()
      this.paused = true
    }
  }

  resume () {
    if (this.process && this.paused) {
      this.process.kill('SIGCONT')
      this._stream.resume()
      this.paused = false
    }
  }

  isPaused () {
    return this.paused
  }

  stream () {
    return this._stream
  }
}

function createRecording (config) {
  if (config.recorder === 'ffmpeg') {
    return new FfmpegRecording(config)
  }

  return recorder.record({
    sampleRate: config.sampleRate,
    channels: config.channels,
    audioType: 'raw',
    recorder: config.recorder,
    device: config.inputDevice
  })
}

function playPcm16 (audio, config) {
  return new Promise((resolve, reject) => {
    const child = spawn(config.player, getPlayerArgs(config), { stdio: ['pipe', 'ignore', 'pipe'] })
    const stderr = []

    child.stderr.on('data', chunk => stderr.push(chunk))
    child.on('error', reject)
    child.on('close', code => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(`${config.player} exited with code ${code}: ${Buffer.concat(stderr).toString().trim()}`))
    })

    child.stdin.end(audio)
  })
}

class Gateway {
  constructor (config, dependencies = {}) {
    this.config = config
    this.fetch = dependencies.fetch || globalThis.fetch
    this.recordFactory = dependencies.recordFactory || createRecording
    this.play = dependencies.play || playPcm16
    this.now = dependencies.now || (() => Date.now())

    this.state = STATES.STANDBY
    this.recording = null
    this.preRollChunks = []
    this.preRollBytes = 0
    this.listeningChunks = []
    this.silenceStartedAt = null
    this.runCounter = 0
    this.processing = Promise.resolve()
  }

  async start () {
    if (!this.fetch) {
      throw new Error('fetch is unavailable in this Node.js runtime')
    }

    await fs.mkdir(this.config.audioDir, { recursive: true })
    this.transitionTo(STATES.STANDBY)

    this.recording = this.recordFactory(this.config)

    const stream = this.recording.stream()

    stream.on('data', chunk => this.handleAudioChunk(chunk))
    stream.on('error', error => {
      console.error('Microphone stream error:', error)
      process.exitCode = 1
    })

    console.log(`Monitoring microphone at ${this.config.sampleRate}Hz PCM16 mono. Threshold: ${this.config.volumeThreshold}`)
    if (this.config.debugMode === 'local') {
      console.log('Debug mode: local. The gateway will process one utterance, save voice_input.pcm16, then stop.')
    } else if (this.config.debugMode === 'api') {
      console.log('Debug mode: api. The gateway will process one utterance, save voice_input.pcm16 and voice_output.pcm16, then stop.')
    }
  }

  stop () {
    if (this.recording) {
      this.recording.stop()
      this.recording = null
    }
  }

  handleAudioChunk (chunk) {
    if (this.state === STATES.THINKING || this.state === STATES.TALKING) return

    const level = calculatePcm16Level(chunk)

    if (this.state === STATES.STANDBY) {
      this.addPreRollChunk(chunk)

      if (level >= this.config.volumeThreshold) {
        this.enterListening(level)
      }

      return
    }

    this.listeningChunks.push(chunk)

    if (isDebugMode(this.config)) {
      console.log(`Noise level: ${level.toFixed(4)}`)
    }

    if (level < this.config.volumeThreshold) {
      if (!this.silenceStartedAt) {
        this.silenceStartedAt = this.now()
      }

      if (this.now() - this.silenceStartedAt >= this.config.silenceMillis) {
        const audio = Buffer.concat(this.listeningChunks)
        this.processing = this.processUtterance(audio)
      }

      return
    }

    this.silenceStartedAt = null
  }

  addPreRollChunk (chunk) {
    const maxBytes = Math.round(this.config.sampleRate * this.config.channels * 2 * (this.config.preRollMillis / 1000))

    this.preRollChunks.push(chunk)
    this.preRollBytes += chunk.length

    while (this.preRollBytes > maxBytes && this.preRollChunks.length > 1) {
      const removed = this.preRollChunks.shift()
      this.preRollBytes -= removed.length
    }
  }

  enterListening (level) {
    this.listeningChunks = this.preRollChunks.slice()
    this.preRollChunks = []
    this.preRollBytes = 0
    this.silenceStartedAt = null
    this.transitionTo(STATES.LISTENING)
    console.log(`Voice detected. Level: ${level.toFixed(4)}`)
  }

  async processUtterance (audio) {
    this.listeningChunks = []
    this.silenceStartedAt = null
    this.pauseRecording()
    this.transitionTo(STATES.THINKING)

    const runId = String(++this.runCounter).padStart(4, '0')
    const requestPath = path.join(this.config.audioDir, isDebugMode(this.config) ? 'voice_input.pcm16' : `${runId}-request.pcm16`)
    const responsePath = path.join(this.config.audioDir, isDebugMode(this.config) ? 'voice_output.pcm16' : `${runId}-response.pcm16`)

    try {
      await fs.writeFile(requestPath, audio)

      if (this.config.debugMode === 'local') {
        console.log(`Saved debug input: ${requestPath}`)
        this.stop()
        process.exitCode = 0
        return
      }

      const responseAudio = await this.sendAudio(audio)
      await fs.writeFile(responsePath, responseAudio)

      if (this.config.debugMode === 'api') {
        console.log(`Saved debug input: ${requestPath}`)
        console.log(`Saved debug output: ${responsePath}`)
        this.stop()
        process.exitCode = 0
        return
      }

      this.transitionTo(STATES.TALKING)
      await this.play(responseAudio, this.config)
    } catch (error) {
      console.error(error.message)
    } finally {
      if (isDebugMode(this.config)) {
        this.stop()
        return
      }

      this.transitionTo(STATES.STANDBY)
      this.resumeRecording()
    }
  }

  async sendAudio (audio) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.config.requestTimeoutMillis)
    const headers = {
      'content-type': 'application/json',
      accept: 'application/json, text/plain'
    }

    try {
      const response = await this.fetch(this.config.endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          content: audio.toString('base64'),
          apiKey: this.config.apiKey
        }),
        signal: controller.signal
      })

      return await readResponseAudio(response)
    } finally {
      clearTimeout(timeout)
    }
  }

  pauseRecording () {
    if (this.recording && !this.recording.isPaused()) {
      this.recording.pause()
    }
  }

  resumeRecording () {
    if (this.recording && this.recording.isPaused()) {
      this.recording.resume()
    }
  }

  transitionTo (state) {
    if (this.state === state) return
    this.state = state
    console.log(`State: ${state}`)
  }
}

async function runSelfTest () {
  const sample = Buffer.alloc(8)
  sample.writeInt16LE(32767, 0)
  sample.writeInt16LE(-32768, 2)

  assert(calculatePcm16Level(Buffer.alloc(8)) === 0)
  assert(calculatePcm16Level(sample) > 0.7)

  const response = new Response(JSON.stringify({ audio: sample.toString('base64') }), {
    status: 200,
    headers: { 'content-type': 'application/json' }
  })
  const decoded = await readResponseAudio(response)
  assert(decoded.equals(sample))
  assert(getFfmpegRecorderArgs({ sampleRate: 24000, channels: 1, inputDevice: ':0' }).includes('s16le'))
  assert(getPlayerArgs({ sampleRate: 24000, channels: 1, player: 'ffplay' }).includes('s16le'))
  assert(debugModeFromEnv('MISSING_DEBUG_VALUE', 'false') === 'false')

  console.log('Self-test passed')
}

async function main () {
  if (process.argv.includes('--self-test')) {
    await runSelfTest()
    return
  }

  const gateway = new Gateway(getConfig())

  process.once('SIGINT', () => {
    console.log('\nStopping gateway')
    gateway.stop()
  })

  await gateway.start()
}

if (require.main === module) {
  main().catch(error => {
    console.error(error)
    process.exitCode = 1
  })
}

module.exports = {
  Gateway,
  STATES,
  calculatePcm16Level,
  createRecording,
  decodeBase64Pcm16,
  getConfig,
  getFfmpegRecorderArgs,
  getPlayerArgs,
  normalizeEndpoint,
  readResponseAudio
}
