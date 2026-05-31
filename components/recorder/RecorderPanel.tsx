import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useAudioRecorder, RecordingPresets, AudioModule } from 'expo-audio';
import { activateKeepAwakeAsync, deactivateKeepAwake } from 'expo-keep-awake';
import { useRouter } from 'expo-router';
import { WaveformBars } from './WaveformBars';
import { saveAudioFile, meterToAmplitude } from '@/lib/audio/recorder';
import { saveRecording } from '@/lib/storage/db';
import { formatDuration, generateTitle } from '@/lib/utils';
import { colors } from '@/lib/theme';
import type { RecorderState } from '@/types';

export function RecorderPanel({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [state, setState] = useState<RecorderState>('idle');
  const [elapsed, setElapsed] = useState(0);
  const [title, setTitle] = useState('');
  const [amplitude, setAmplitude] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = () => {
    setElapsed(0);
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
  };
  const stopTimer = () => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  };

  const handleStart = useCallback(async () => {
    // ✅ This shows the NATIVE Android "Allow Distill to record audio" dialog
    const { granted } = await AudioModule.requestRecordingPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Please allow microphone access in Settings to record.');
      return;
    }
    await activateKeepAwakeAsync();
    await audioRecorder.prepareToRecordAsync();
    audioRecorder.record();
    setState('recording');
    startTimer();

    // Poll metering for waveform
    const meter = setInterval(() => {
      const status = audioRecorder.currentTime; // proxy for activity
      // expo-audio v0.4+ provides getStatusAsync with metering
      setAmplitude(Math.random() * 0.6 + 0.1); // fallback animation until metering API stabilises
    }, 100);
    (audioRecorder as unknown as { _meterInterval?: ReturnType<typeof setInterval> })._meterInterval = meter;
  }, [audioRecorder]);

  const handleStop = useCallback(async () => {
    setState('processing');
    stopTimer();
    deactivateKeepAwake();
    const interval = (audioRecorder as unknown as { _meterInterval?: ReturnType<typeof setInterval> })._meterInterval;
    if (interval) clearInterval(interval);
    setAmplitude(0);

    try {
      await audioRecorder.stop();
      const tempUri = audioRecorder.uri;
      if (!tempUri) throw new Error('No audio file recorded.');

      const audioPath = await saveAudioFile(tempUri);
      const id = await saveRecording({
        title: title.trim() || generateTitle(),
        duration: elapsed,
        audioPath,
        tags: [],
        isFavorite: false,
        language: 'th',
        createdAt: new Date().toISOString(),
      });

      setState('saved');
      onClose();
      router.push(`/recording/${id}`);
    } catch (e) {
      Alert.alert('Error', 'Failed to save recording.');
      setState('idle');
    }
  }, [audioRecorder, elapsed, title, onClose, router]);

  const handleCancel = useCallback(async () => {
    stopTimer();
    deactivateKeepAwake();
    if (state === 'recording') await audioRecorder.stop();
    setAmplitude(0);
    setState('idle');
    setElapsed(0);
  }, [state, audioRecorder]);

  const isRecording = state === 'recording';
  const isProcessing = state === 'processing';

  return (
    <View style={styles.container}>
      <WaveformBars amplitude={amplitude} isRecording={isRecording} />

      <Text style={styles.timer}>{formatDuration(elapsed)}</Text>
      {isRecording && (
        <View style={styles.recIndicator}>
          <View style={styles.recDot} />
          <Text style={styles.recText}>Recording</Text>
        </View>
      )}

      {(isRecording || isProcessing) && (
        <TextInput
          style={styles.titleInput}
          placeholder="Recording title (optional)"
          value={title}
          onChangeText={setTitle}
          editable={!isProcessing}
          placeholderTextColor={colors.textMuted}
        />
      )}

      <View style={styles.controls}>
        {!isRecording && !isProcessing && (
          <TouchableOpacity style={styles.recordBtn} onPress={handleStart}>
            <Text style={styles.recordBtnText}>Start Recording</Text>
          </TouchableOpacity>
        )}
        {isRecording && (
          <>
            <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.stopBtn} onPress={handleStop}>
              <Text style={styles.stopBtnText}>Stop & Save</Text>
            </TouchableOpacity>
          </>
        )}
        {isProcessing && (
          <TouchableOpacity style={[styles.recordBtn, styles.disabledBtn]} disabled>
            <Text style={styles.recordBtnText}>Saving…</Text>
          </TouchableOpacity>
        )}
      </View>

      {!isRecording && !isProcessing && (
        <Text style={styles.hint}>
          Tap Start — Distill will ask for microphone permission.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 24, gap: 20 },
  timer: { fontSize: 48, fontVariant: ['tabular-nums'], fontWeight: '300', textAlign: 'center', color: colors.text },
  recIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
  recDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.destructive },
  recText: { fontSize: 13, color: colors.destructive },
  titleInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: colors.text,
    backgroundColor: colors.card,
  },
  controls: { flexDirection: 'row', justifyContent: 'center', gap: 12 },
  recordBtn: {
    backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 14,
    borderRadius: 100, flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  recordBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  stopBtn: {
    backgroundColor: colors.destructive, paddingHorizontal: 24, paddingVertical: 14,
    borderRadius: 100,
  },
  stopBtnText: { color: '#FFF', fontWeight: '600', fontSize: 15 },
  cancelBtn: {
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: 20,
    paddingVertical: 14, borderRadius: 100,
  },
  cancelBtnText: { color: colors.text, fontSize: 15 },
  disabledBtn: { opacity: 0.6 },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textMuted },
});
