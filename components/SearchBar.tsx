import React, { useRef } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';

interface Props {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
}

export default function SearchBar({ value, onChangeText, onClear }: Props) {
  const clearOpacity = useRef(new Animated.Value(0)).current;

  const handleChange = (text: string) => {
    onChangeText(text);
    Animated.timing(clearOpacity, {
      toValue: text.length > 0 ? 1 : 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handleClear = () => {
    onClear();
    Animated.timing(clearOpacity, {
      toValue: 0,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <View style={styles.searchIcon}>
          <View style={styles.searchCircle} />
          <View style={styles.searchHandle} />
        </View>
      </View>

      <TextInput
        style={styles.input}
        value={value}
        onChangeText={handleChange}
        placeholder="Search clipboard..."
        placeholderTextColor={Colors.textTertiary}
        selectionColor={Colors.textSecondary}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />

      <Animated.View style={{ opacity: clearOpacity }}>
        <TouchableOpacity style={styles.clearBtn} onPress={handleClear}>
          <View style={styles.clearCircle}>
            <View style={[styles.clearLine, styles.clearLine1]} />
            <View style={[styles.clearLine, styles.clearLine2]} />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.searchBg,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 44,
  },
  iconWrap: {
    marginRight: Spacing.sm,
  },
  searchIcon: {
    width: 16,
    height: 16,
    position: 'relative',
  },
  searchCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: Colors.textTertiary,
    position: 'absolute',
    top: 0,
    left: 0,
  },
  searchHandle: {
    width: 5,
    height: 1.5,
    backgroundColor: Colors.textTertiary,
    position: 'absolute',
    bottom: 2,
    right: 0,
    transform: [{ rotate: '45deg' }],
  },
  input: {
    flex: 1,
    ...Typography.fontRegular,
    fontSize: 15,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  clearCircle: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearLine: {
    position: 'absolute',
    width: 8,
    height: 1.5,
    backgroundColor: Colors.textSecondary,
    borderRadius: 1,
  },
  clearLine1: { transform: [{ rotate: '45deg' }] },
  clearLine2: { transform: [{ rotate: '-45deg' }] },
});
