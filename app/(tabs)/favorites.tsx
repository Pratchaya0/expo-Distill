import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { RecordingsList } from '@/components/recordings/RecordingsList';
import { colors } from '@/lib/theme';

export default function FavoritesTab() {
  return (
    <SafeAreaView style={styles.container}>
      <RecordingsList
        favoritesOnly
        emptyMessage="No favorites yet. Star a recording to find it here."
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
});
