import WebSocket from "ws";

/**
 * a wrapper method for calling openai api
 * @param base64Audio - base64 encoded audio file with the users message
 * @param messageBacklog - an object holding the previous conversation
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
function sendMessageToOpenAi(
    base64Audio,
    messageBacklog,
    voice = "alloy",
    onAudioReceive,
    onTranscriptReceive,
    onError,
) {
    let receivedAudio = false;
    let userTranscript = undefined;
    let assistantTranscript = undefined;

    const ws = new WebSocket(
        "wss://api.openai.com/v1/realtime?model=gpt-4o-realtime-preview",
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                "OpenAI-Beta": "realtime=v1",
            },
        }
    );

    const checkIfWsCanBeClosed = () => {
        if (receivedAudio && userTranscript !== undefined && assistantTranscript !== undefined) {
            onTranscriptReceive(userTranscript, assistantTranscript);
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
                instructions: "Answer the user with a short spoken response.",
            },
        }));
    });

    const audioChunks = [];

    // handle response
    ws.on("message", (data) => {
        const event = JSON.parse(data.toString());

        if (event.type === "response.audio.delta") {
            audioChunks.push(Buffer.from(event.delta, "base64"));
        }

        if (event.type === "response.audio.done") {
            const audio = Buffer.concat(audioChunks);
            onAudioReceive(audio);

            receivedAudio = true;

            checkIfWsCanBeClosed();
        }

        if (event.type === "error") {
            console.error(event.error);
            onError(event.error);
            ws.close();
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
}
