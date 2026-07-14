import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Colors, Typography, Spacing } from '../constants/theme';

interface Props {
  isSearching?: boolean;
}

export default function EmptyState({ isSearching }: Props) {
  const pulseAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <View style={styles.container}>
      <Animated.Text style={[styles.icon, { opacity: pulseAnim }]}>
        {isSearching ? '🔍' : '📋'}
      </Animated.Text>
      <Text style={styles.title}>
        {isSearching ? 'No results' : 'Nothing here yet'}
      </Text>
      <Text style={styles.subtitle}>
        {isSearching
          ? 'Try a different search term'
          : 'Copy something and it will\nappear here automatically'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: 80,
  },
  icon: {
    fontSize: 52,
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.fontSemibold,
    fontSize: 20,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    ...Typography.fontRegular,
    fontSize: 15,
    color: Colors.textTertiary,
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: Typography.letterSpacingNormal,
  },
});
