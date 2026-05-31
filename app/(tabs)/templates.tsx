import React from 'react';
import { View, Text, ScrollView, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/lib/theme';

const BUILT_IN = [
  { id: 'weekly-sync', name: 'Weekly Sync', tags: ['Team', 'Meeting'], description: 'Key updates, blockers, and action items from a weekly standup.' },
  { id: 'brainstorm', name: 'Brainstorming', tags: ['Creative'], description: 'Ideas proposed, themes, and most promising concepts.' },
  { id: 'interview', name: 'Interview', tags: ['HR'], description: 'Candidate responses, strengths, concerns, and next steps.' },
  { id: 'lecture', name: 'Lecture / Lesson', tags: ['Education'], description: 'Key concepts, definitions, and study questions.' },
  { id: '1on1', name: '1-on-1', tags: ['Management'], description: 'Development points, feedback, and follow-up items.' },
];

export default function TemplatesTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.sectionLabel}>BUILT-IN</Text>
        {BUILT_IN.map((t) => (
          <View key={t.id} style={styles.card}>
            <View style={styles.iconBox}>
              <Ionicons name="document-text" size={18} color={colors.primary} />
            </View>
            <View style={styles.content}>
              <View style={styles.row}>
                <Text style={styles.name}>{t.name}</Text>
                {t.tags.map((tag) => (
                  <View key={tag} style={styles.tag}>
                    <Text style={styles.tagText}>{tag}</Text>
                  </View>
                ))}
              </View>
              <Text style={styles.desc}>{t.description}</Text>
            </View>
          </View>
        ))}
        <Text style={styles.hint}>Custom template editor coming soon.</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 8 },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8, marginBottom: 4 },
  card: {
    flexDirection: 'row', gap: 10, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 12,
  },
  iconBox: {
    width: 36, height: 36, borderRadius: 4,
    backgroundColor: colors.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  content: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 4 },
  name: { fontSize: 13, fontWeight: '600', color: colors.text, marginRight: 4 },
  tag: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: 3, paddingHorizontal: 5, paddingVertical: 1 },
  tagText: { fontSize: 10, color: colors.textMuted },
  desc: { fontSize: 12, color: colors.textMuted },
  hint: { textAlign: 'center', fontSize: 12, color: colors.textMuted, marginTop: 8 },
});
