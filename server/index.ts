import { SpeechClient } from "@google-cloud/speech";
import { randomUUID } from "node:crypto";

const keyFile = JSON.parse(process.env.GCP_CREDENTIALS!);
keyFile.private_key = keyFile.private_key.replace(/\\n/g, "\n");

const client = new SpeechClient({
  credentials: keyFile,
});

const usersMap = new Map<string, { stream: WritableStream }>();

type GoogResp = {
  results: {
    alternatives: {
      transcript: string;
      confidence: number;
    }[];
    isFinal: boolean;
  }[];
};

const recognizeStream = client
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

    const sentence: string[] = [];

    for (const r of data.results) {
      if (r.isFinal) {
        console.log("Final: ", r.alternatives[0].transcript);
        return;
      }

      for (const a of r.alternatives) {
        sentence.push(a.transcript);
      }
    }

    console.log(sentence);
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
    process.exit(1);
  });

const server = Bun.serve<{ socketId: string }>({
  fetch(req, server) {
    const success = server.upgrade(req, {
      data: {
        socketId: randomUUID(),
      },
    });
    if (success) {
      // Bun automatically returns a 101 Switching Protocols
      // if the upgrade succeeds
      return undefined;
    }

    // handle HTTP request normally
    return new Response("Hi!");
  },
  websocket: {
    open(ws) {
      console.log("NEW CLIENT CONNECTED");
    },

    // this is called when a message is received
    async message(ws, message) {
      // console.log("typeof msg", typeof message);
      // console.log({ message });

      // if (typeof message === "string") {
      //   const array = JSON.parse(message);
      //   const int16Array = new Int16Array(array);

      //   // console.log(int16Array);
      //   recognizeStream.write(int16Array);
      // }

      recognizeStream.write(message);
    },

    close(ws) {
      console.log("CLIENT LEFT");
      recognizeStream.end();
    },
  },

  port: 3500,
});

console.log(`Listening on http://${server.hostname}:${server.port}`);
