import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  SafeAreaView, ScrollView, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getApiKey, setApiKey, removeApiKey } from '@/lib/storage/keys';
import { colors } from '@/lib/theme';

function ApiKeyField({
  label, storageKey, placeholder,
}: { label: string; storageKey: string; placeholder: string }) {
  const [value, setValue] = useState('');
  const [visible, setVisible] = useState(false);

  useEffect(() => { getApiKey(storageKey).then((v) => setValue(v ?? '')); }, [storageKey]);

  const save = async () => {
    if (value.trim()) await setApiKey(storageKey, value.trim());
    else await removeApiKey(storageKey);
    Alert.alert('Saved', `${label} saved securely.`);
  };

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.row}>
        <TextInput
          style={styles.input}
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TouchableOpacity onPress={() => setVisible((v) => !v)} style={styles.eyeBtn}>
          <Ionicons name={visible ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.saveBtn} onPress={save}>
        <Ionicons name="checkmark" size={16} color="#FFF" />
        <Text style={styles.saveBtnText}>Save</Text>
      </TouchableOpacity>
      <Text style={styles.hint}>
        Stored in hardware-backed secure storage. Only sent to Groq/OpenAI.
      </Text>
    </View>
  );
}

export default function SettingsTab() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI PROVIDER KEYS</Text>
          <ApiKeyField
            label="Groq API Key (Recommended)"
            storageKey="groq_api_key"
            placeholder="gsk_..."
          />
          <View style={styles.divider} />
          <ApiKeyField
            label="OpenAI API Key (Fallback)"
            storageKey="openai_api_key"
            placeholder="sk-..."
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>STORAGE</Text>
          <View style={styles.row}>
            <Text style={styles.metaLabel}>Type</Text>
            <Text style={styles.metaValue}>SQLite (on-device)</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.metaLabel}>Keys</Text>
            <Text style={styles.metaValue}>Hardware secure storage</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.metaLabel}>Data</Text>
            <Text style={styles.metaValue}>100% yours — no cloud</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: 16, gap: 16 },
  section: {
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
    borderRadius: 4, overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: colors.textMuted, letterSpacing: 0.8,
    paddingHorizontal: 16, paddingVertical: 10,
    backgroundColor: colors.background, borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  fieldGroup: { padding: 16, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: colors.text },
  row: { flexDirection: 'row', alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: 6,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 13,
    color: colors.text, backgroundColor: colors.background, fontFamily: 'monospace',
  },
  eyeBtn: { position: 'absolute', right: 10 },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary, paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 6, alignSelf: 'flex-start', marginTop: 4,
  },
  saveBtnText: { color: '#FFF', fontWeight: '600', fontSize: 13 },
  hint: { fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 16 },
  metaLabel: { flex: 1, fontSize: 13, color: colors.textMuted, paddingHorizontal: 16, paddingVertical: 10 },
  metaValue: { fontSize: 13, color: colors.text, paddingRight: 16 },
});
