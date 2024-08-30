import { useCallback, useState } from "react";
import { Button } from "./components/ui/button";

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

    // let count = 0;
    // Listen to the messages from the AudioProcessor
    audioProcessor.port.onmessage = (event) => {
      const int16Data = event.data as Int16Array;

      // console.log("RECEIVED MSG", int16Data);

      // if (count === 0) {
      ws.send(JSON.stringify(Array.from(int16Data)));
      // }

      // count++;
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
