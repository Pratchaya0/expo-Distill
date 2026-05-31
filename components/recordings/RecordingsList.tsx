import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingCard } from './RecordingCard';
import { listRecordings } from '@/lib/storage/db';
import { colors } from '@/lib/theme';
import type { Recording } from '@/types';

interface Props {
  favoritesOnly?: boolean;
  emptyMessage?: string;
}

export function RecordingsList({
  favoritesOnly = false,
  emptyMessage = 'No recordings yet. Tap + to start recording.',
}: Props) {
  const [recordings, setRecordings] = useState<(Recording & { id: number })[] | null>(null);

  const load = useCallback(async () => {
    setRecordings(await listRecordings(favoritesOnly));
  }, [favoritesOnly]);

  useEffect(() => { load(); }, [load]);

  if (!recordings) {
    return (
      <View style={styles.center}>
        {[0, 1, 2].map((i) => <View key={i} style={styles.skeleton} />)}
      </View>
    );
  }

  if (recordings.length === 0) {
    return (
      <View style={styles.empty}>
        <View style={styles.emptyIcon}>
          <Ionicons name="mic-outline" size={28} color={colors.textMuted} />
        </View>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
        <Text style={styles.emptyHint}>Recordings are stored locally on your device.</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={recordings}
      keyExtractor={(r) => String(r.id)}
      renderItem={({ item }) => <RecordingCard recording={item} onRefresh={load} />}
      contentContainerStyle={styles.list}
      showsVerticalScrollIndicator={false}
    />
  );
}

const styles = StyleSheet.create({
  center: { gap: 10, padding: 16 },
  skeleton: { height: 72, backgroundColor: colors.border, borderRadius: 4 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 80, gap: 12 },
  emptyIcon: {
    width: 60, height: 60, borderRadius: 12,
    backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center',
  },
  emptyText: { fontSize: 14, fontWeight: '600', color: colors.text, textAlign: 'center' },
  emptyHint: { fontSize: 12, color: colors.textMuted, textAlign: 'center' },
  list: { padding: 16 },
});
