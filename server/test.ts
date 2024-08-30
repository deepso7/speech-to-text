import { SpeechClient } from "@google-cloud/speech";

const keyFile = JSON.parse(process.env.GCP_CREDENTIALS!);
keyFile.private_key = keyFile.private_key.replace(/\\n/g, "\n");

const client = new SpeechClient({
  credentials: keyFile,
});

function generateSineWave(
  frequency: number,
  duration: number,
  sampleRate: number
) {
  const length = sampleRate * duration;
  const sineWave = new Int16Array(length);
  const amplitude = 0x7fff; // Max amplitude for Int16Array

  for (let i = 0; i < length; i++) {
    sineWave[i] =
      amplitude * Math.sin((2 * Math.PI * frequency * i) / sampleRate);
  }

  return sineWave;
}

// Generate a 1-second sine wave at 440 Hz (A4 note)
const sampleRate = 44100;
const frequency = 440;
const duration = 1; // 1 second
const sineWaveArray = generateSineWave(frequency, duration, sampleRate);

const recognizeStream = client
  .streamingRecognize({
    config: {
      encoding: "LINEAR16",
      sampleRateHertz: 44100,
      languageCode: "en-US",
    },
    interimResults: true,
  })
  .on("data", (data) =>
    console.log(
      `Transcription: ${
        data.results[0] && data.results[0].alternatives[0].transcript
      }`
    )
  )
  .on("error", (error) => {
    console.error("Error in Speech-to-Text:", error);
  })
  .on("end", () => {
    console.log("Transcription ended.");
  });

// Sending the sine wave array to Google Cloud Speech
recognizeStream.write(Buffer.from(sineWaveArray.buffer));
recognizeStream.end();
