import { useCallback } from "react";
import { Button } from "./components/ui/button";

function App() {
  const startProcessing = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    // const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const audioContext = new window.AudioContext();

    await audioContext.audioWorklet.addModule("audio-processor.js");

    const mediaStreamSource = audioContext.createMediaStreamSource(stream);
    const audioProcessor = new AudioWorkletNode(
      audioContext,
      "audio-processor"
    );

    // Listen to the messages from the AudioProcessor
    audioProcessor.port.onmessage = (event) => {
      const int16Data = event.data;

      console.log("RECEIVED MSG", int16Data);
      // TODO: send to backend
    };

    mediaStreamSource.connect(audioProcessor);
    audioProcessor.connect(audioContext.destination);
  }, []);

  return (
    <div className="vertical center pt-8 space-y-4">
      <h1 className="text-3xl font-bold">Speech To Text</h1>
      <Button onClick={startProcessing}>Click me</Button>
    </div>
  );
}

export default App;
