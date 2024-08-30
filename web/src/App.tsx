import { useCallback, useState } from "react";
import { Button } from "./components/ui/button";

function encodeToLinear16(floatArray: Float32Array) {
  const int16Array = new Int16Array(floatArray.length);
  for (let i = 0; i < floatArray.length; i++) {
    int16Array[i] = Math.max(
      -32768,
      Math.min(32767, Math.floor(floatArray[i] * 32768))
    );
  }
  return int16Array.buffer;
}

function App() {
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket("ws://localhost:3500");
    setWs(ws);
  }, []);

  const startProcessing = useCallback(async () => {
    if (!ws?.OPEN) {
      alert("Connect to server first");
      return;
    }

    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioContext = new window.AudioContext();

    console.log(audioContext.sampleRate);

    await audioContext.audioWorklet.addModule("audio-processor.js");

    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    const audioProcessor = new AudioWorkletNode(
      audioContext,
      "audio-processor"
    );

    // Listen to the messages from the AudioProcessor
    audioProcessor.port.onmessage = (event) => {
      const linear16Buffer = encodeToLinear16(event.data);

      ws.send(linear16Buffer);
    };

    mediaStreamSource.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);
  }, [ws]);

  return (
    <div className="vertical center pt-8 space-y-4">
      <h1 className="text-3xl font-bold">Speech To Text</h1>
      {ws ? (
        <Button onClick={startProcessing}>Start</Button>
      ) : (
        <Button onClick={connect}>Connect</Button>
      )}
    </div>
  );
}

export default App;
