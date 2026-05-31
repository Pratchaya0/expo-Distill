import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

interface MindMapNode { text: string; level: number; children: MindMapNode[]; }

function parseOutline(markdown: string): MindMapNode[] {
  const lines = markdown.split('\n').filter((l) => l.trim());
  const roots: MindMapNode[] = [];
  const stack: MindMapNode[] = [];

  for (const line of lines) {
    let level = 0; let text = '';
    if (line.startsWith('# ')) { level = 1; text = line.slice(2).trim(); }
    else if (line.startsWith('## ')) { level = 2; text = line.slice(3).trim(); }
    else if (line.startsWith('### ') || line.match(/^[-*] /)) { level = 3; text = line.replace(/^[-*#]+\s/, '').trim(); }
    else continue;

    const node: MindMapNode = { text, level, children: [] };
    if (level === 1) { roots.push(node); stack.length = 0; stack.push(node); }
    else {
      while (stack.length > 1 && stack[stack.length - 1].level >= level) stack.pop();
      (stack[stack.length - 1] ?? { children: roots }).children.push(node);
      stack.push(node);
    }
  }
  return roots;
}

function NodeView({ node, depth = 0 }: { node: MindMapNode; depth?: number }) {
  return (
    <View style={[styles.nodeContainer, depth > 0 && styles.indented]}>
      <Text style={node.level === 1 ? styles.root : node.level === 2 ? styles.branch : styles.leaf}>
        {node.text}
      </Text>
      {node.children.map((child, i) => <NodeView key={i} node={child} depth={depth + 1} />)}
    </View>
  );
}

export function MindMapView({ markdown }: { markdown: string }) {
  const nodes = parseOutline(markdown);
  if (!nodes.length) return <Text style={styles.empty}>Could not parse mind map.</Text>;

  return (
    <ScrollView>
      {nodes.map((n, i) => <NodeView key={i} node={n} />)}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  nodeContainer: { marginVertical: 2 },
  indented: { marginLeft: 16, borderLeftWidth: 1.5, borderLeftColor: colors.border, paddingLeft: 10 },
  root: {
    fontSize: 14, fontWeight: '700', color: colors.primary,
    backgroundColor: colors.primaryLight, paddingHorizontal: 8, paddingVertical: 4,
    borderRadius: 6, alignSelf: 'flex-start', marginBottom: 6,
  },
  branch: {
    fontSize: 13, fontWeight: '600', color: colors.text,
    backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 4, alignSelf: 'flex-start', marginVertical: 2,
  },
  leaf: { fontSize: 13, color: colors.textMuted, paddingVertical: 1 },
  empty: { fontSize: 13, color: colors.textMuted },
});
