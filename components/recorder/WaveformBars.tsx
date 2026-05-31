import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';
import { colors } from '@/lib/theme';

const BAR_COUNT = 40;
const BAR_WIDTH = 3;
const BAR_GAP = 2;
const MAX_HEIGHT = 60;
const MIN_HEIGHT = 3;

interface WaveformBarsProps {
  amplitude: number; // 0–1
  isRecording: boolean;
}

export function WaveformBars({ amplitude, isRecording }: WaveformBarsProps) {
  const bars = useRef(Array.from({ length: BAR_COUNT }, () => new Animated.Value(MIN_HEIGHT))).current;
  const historyRef = useRef<number[]>(Array(BAR_COUNT).fill(0));

  useEffect(() => {
    if (!isRecording) return;
    // Shift history left, push new amplitude
    historyRef.current = [...historyRef.current.slice(1), amplitude];
    historyRef.current.forEach((v, i) => {
      Animated.timing(bars[i], {
        toValue: Math.max(MIN_HEIGHT, v * MAX_HEIGHT),
        duration: 80,
        useNativeDriver: false,
      }).start();
    });
  }, [amplitude, isRecording, bars]);

  // Reset when not recording
  useEffect(() => {
    if (!isRecording) {
      historyRef.current = Array(BAR_COUNT).fill(0);
      bars.forEach((b) => {
        Animated.timing(b, { toValue: MIN_HEIGHT, duration: 200, useNativeDriver: false }).start();
      });
    }
  }, [isRecording, bars]);

  return (
    <View style={styles.container}>
      {bars.map((anim, i) => (
        <Animated.View
          key={i}
          style={[
            styles.bar,
            {
              height: anim,
              opacity: isRecording ? 1 : 0.3,
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: MAX_HEIGHT + 8,
    backgroundColor: '#F5F6F7',
    borderRadius: 12,
    paddingHorizontal: 8,
  },
  bar: {
    width: BAR_WIDTH,
    backgroundColor: colors.primary,
    borderRadius: 2,
    marginHorizontal: BAR_GAP / 2,
  },
});
