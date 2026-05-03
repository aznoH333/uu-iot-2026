# introduction
the goal of this project is to serve as a gateway/node for an iot device.
this device has a microphone and a speaker. the point of the device is to be
a physical node for an ai assistant. the user will be able to talk to the device
and receive a response.

## device operation
the device will have a few distinct states
1. standby
2. listening
3. thinking
4. talking

by default the device is in a standby state. in this state the device is monitoring 
how loud is the noise from microphone. if the noise is over a certain treshold the device assumes
that it is being talked to. so it switches to a listening state.

in the listening state it waits for the volume to return to normal for a second, 
then it assumes that the user stopped talking and saves the audio since the start of the listening state + a few seconds.
once the volume has normalized and a second has passed the device will transition to a thinking state

while in the thinking state the it will send a request to a http endpoint with the audio and wait for a response
the server will respond with some audio file back. then the device will switch to the talking state.

in the talking state the device will play the audio file that it received from the server.

## technical details
the audio file recorded should be sent as a pcm16 file and encoded as a base64 string.
the received file will arive as a base64 encoded pcm16 file.

cli to convert file from pcm16 to wav: ffmpeg -f s16le -ar 24000 -ac 1 -i response.pcm16 response.wav

if there are any implementation details missing ask for clarification first.