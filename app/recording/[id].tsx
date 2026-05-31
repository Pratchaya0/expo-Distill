import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput,
  StyleSheet, SafeAreaView, Alert, ActivityIndicator, Image, FlatList,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useAudioPlayer } from 'expo-audio';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { getRecording, updateRecording, getNotes, saveNote, updateNote, deleteNote } from '@/lib/storage/db';
import { getApiKey } from '@/lib/storage/keys';
import { groqTranscribe, groqProcess } from '@/lib/ai/groqClient';
import { MindMapView } from '@/components/ai/MindMapView';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { colors } from '@/lib/theme';
import type { Recording, Note, ActionItem, Language } from '@/types';

type Tab = 'summary' | 'actions' | 'mindmap' | 'notes';
const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: 'summary', label: 'Summary', icon: 'sparkles' },
  { key: 'actions', label: 'Actions', icon: 'checkbox' },
  { key: 'mindmap', label: 'Mind Map', icon: 'git-network' },
  { key: 'notes', label: 'Notes', icon: 'create' },
];

export default function RecordingDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const navigation = useNavigation();
  const [recording, setRecording] = useState<(Recording & { id: number }) | null>(null);
  const [notes, setNotes] = useState<(Note & { id: number })[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('summary');
  const [transcribing, setTranscribing] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [playerTime, setPlayerTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const playerRef = useRef<ReturnType<typeof useAudioPlayer> | null>(null);

  const player = useAudioPlayer(recording ? { uri: recording.audioPath } : null);

  const load = useCallback(async () => {
    if (!id) return;
    const rec = await getRecording(Number(id));
    setRecording(rec);
    if (rec) {
      navigation.setOptions({ title: rec.title });
      const n = await getNotes(Number(id));
      setNotes(n);
    }
  }, [id, navigation]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!player || !recording) return;
    const interval = setInterval(() => {
      setPlayerTime(player.currentTime ?? 0);
      setDuration(player.duration ?? 0);
    }, 250);
    return () => clearInterval(interval);
  }, [player, recording]);

  const getKey = async () => {
    return (await getApiKey('groq_api_key')) ?? (await getApiKey('openai_api_key')) ?? null;
  };

  const handleTranscribe = async () => {
    if (!recording) return;
    const apiKey = await getKey();
    if (!apiKey) { Alert.alert('No API key', 'Add a Groq API key in Settings first.'); return; }
    setTranscribing(true);
    try {
      const segments = await groqTranscribe(recording.audioPath, apiKey, recording.language);
      await updateRecording(recording.id, { transcript: segments });
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Transcription failed.');
    } finally { setTranscribing(false); }
  };

  const handleGenerate = async () => {
    if (!recording?.transcript?.length) { Alert.alert('Transcribe first', 'Please transcribe the recording first.'); return; }
    const apiKey = await getKey();
    if (!apiKey) { Alert.alert('No API key', 'Add a Groq API key in Settings first.'); return; }
    setProcessing(true);
    try {
      const result = await groqProcess(recording.transcript, apiKey, recording.templateId, recording.language);
      await updateRecording(recording.id, result);
      await load();
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'AI processing failed.');
    } finally { setProcessing(false); }
  };

  const toggleLanguage = async () => {
    if (!recording) return;
    const lang: Language = recording.language === 'th' ? 'en' : 'th';
    await updateRecording(recording.id, { language: lang });
    await load();
  };

  const toggleFavorite = async () => {
    if (!recording) return;
    await updateRecording(recording.id, { isFavorite: !recording.isFavorite });
    await load();
  };

  const addNote = async () => {
    if (!recording) return;
    const id = await saveNote({ recordingId: recording.id, timestamp: playerTime, content: '', imagePaths: [] });
    await load();
  };

  if (!recording) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>;
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.langBtn} onPress={toggleLanguage}>
          <Text style={styles.langText}>{recording.language === 'th' ? '🇹🇭 ไทย' : '🇬🇧 English'}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toolBtn, transcribing && styles.toolBtnDisabled]}
          onPress={handleTranscribe}
          disabled={transcribing || processing}
        >
          {transcribing
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <Ionicons name="document-text-outline" size={14} color={colors.primary} />
          }
          <Text style={styles.toolBtnText}>{transcribing ? 'Transcribing…' : recording.transcript?.length ? 'Re-transcribe' : 'Transcribe'}</Text>
        </TouchableOpacity>
        {recording.transcript?.length ? (
          <TouchableOpacity
            style={[styles.toolBtnPrimary, processing && styles.toolBtnDisabled]}
            onPress={handleGenerate}
            disabled={processing || transcribing}
          >
            {processing
              ? <ActivityIndicator size="small" color="#FFF" />
              : <Ionicons name="sparkles" size={14} color="#FFF" />
            }
            <Text style={styles.toolBtnPrimaryText}>{processing ? 'Generating…' : 'Generate AI'}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity onPress={toggleFavorite}>
          <Ionicons
            name={recording.isFavorite ? 'star' : 'star-outline'}
            size={22}
            color={recording.isFavorite ? colors.amber : colors.textMuted}
          />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll}>
        {/* Audio player */}
        <View style={styles.player}>
          <Slider
            style={styles.slider}
            value={playerTime}
            minimumValue={0}
            maximumValue={duration || 1}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.primary}
            onSlidingComplete={(v) => player.seekTo(v)}
          />
          <View style={styles.playerTime}>
            <Text style={styles.timeText}>{formatDuration(playerTime)}</Text>
            <Text style={styles.timeText}>{formatDuration(duration)}</Text>
          </View>
          <View style={styles.playerControls}>
            <TouchableOpacity onPress={() => player.seekTo(0)}>
              <Ionicons name="play-skip-back" size={24} color={colors.text} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.playBtn} onPress={() => player.playing ? player.pause() : player.play()}>
              <Ionicons name={player.playing ? 'pause' : 'play'} size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Transcript */}
        {recording.transcript?.length ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRANSCRIPT — {recording.transcript.length} segments</Text>
            {recording.transcript.map((seg, i) => {
              const active = playerTime >= seg.start && playerTime < (seg.end || Infinity);
              return (
                <TouchableOpacity
                  key={i}
                  style={[styles.segment, active && styles.segmentActive]}
                  onPress={() => player.seekTo(seg.start)}
                >
                  <Text style={styles.segTime}>{formatDuration(seg.start)}</Text>
                  <Text style={[styles.segText, active && styles.segTextActive]}>{seg.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>TRANSCRIPT</Text>
            <Text style={styles.emptyHint}>No transcript yet — tap Transcribe above.</Text>
          </View>
        )}

        {/* AI Tabs */}
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, activeTab === t.key && styles.tabBtnActive]}
              onPress={() => setActiveTab(t.key)}
            >
              <Ionicons name={t.icon as never} size={14} color={activeTab === t.key ? colors.primary : colors.textMuted} />
              <Text style={[styles.tabLabel, activeTab === t.key && styles.tabLabelActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab content */}
        <View style={styles.section}>
          {activeTab === 'summary' && (
            recording.summary
              ? <Text style={styles.bodyText}>{recording.summary}</Text>
              : <Text style={styles.emptyHint}>Generate AI to see the summary.</Text>
          )}

          {activeTab === 'actions' && (
            recording.actionItems?.length
              ? recording.actionItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.actionRow}
                    onPress={async () => {
                      const updated = recording.actionItems!.map((a) =>
                        a.id === item.id ? { ...a, done: !a.done } : a,
                      );
                      await updateRecording(recording.id, { actionItems: updated });
                      await load();
                    }}
                  >
                    <Ionicons
                      name={item.done ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={item.done ? colors.primary : colors.textMuted}
                    />
                    <Text style={[styles.actionText, item.done && styles.actionTextDone]}>{item.text}</Text>
                  </TouchableOpacity>
                ))
              : <Text style={styles.emptyHint}>Generate AI to see action items.</Text>
          )}

          {activeTab === 'mindmap' && (
            recording.mindMap
              ? <MindMapView markdown={recording.mindMap} />
              : <Text style={styles.emptyHint}>Generate AI to see the mind map.</Text>
          )}

          {activeTab === 'notes' && (
            <View style={{ gap: 12 }}>
              <TouchableOpacity style={styles.addNoteBtn} onPress={addNote}>
                <Ionicons name="add" size={16} color={colors.primary} />
                <Text style={styles.addNoteText}>Add note at {formatDuration(playerTime)}</Text>
              </TouchableOpacity>
              {notes.map((note) => (
                <NoteCard key={note.id} note={note} onUpdate={load} onSeek={(t) => player.seekTo(t)} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function NoteCard({ note, onUpdate, onSeek }: {
  note: Note & { id: number };
  onUpdate: () => void;
  onSeek: (t: number) => void;
}) {
  const [content, setContent] = useState(note.content);

  const handleBlur = async () => {
    if (content !== note.content) {
      await updateNote(note.id, { content });
    }
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const dest = FileSystem.documentDirectory + 'images/' + Date.now() + '.jpg';
      await FileSystem.copyAsync({ from: uri, to: dest });
      await updateNote(note.id, { imagePaths: [...note.imagePaths, dest] });
      onUpdate();
    }
  };

  const removeImage = async (path: string) => {
    await FileSystem.deleteAsync(path, { idempotent: true });
    await updateNote(note.id, { imagePaths: note.imagePaths.filter((p) => p !== path) });
    onUpdate();
  };

  return (
    <View style={noteStyles.card}>
      <View style={noteStyles.header}>
        <TouchableOpacity onPress={() => onSeek(note.timestamp)} style={noteStyles.time}>
          <Ionicons name="time-outline" size={12} color={colors.primary} />
          <Text style={noteStyles.timeText}>{formatDuration(note.timestamp)}</Text>
        </TouchableOpacity>
        <View style={noteStyles.actions}>
          <TouchableOpacity onPress={pickImage}>
            <Ionicons name="image-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity onPress={async () => { await deleteNote(note.id); onUpdate(); }}>
            <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>
      <TextInput
        style={noteStyles.input}
        value={content}
        onChangeText={setContent}
        onBlur={handleBlur}
        placeholder="Type your note…"
        placeholderTextColor={colors.textMuted}
        multiline
      />
      {note.imagePaths.length > 0 && (
        <View style={noteStyles.images}>
          {note.imagePaths.map((p) => (
            <TouchableOpacity key={p} onLongPress={() => removeImage(p)}>
              <Image source={{ uri: p }} style={noteStyles.img} />
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  toolbar: {
    flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 12, paddingVertical: 8,
    backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  langBtn: {
    paddingHorizontal: 8, paddingVertical: 5, borderRadius: 4,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  langText: { fontSize: 12, fontWeight: '500', color: colors.text },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4,
    borderWidth: 1, borderColor: colors.border,
  },
  toolBtnText: { fontSize: 12, color: colors.primary, fontWeight: '500' },
  toolBtnPrimary: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 4,
    backgroundColor: colors.primary,
  },
  toolBtnPrimaryText: { fontSize: 12, color: '#FFF', fontWeight: '600' },
  toolBtnDisabled: { opacity: 0.5 },
  scroll: { flex: 1 },
  player: { backgroundColor: colors.card, padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  slider: { width: '100%', height: 20 },
  playerTime: { flexDirection: 'row', justifyContent: 'space-between' },
  timeText: { fontSize: 11, color: colors.textMuted },
  playerControls: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 16, marginTop: 8 },
  playBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
  },
  section: { margin: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 12, gap: 6 },
  sectionLabel: { fontSize: 10, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  segment: { flexDirection: 'row', gap: 8, paddingVertical: 4, borderRadius: 4, paddingHorizontal: 4 },
  segmentActive: { backgroundColor: colors.primaryLight },
  segTime: { fontSize: 11, fontFamily: 'monospace', color: colors.textMuted, width: 36 },
  segText: { flex: 1, fontSize: 13, color: colors.text, lineHeight: 18 },
  segTextActive: { color: colors.primary },
  emptyHint: { fontSize: 13, color: colors.textMuted, textAlign: 'center', paddingVertical: 16 },
  tabBar: { flexDirection: 'row', marginHorizontal: 12, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 4, overflow: 'hidden' },
  tabBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, paddingVertical: 8 },
  tabBtnActive: { backgroundColor: colors.primaryLight },
  tabLabel: { fontSize: 11, color: colors.textMuted, fontWeight: '500' },
  tabLabelActive: { color: colors.primary },
  bodyText: { fontSize: 14, color: colors.text, lineHeight: 22 },
  actionRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 4 },
  actionText: { flex: 1, fontSize: 14, color: colors.text, lineHeight: 20 },
  actionTextDone: { textDecorationLine: 'line-through', color: colors.textMuted },
  addNoteBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1, borderColor: colors.primary, borderRadius: 6, borderStyle: 'dashed',
    padding: 10, justifyContent: 'center',
  },
  addNoteText: { fontSize: 13, color: colors.primary },
});

const noteStyles = StyleSheet.create({
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border,
    backgroundColor: colors.background,
  },
  time: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeText: { fontSize: 11, fontFamily: 'monospace', color: colors.primary },
  actions: { flexDirection: 'row', gap: 12 },
  input: { padding: 10, fontSize: 14, color: colors.text, minHeight: 60, backgroundColor: colors.card },
  images: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, padding: 8, borderTopWidth: 1, borderTopColor: colors.border },
  img: { width: 80, height: 80, borderRadius: 6 },
});
