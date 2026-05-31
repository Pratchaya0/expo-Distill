import React, { useState } from 'react';
import { View, Modal, TouchableOpacity, Text, StyleSheet, SafeAreaView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RecordingsList } from '@/components/recordings/RecordingsList';
import { RecorderPanel } from '@/components/recorder/RecorderPanel';
import { colors } from '@/lib/theme';

export default function RecordingsTab() {
  const [recorderVisible, setRecorderVisible] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <RecordingsList />

      <TouchableOpacity style={styles.fab} onPress={() => setRecorderVisible(true)} activeOpacity={0.85}>
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <Modal
        visible={recorderVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setRecorderVisible(false)}
      >
        <SafeAreaView style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>New Recording</Text>
            <TouchableOpacity onPress={() => setRecorderVisible(false)}>
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>
          <RecorderPanel onClose={() => setRecorderVisible(false)} />
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  fab: {
    position: 'absolute', right: 20, bottom: 20,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25, shadowRadius: 4, elevation: 6,
  },
  sheet: { flex: 1, backgroundColor: colors.card },
  sheetHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  sheetTitle: { fontSize: 17, fontWeight: '600', color: colors.text },
});
