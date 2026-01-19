// 音频处理工具

const SAMPLE_RATE = 24000;

export class AudioRecorder {
  private mediaStream: MediaStream | null = null;
  private audioContext: AudioContext | null = null;
  private processor: ScriptProcessorNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;
  private onDataCallback: ((data: Int16Array) => void) | null = null;

  async start(onData: (data: Int16Array) => void): Promise<void> {
    this.onDataCallback = onData;

    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: SAMPLE_RATE,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });
      this.source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // 使用 ScriptProcessor 来获取原始音频数据
      this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

      this.processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        // 转换为 Int16
        const int16Data = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          const s = Math.max(-1, Math.min(1, inputData[i]));
          int16Data[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
        }
        this.onDataCallback?.(int16Data);
      };

      this.source.connect(this.processor);
      this.processor.connect(this.audioContext.destination);
    } catch (error) {
      console.error("Failed to start audio recording:", error);
      throw error;
    }
  }

  stop(): void {
    if (this.processor) {
      this.processor.disconnect();
      this.processor = null;
    }
    if (this.source) {
      this.source.disconnect();
      this.source = null;
    }
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }
    this.onDataCallback = null;
  }
}

export class AudioPlayer {
  private audioContext: AudioContext | null = null;
  private gainNode: GainNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying = false;
  private nextStartTime = 0;

  constructor() {
    this.init();
  }

  private init(): void {
    this.audioContext = new AudioContext({ sampleRate: SAMPLE_RATE });

    // 创建增益节点（音量控制）
    this.gainNode = this.audioContext.createGain();
    this.gainNode.gain.value = 0.85;

    // 创建低通滤波器（减少电流声）
    this.filterNode = this.audioContext.createBiquadFilter();
    this.filterNode.type = "lowpass";
    this.filterNode.frequency.value = 8000;

    this.filterNode.connect(this.gainNode);
    this.gainNode.connect(this.audioContext.destination);
  }

  play(base64Audio: string): void {
    if (!this.audioContext || !this.filterNode) return;

    // Base64 解码
    const binaryString = atob(base64Audio);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 转换为 Int16
    const int16Data = new Int16Array(bytes.buffer);

    // 转换为 Float32
    const float32Data = new Float32Array(int16Data.length);
    for (let i = 0; i < int16Data.length; i++) {
      float32Data[i] = int16Data[i] / 0x8000;
    }

    this.audioQueue.push(float32Data);
    this.processQueue();
  }

  private processQueue(): void {
    if (this.isPlaying || this.audioQueue.length === 0) return;
    if (!this.audioContext || !this.filterNode) return;

    this.isPlaying = true;

    // 合并所有队列中的音频
    const totalLength = this.audioQueue.reduce((acc, arr) => acc + arr.length, 0);
    const mergedAudio = new Float32Array(totalLength);
    let offset = 0;
    while (this.audioQueue.length > 0) {
      const chunk = this.audioQueue.shift()!;
      mergedAudio.set(chunk, offset);
      offset += chunk.length;
    }

    // 创建音频缓冲区
    const buffer = this.audioContext.createBuffer(1, mergedAudio.length, SAMPLE_RATE);
    buffer.getChannelData(0).set(mergedAudio);

    // 创建音频源
    const source = this.audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.filterNode);

    // 计算开始时间
    const currentTime = this.audioContext.currentTime;
    const startTime = Math.max(currentTime, this.nextStartTime);

    source.start(startTime);
    this.nextStartTime = startTime + buffer.duration;

    source.onended = () => {
      this.isPlaying = false;
      if (this.audioQueue.length > 0) {
        this.processQueue();
      }
    };
  }

  stop(): void {
    this.audioQueue = [];
    this.isPlaying = false;
    this.nextStartTime = 0;
  }

  close(): void {
    this.stop();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

// Base64 编码 Int16Array
export function encodeAudioToBase64(int16Data: Int16Array): string {
  const uint8Data = new Uint8Array(int16Data.buffer);
  let binary = "";
  for (let i = 0; i < uint8Data.length; i++) {
    binary += String.fromCharCode(uint8Data[i]);
  }
  return btoa(binary);
}
