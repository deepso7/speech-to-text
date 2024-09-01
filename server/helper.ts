import { SpeechClient } from "@google-cloud/speech";
import type { ServerWebSocket } from "bun";
import { users } from ".";

const keyFile = JSON.parse(process.env.GCP_CREDENTIALS!);
keyFile.private_key = keyFile.private_key.replace(/\\n/g, "\n");

const client = new SpeechClient({
  credentials: keyFile,
});

type GoogResp = {
  results: {
    alternatives: {
      transcript: string;
      confidence: number;
    }[];
    isFinal: boolean;
  }[];
};

export const createStream = (
  ws: ServerWebSocket<{
    socketId: string;
  }>
) => {
  const stream = client
    .streamingRecognize({
      config: {
        encoding: "LINEAR16",
        sampleRateHertz: 48000,
        languageCode: "en-US",
      },
      interimResults: true,
    })
    .on("error", console.error)
    .on("data", (data: GoogResp) => {
      // console.dir(data, { depth: null });
      ws.send(JSON.stringify(data));
    })
    .on("end", () => {
      console.log("Transcription ended.");
      if (users.has(ws.data.socketId))
        users.set(ws.data.socketId, { stream: null });
    });

  return stream;
};
