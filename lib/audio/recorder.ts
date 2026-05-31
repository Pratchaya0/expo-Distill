import { useAudioRecorder, AudioModule, RecordingPresets } from 'expo-audio';
import * as FileSystem from 'expo-file-system/legacy';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';

export async function requestMicPermission(): Promise<boolean> {
  const { granted } = await AudioModule.requestRecordingPermissionsAsync();
  return granted;
}

/** Normalise dBFS metering value (-160..0) to 0..1 amplitude. */
export function meterToAmplitude(dBFS: number): number {
  // dBFS of -160 = silence, 0 = full scale
  return Math.max(0, Math.min(1, (dBFS + 60) / 60));
}

export async function saveAudioFile(tempUri: string): Promise<string> {
  const dir = FileSystem.documentDirectory + 'recordings/';
  const dest = dir + `rec_${Date.now()}.m4a`;
  await FileSystem.moveAsync({ from: tempUri, to: dest });
  return dest;
}

export { useAudioRecorder, RecordingPresets, activateKeepAwakeAsync, deactivateKeepAwake };
