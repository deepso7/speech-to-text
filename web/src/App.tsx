import { useCallback, useState } from "react";
import { Terminal } from "lucide-react";

import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";

type GoogResp = {
  results: {
    alternatives: {
      transcript: string;
      confidence: number;
    }[];
    isFinal: boolean;
  }[];
};

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
  const [connectionState, setConnectionState] = useState<
    "connect" | "connecting" | "connected"
  >("connect");
  const [sentences, setSentences] = useState<string[]>([]);

  const connect = useCallback(() => {
    setConnectionState("connecting");

    if (ws) {
      alert("Already Initialized, handle disconnection");
      return;
    }

    const newWs = new WebSocket("ws://localhost:3500");
    setWs(newWs);

    newWs.onmessage = (e) => {
      const data = JSON.parse(e.data) as GoogResp;

      const result = data.results[0];

      if (result?.isFinal) {
        setSentences((prev) => [...prev, result.alternatives[0]?.transcript]);
      }
    };

    newWs.onopen = () => {
      setConnectionState("connected");
    };
  }, [ws]);

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
      <Button
        onClick={connect}
        disabled={
          connectionState === "connected" || connectionState === "connecting"
        }
      >
        {connectionState}
      </Button>

      <Button
        onClick={startProcessing}
        disabled={connectionState !== "connected"}
      >
        {connectionState !== "connected"
          ? "Please connect first"
          : "click here then start speaking something"}
      </Button>

      <Sentences sentences={sentences} />
    </div>
  );
}

export default App;

const Sentences: React.FC<{ sentences: string[] }> = ({ sentences }) => {
  if (!sentences.length) return null;

  return (
    <Alert className="w-1/3">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Speech to text texts</AlertTitle>
      <AlertDescription>
        {sentences.map((s, i) => (
          <p key={i}>{s}</p>
        ))}
      </AlertDescription>
    </Alert>
  );
};
