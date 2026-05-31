import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { deleteRecording, updateRecording } from '@/lib/storage/db';
import { formatDuration, formatRelativeDate } from '@/lib/utils';
import { colors } from '@/lib/theme';
import type { Recording } from '@/types';

interface Props {
  recording: Recording & { id: number };
  onRefresh: () => void;
}

export function RecordingCard({ recording, onRefresh }: Props) {
  const router = useRouter();

  const toggleFavorite = async () => {
    await updateRecording(recording.id, { isFavorite: !recording.isFavorite });
    onRefresh();
  };

  const confirmDelete = () => {
    Alert.alert('Delete recording?', recording.title, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => { await deleteRecording(recording.id); onRefresh(); },
      },
    ]);
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/recording/${recording.id}`)}
      activeOpacity={0.7}
    >
      {/* Status strip */}
      <View style={[styles.strip, { backgroundColor: recording.transcript ? colors.success : colors.border }]} />

      {/* Icon */}
      <View style={styles.icon}>
        <Ionicons name="mic" size={18} color={colors.primary} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{recording.title}</Text>
        <View style={styles.meta}>
          <Ionicons name="time-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatDuration(recording.duration)}</Text>
          <Ionicons name="calendar-outline" size={12} color={colors.textMuted} />
          <Text style={styles.metaText}>{formatRelativeDate(recording.createdAt)}</Text>
        </View>
        {recording.summary ? (
          <Text style={styles.summary} numberOfLines={2}>{recording.summary}</Text>
        ) : null}
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity onPress={toggleFavorite} style={styles.actionBtn}>
          <Ionicons
            name={recording.isFavorite ? 'star' : 'star-outline'}
            size={18}
            color={recording.isFavorite ? colors.amber : colors.textMuted}
          />
        </TouchableOpacity>
        <TouchableOpacity onPress={confirmDelete} style={styles.actionBtn}>
          <Ionicons name="trash-outline" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 4, paddingVertical: 12, paddingRight: 12, marginBottom: 8,
    overflow: 'hidden',
  },
  strip: { width: 4, alignSelf: 'stretch', borderRadius: 2, marginLeft: 0 },
  icon: {
    width: 36, height: 36, borderRadius: 4,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, gap: 2 },
  title: { fontSize: 14, fontWeight: '600', color: colors.text },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontSize: 11, color: colors.textMuted, marginRight: 6 },
  summary: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 4 },
});
