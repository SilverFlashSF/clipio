import React, { useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
  Alert,
  Image,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { formatDistanceToNowStrict } from 'date-fns';
import { ClipItem } from '../store/clipboardStore';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

interface Props {
  item: ClipItem;
  onDelete: (id: string) => void;
  onTogglePin: (id: string) => void;
}

export default function ClipItemCard({ item, onDelete, onTogglePin }: Props) {
  const copiedAnim = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const deleteOpacity = useRef(new Animated.Value(0)).current;
  const isCopied = useRef(false);

  const timeAgo = formatDistanceToNowStrict(new Date(item.timestamp), {
    addSuffix: true,
  });

  const flashCopied = () => {
    isCopied.current = true;
    Animated.sequence([
      Animated.timing(copiedAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
      Animated.delay(900),
      Animated.timing(copiedAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
    ]).start(() => {
      isCopied.current = false;
    });
  };

  const handleCopy = async () => {
    try {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (item.type === 'text') {
        await Clipboard.setStringAsync(item.content);
      }
      flashCopied();
    } catch (_) {}
  };

  const handleLongPress = async () => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      item.pinned ? 'Unpin item?' : 'Pin item?',
      item.pinned
        ? 'Remove this item from pinned.'
        : 'Pinned items stay at the top.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: item.pinned ? 'Unpin' : 'Pin',
          onPress: () => onTogglePin(item.id),
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => onDelete(item.id),
        },
      ]
    );
  };

  // Swipe-to-delete
  const panResponder = PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) =>
      Math.abs(g.dx) > 10 && Math.abs(g.dy) < 20,
    onPanResponderMove: (_, g) => {
      if (g.dx < 0) {
        translateX.setValue(g.dx);
        const opacity = Math.min(1, Math.abs(g.dx) / 80);
        deleteOpacity.setValue(opacity);
      }
    },
    onPanResponderRelease: (_, g) => {
      if (g.dx < -80) {
        Animated.parallel([
          Animated.timing(translateX, {
            toValue: -400,
            duration: 250,
            useNativeDriver: true,
          }),
        ]).start(() => {
          onDelete(item.id);
        });
      } else {
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.timing(deleteOpacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    },
  });

  const cardBg = copiedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.surface, Colors.copiedBg],
  });

  const borderColor = copiedAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [Colors.border, Colors.copied],
  });

  const isCodeLike =
    item.type === 'text' &&
    (item.content.includes('\n') ||
      item.content.startsWith('{') ||
      item.content.startsWith('[') ||
      item.content.includes('://') ||
      /^[a-z0-9_-]{20,}$/i.test(item.content.trim()));

  return (
    <View style={styles.container}>
      {/* Delete background */}
      <Animated.View style={[styles.deleteBackground, { opacity: deleteOpacity }]}>
        <Text style={styles.deleteIcon}>🗑</Text>
      </Animated.View>

      {/* Main card */}
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: cardBg, borderColor },
        ]}
        {...panResponder.panHandlers}
      >
        <TouchableOpacity
          style={styles.touchable}
          onPress={handleCopy}
          onLongPress={handleLongPress}
          delayLongPress={400}
          activeOpacity={0.7}
        >
          {/* Pin indicator */}
          {item.pinned && (
            <View style={styles.pinBadge}>
              <Text style={styles.pinIcon}>📌</Text>
            </View>
          )}

          {/* Content */}
          <View style={styles.contentRow}>
            {item.type === 'image' ? (
              <View style={styles.imageRow}>
                <Image
                  source={{ uri: item.content }}
                  style={styles.thumbnail}
                  resizeMode="cover"
                />
                <View style={styles.imageInfo}>
                  <Text style={styles.imageLabel} numberOfLines={1}>
                    Image
                  </Text>
                  <Text style={styles.timeText}>{timeAgo}</Text>
                </View>
              </View>
            ) : (
              <View style={styles.textContent}>
                <Text
                  style={[
                    styles.clipText,
                    isCodeLike && styles.codeText,
                  ]}
                  numberOfLines={3}
                >
                  {item.preview}
                </Text>
                <Text style={styles.timeText}>{timeAgo}</Text>
              </View>
            )}

            {/* Copy indicator */}
            <Animated.View
              style={[
                styles.copyBadge,
                {
                  opacity: copiedAnim,
                  transform: [
                    {
                      scale: copiedAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.7, 1],
                      }),
                    },
                  ],
                },
              ]}
            >
              <Text style={styles.copiedText}>Copied!</Text>
            </Animated.View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    position: 'relative',
  },
  deleteBackground: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: Colors.dangerBg,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 20,
  },
  card: {
    borderRadius: Radius.md,
    borderWidth: 1,
    overflow: 'hidden',
  },
  touchable: {
    padding: Spacing.md,
  },
  pinBadge: {
    position: 'absolute',
    top: Spacing.sm,
    right: Spacing.md,
    zIndex: 1,
  },
  pinIcon: {
    fontSize: 12,
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  textContent: {
    flex: 1,
    paddingRight: Spacing.sm,
  },
  clipText: {
    ...Typography.fontRegular,
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
    letterSpacing: Typography.letterSpacingNormal,
  },
  codeText: {
    fontFamily: 'monospace',
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  timeText: {
    ...Typography.fontRegular,
    fontSize: 11,
    color: Colors.textTertiary,
    marginTop: Spacing.xs,
    letterSpacing: Typography.letterSpacingNormal,
  },
  imageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    backgroundColor: Colors.border,
  },
  imageInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  imageLabel: {
    ...Typography.fontMedium,
    fontSize: 14,
    color: Colors.textPrimary,
  },
  copyBadge: {
    backgroundColor: Colors.copied,
    borderRadius: Radius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    alignSelf: 'center',
  },
  copiedText: {
    ...Typography.fontSemibold,
    fontSize: 11,
    color: '#000',
    letterSpacing: 0.2,
  },
});
