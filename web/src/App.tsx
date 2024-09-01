import { useCallback, useState } from "react";
import { Terminal } from "lucide-react";

import { Button } from "./components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "./components/ui/alert";
import { MicComponent } from "./components/mic";
import { useAtom } from "jotai";
import { wsAtom } from "./lib/atoms";

type GoogResp = {
  results: {
    alternatives: {
      transcript: string;
      confidence: number;
    }[];
    isFinal: boolean;
  }[];
};

function App() {
  const [ws, setWs] = useAtom(wsAtom);
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
  }, [ws, setWs]);

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

      <MicComponent />

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
