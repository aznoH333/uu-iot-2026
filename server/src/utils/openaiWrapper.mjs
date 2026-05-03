import WebSocket from "ws";

const REQUEST_TIMEOUT_MS = 45_000;


/**
 * List of supported voices
 * 'alloy', 'ash', 'ballad', 'coral', 'echo', 'sage', 'shimmer', 'verse', 'marin', 'cedar'.
 */

/**
 * a wrapper method for calling openai api
 * @param base64Audio - base64 encoded audio file with the users message
 * @param messageBacklog - an object holding the previous conversation
 * @param assistantConfig - a string of instructions for the assistant
 * @param voice - which openai voice should be used
 * @param onAudioReceive - a function that handles what should happen with the received audio
 * @param onTranscriptReceive - a function that handles what should happen with the received transcript
 * @param onError - a function that handles what should happen on api error
 *
 * expected structure of messageBacklog:
 * {
 *     messages: [
 *         {
 *             "role": "user",
 *             "text": "some text"
 *         },
 *         {
 *             "role": "assistant",
 *             "text": "some response"
 *         },
 *         ...,
 *     ]
 * }
 */
export function sendMessageToOpenAi(
    base64Audio,
    messageBacklog,
    assistantConfig,
    voice = "alloy",
    onAudioReceive,
    onTranscriptReceive,
    onError,
) {
    let receivedAudio = false;
    let userTranscript = undefined;
    let assistantTranscript = undefined;
    let closeExpected = false;
    let errorHandled = false;

    const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1",
            },
        }
    );

    const handleError = (error) => {
        if (errorHandled) {
            return;
        }

        errorHandled = true;
        closeExpected = true;
        onError(error);

        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
            ws.close();
        }
    }

    const timeout = setTimeout(() => {
        handleError(new Error("OpenAI realtime request timed out"));
    }, REQUEST_TIMEOUT_MS);

    const checkIfWsCanBeClosed = () => {
        if (receivedAudio && userTranscript !== undefined && assistantTranscript !== undefined) {
            onTranscriptReceive(userTranscript, assistantTranscript);
            closeExpected = true;
            ws.close();
        }
    }

    // send initial data
    ws.on("open", () => {
        // send conversation history
        for (const message of messageBacklog.messages) {
            ws.send(JSON.stringify({
                type: "conversation.item.create",
                item: {
                    type: "message",
                    role: message.role,
                    content: [
                        {
                            type: message.role === "user" ? "input_text" : "output_text",
                            text: message.text,
                        },
                    ],
                },
            }));
        }

        ws.send(JSON.stringify({
            type: "session.update",
            session: {
                modalities: ["text", "audio"],
                voice: voice,
                input_audio_format: "pcm16",
                output_audio_format: "pcm16",
                turn_detection: null,
                input_audio_transcription: {
                    model: "gpt-4o-mini-transcribe",
                },
            },
        }));

        ws.send(JSON.stringify({
            type: "input_audio_buffer.append",
            audio: base64Audio,
        }));

        ws.send(JSON.stringify({
            type: "input_audio_buffer.commit",
        }));

        ws.send(JSON.stringify({
            type: "response.create",
            response: {
                modalities: ["text", "audio"],
                instructions: `Instructions: [${assistantConfig}]. Answer the user with a short spoken response.`,
            },
        }));
    });

    const audioChunks = [];

    // handle response
    ws.on("message", (data) => {
        let event;

        try {
            event = JSON.parse(data.toString());
        } catch (error) {
            handleError(error);
            return;
        }

        if (event.type === "response.audio.delta" || event.type === "response.output_audio.delta") {
            audioChunks.push(Buffer.from(event.delta, "base64"));
        }

        if (event.type === "response.audio.done" || event.type === "response.output_audio.done") {
            const audio = Buffer.concat(audioChunks);
            onAudioReceive(audio.toString("base64"));

            receivedAudio = true;

            checkIfWsCanBeClosed();
        }

        if (event.type === "error") {
            console.error(event.error);
            handleError(event.error);
        }

        // get user transcript
        if (event.type === "conversation.item.input_audio_transcription.completed") {
            console.log("User transcript:", event.transcript);

            userTranscript = event.transcript;

            checkIfWsCanBeClosed();
        }


        // get assistant transcript
        if (event.type === "response.output_audio_transcript.done") {
            console.log("Assistant transcript:", event.transcript);

            assistantTranscript = event.transcript;

            checkIfWsCanBeClosed();
        }

    });

    ws.on("error", (error) => {
        handleError(error);
    });

    ws.on("close", () => {
        clearTimeout(timeout);

        if (!closeExpected && !receivedAudio) {
            handleError(new Error("OpenAI realtime connection closed before audio was received"));
        }
    });
}
