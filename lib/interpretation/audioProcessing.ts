import { PCM_SAMPLE_RATE } from "./constants";

export function floatTo16BitPCM(input: Float32Array): ArrayBuffer {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const s = Math.max(-1, Math.min(1, input[i]));
    output[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return output.buffer;
}

/**
 * 어느 채널을 전사에 쓸지.
 *
 * 콘솔에서 L=원어, R=통역 리턴처럼 갈라 보내는 경우, 평균을 내면 통역 음성이
 * 그대로 전사에 섞여 들어간다 — 소프트웨어가 스스로 피드백 루프를 만드는 셈이다.
 * 기본값을 단일 채널로 두는 이유가 이것이다.
 */
export type InputChannel = "left" | "right" | "mix";

export function selectChannel(
  inputBuffer: AudioBuffer,
  channel: InputChannel,
): Float32Array {
  if (inputBuffer.numberOfChannels <= 1) return inputBuffer.getChannelData(0);
  if (channel === "left") return inputBuffer.getChannelData(0);
  if (channel === "right") return inputBuffer.getChannelData(1);
  return mixToMono(inputBuffer);
}

/** 스테레오(또는 다채널) 입력을 서버 전송용 모노로 평균 믹스한다. */
export function mixToMono(inputBuffer: AudioBuffer): Float32Array {
  const { numberOfChannels, length } = inputBuffer;

  if (numberOfChannels <= 1) {
    return inputBuffer.getChannelData(0);
  }

  const mono = new Float32Array(length);
  for (let channel = 0; channel < numberOfChannels; channel++) {
    const data = inputBuffer.getChannelData(channel);
    for (let i = 0; i < length; i++) {
      mono[i] += data[i];
    }
  }

  const scale = 1 / numberOfChannels;
  for (let i = 0; i < length; i++) {
    mono[i] *= scale;
  }

  return mono;
}

export function downsampleBuffer(
  buffer: Float32Array,
  inputRate: number,
  outputRate: number,
): Float32Array {
  if (outputRate === inputRate) return buffer;
  const ratio = inputRate / outputRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  for (let i = 0; i < newLength; i++) {
    result[i] = buffer[Math.floor(i * ratio)] ?? 0;
  }
  return result;
}

export function computeAudioLevel(analyser: AnalyserNode): number {
  const data = new Uint8Array(analyser.fftSize);
  analyser.getByteTimeDomainData(data);

  let sum = 0;
  for (let i = 0; i < data.length; i++) {
    const sample = (data[i] - 128) / 128;
    sum += sample * sample;
  }

  const rms = Math.sqrt(sum / data.length);
  return Math.min(1, rms * 3.5);
}

export { PCM_SAMPLE_RATE };
