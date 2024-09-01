import { useCallback, useState } from "react";
import { Mic, MicOff } from "lucide-react";
import { Button } from "./ui/button";
import { cn } from "../lib/utils";
import { useWs } from "../lib/atoms";

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

export const MicComponent: React.FC = () => {
  const [micOn, setMicOn] = useState(false);
  const [processorState, setProcessorState] = useState<null | {
    stream: MediaStream;
    mediaStreamSource: MediaStreamAudioSourceNode;
    audioProcessor: AudioWorkletNode;
  }>(null);

  const ws = useWs();

  const stopProcesing = useCallback(async () => {
    if (micOn) {
      setMicOn(false);

      processorState?.audioProcessor.disconnect();
      processorState?.mediaStreamSource.disconnect();
      processorState?.stream.getTracks().forEach((track) => track.stop());

      setProcessorState(null);

      ws?.send(JSON.stringify({ action: "mic-off" }));

      return;
    }
  }, [micOn, processorState]);

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

    setProcessorState({
      audioProcessor,
      mediaStreamSource,
      stream,
    });

    setMicOn(true);
  }, [ws]);

  return (
    <div className="p-10">
      <Button
        onClick={!micOn ? startProcessing : stopProcesing}
        size="icon"
        className={cn(
          "h-16 w-16 rounded-full transition-transform relative flex",
          micOn ? "scale-110 hover:bg-secondary" : "hover:bg-muted/80"
        )}
        variant="secondary"
      >
        {micOn && (
          <span className="animate-ping-slow absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
        )}

        {micOn ? <Mic className="h-8 w-8" /> : <MicOff className="h-8 w-8" />}
      </Button>
    </div>
  );
};
