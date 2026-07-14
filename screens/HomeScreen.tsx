import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  StatusBar,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { useClipboardStore } from '../store/clipboardStore';
import { startClipboardMonitor, stopClipboardMonitor, registerBackgroundFetch } from '../services/clipboardMonitor';
import ClipItemCard from '../components/ClipItemCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { ClipItem } from '../store/clipboardStore';

export default function HomeScreen() {
  const { items, isLoaded, loadFromStorage, removeItem, clearUnpinned, togglePin } = useClipboardStore();
  const [search, setSearch] = useState('');

  // Init on mount
  useEffect(() => {
    loadFromStorage().then(() => {
      startClipboardMonitor();
      registerBackgroundFetch();
    });
    return () => stopClipboardMonitor();
  }, []);

  const handleClearAll = () => {
    Alert.alert(
      'Clear history?',
      'This will remove all unpinned items. Pinned items will stay.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: clearUnpinned,
        },
      ]
    );
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return items;
    const q = search.toLowerCase();
    return items.filter(
      (i) =>
        i.type === 'text' &&
        i.content.toLowerCase().includes(q)
    );
  }, [items, search]);

  const pinned = useMemo(() => filtered.filter((i) => i.pinned), [filtered]);
  const unpinned = useMemo(() => filtered.filter((i) => !i.pinned), [filtered]);

  const unpinnedCount = items.filter((i) => !i.pinned).length;

  const renderItem = useCallback(
    ({ item }: { item: ClipItem }) => (
      <ClipItemCard
        item={item}
        onDelete={removeItem}
        onTogglePin={togglePin}
      />
    ),
    [removeItem, togglePin]
  );

  const keyExtractor = useCallback((item: ClipItem) => item.id, []);

  if (!isLoaded) return null;

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />

      {/* ── Header ───────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.title}>Clipboard</Text>
          {unpinnedCount > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countText}>{unpinnedCount}</Text>
            </View>
          )}
        </View>
        {unpinnedCount > 0 && (
          <TouchableOpacity onPress={handleClearAll} style={styles.clearBtn}>
            <Text style={styles.clearText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ── Search ───────────────────────────────────────────────────── */}
      <SearchBar
        value={search}
        onChangeText={setSearch}
        onClear={() => setSearch('')}
      />

      {/* ── Content ──────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <EmptyState isSearching={search.length > 0} />
      ) : (
        <FlatList
          data={unpinned}
          keyExtractor={keyExtractor}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            <>
              {/* Pinned section */}
              {pinned.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionLabel}>PINNED</Text>
                  {pinned.map((item) => (
                    <ClipItemCard
                      key={item.id}
                      item={item}
                      onDelete={removeItem}
                      onTogglePin={togglePin}
                    />
                  ))}
                </View>
              )}

              {/* Recent section label */}
              {unpinned.length > 0 && (
                <Text style={styles.sectionLabel}>RECENT</Text>
              )}
            </>
          }
          ListEmptyComponent={
            pinned.length > 0 ? null : <EmptyState isSearching={search.length > 0} />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Platform.OS === 'android' ? 40 : Spacing.md,
    paddingBottom: Spacing.lg,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  title: {
    ...Typography.fontBold,
    fontSize: 28,
    color: Colors.textPrimary,
    letterSpacing: Typography.letterSpacingTight,
  },
  countBadge: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.full,
    paddingHorizontal: 9,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  countText: {
    ...Typography.fontMedium,
    fontSize: 13,
    color: Colors.textSecondary,
  },
  clearBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  clearText: {
    ...Typography.fontMedium,
    fontSize: 14,
    color: Colors.textSecondary,
    letterSpacing: Typography.letterSpacingNormal,
  },
  listContent: {
    paddingBottom: 32,
  },
  section: {
    marginBottom: Spacing.xs,
  },
  sectionLabel: {
    ...Typography.fontSemibold,
    fontSize: 11,
    color: Colors.textTertiary,
    letterSpacing: 1.2,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
    marginTop: Spacing.xs,
  },
});
