class AudioProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.buffer = [];
    this.bufferSize = 4096;
  }

  process(inputs, outputs, parameters) {
    const input = inputs[0];

    if (input.length > 0) {
      const channelData = input[0]; // Get data for the first channel

      // Convert Float32Array to Int16Array (LINEAR16)
      const int16Data = this.convertFloat32ToInt16(channelData);

      for (let i = 0; i < int16Data.length; i++) {
        this.buffer.push(int16Data[i]);
      }

      // If the buffer has reached the specified size, send it to the main thread
      if (this.buffer.length >= this.bufferSize) {
        this.port.postMessage(this.buffer);
        this.buffer = [];
      }
    }

    return true;
  }

  convertFloat32ToInt16(buffer) {
    let l = buffer.length;
    let buf = new Int16Array(l);
    while (l--) {
      buf[l] = Math.min(1, buffer[l]) * 0x7fff;
    }
    return buf;
  }
}

registerProcessor("audio-processor", AudioProcessor);
