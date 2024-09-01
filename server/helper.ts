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

      // const sentence: string[] = [];

      // for (const r of data.results) {
      //   if (r.isFinal) {
      //     console.log("Final: ", r.alternatives[0].transcript);
      //     return;
      //   }

      //   for (const a of r.alternatives) {
      //     sentence.push(a.transcript);
      //   }
      // }

      // console.log(sentence);
      // const result = data.results[0];

      // console.log("gg: ", result.alternatives[0].transcript);

      // if (result.isFinal) {
      //   console.log(`Transcription: ${result.alternatives[0].transcript}`);
      //   // ws.send(JSON.stringify({ transcription: result.alternatives[0].transcript }));
      // }

      // console.dir({ data }, { depth: null });
      // console.log(
      //   `Transcription: ${
      //     data.results[0] && data.results[0].alternatives[0].transcript
      //   }`
      // );

      // const result = data.results[0];
      // if (result.isFinal) {
      //   console.log(`Transcription: ${result.alternatives[0].transcript}`);
      //   ws.send(
      //     JSON.stringify({ transcription: result.alternatives[0].transcript })
      //   );
      // }
    })
    .on("end", () => {
      console.log("Transcription ended.");
      users.set(ws.data.socketId, { stream: null });
    });

  return stream;
};
