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
  Linking,
  AppState,
} from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';
import { useClipboardStore } from '../store/clipboardStore';
import { startClipboardMonitor, stopClipboardMonitor, registerBackgroundFetch } from '../services/clipboardMonitor';
import ClipItemCard from '../components/ClipItemCard';
import SearchBar from '../components/SearchBar';
import EmptyState from '../components/EmptyState';
import { Colors, Typography, Spacing, Radius } from '../constants/theme';
import { ClipItem } from '../store/clipboardStore';

const adUnitId = __DEV__ ? TestIds.BANNER : 'ca-app-pub-3940256099942544/6300978111';
const BACKGROUND_CLIPS_FILE = FileSystem.documentDirectory + 'background_clips.json';
const STATUS_FILE = FileSystem.documentDirectory + 'service_status.json';

export default function HomeScreen() {
  const { items, isLoaded, loadFromStorage, removeItem, clearUnpinned, togglePin } = useClipboardStore();
  const [search, setSearch] = useState('');
  const [isAccessibilityActive, setIsAccessibilityActive] = useState(true);

  // Sync background clips
  const syncBackgroundClips = async () => {
    try {
      const info = await FileSystem.getInfoAsync(BACKGROUND_CLIPS_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(BACKGROUND_CLIPS_FILE);
        if (content) {
          const parsed: string[] = JSON.parse(content);
          if (Array.isArray(parsed) && parsed.length > 0) {
            const store = useClipboardStore.getState();
            parsed.forEach((text) => {
              store.addItem(text, 'text');
            });
            await FileSystem.deleteAsync(BACKGROUND_CLIPS_FILE, { idempotent: true });
          }
        }
      }
    } catch (_) {}
  };

  // Check accessibility status keep-alive file
  const checkAccessibilityStatus = async (): Promise<boolean> => {
    try {
      const info = await FileSystem.getInfoAsync(STATUS_FILE);
      if (info.exists) {
        const content = await FileSystem.readAsStringAsync(STATUS_FILE);
        if (content) {
          const parsed = JSON.parse(content);
          const diff = Date.now() - parsed.timestamp;
          // If the service has written status within the last 4 seconds, it is active
          if (diff < 4000) {
            return true;
          }
        }
      }
    } catch (_) {}
    return false;
  };

  // Open settings
  const handleEnableAccessibility = () => {
    if (Platform.OS === 'android') {
      Linking.sendIntent('android.settings.ACCESSIBILITY_SETTINGS').catch(() => {
        Alert.alert('Error', 'Could not open accessibility settings. Please enable Clipio manually.');
      });
    }
  };

  // Init on mount
  useEffect(() => {
    let isActive = true;

    const runSyncAndCheck = async () => {
      await syncBackgroundClips();
      const active = await checkAccessibilityStatus();
      if (isActive) {
        setIsAccessibilityActive(active);
      }
    };

    loadFromStorage().then(() => {
      startClipboardMonitor();
      registerBackgroundFetch();
      runSyncAndCheck();
    });

    // Periodically sync and check status while app is open
    const statusInterval = setInterval(runSyncAndCheck, 2000);

    const sub = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        runSyncAndCheck();
      }
    });

    return () => {
      isActive = false;
      clearInterval(statusInterval);
      sub.remove();
      stopClipboardMonitor();
    };
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

      {/* ── Accessibility Alert Banner ───────────────────────────────── */}
      {!isAccessibilityActive && Platform.OS === 'android' && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            ⚠️ Background clipboard history is off. Turn on "Clipio" in settings.
          </Text>
          <TouchableOpacity style={styles.bannerBtn} onPress={handleEnableAccessibility}>
            <Text style={styles.bannerBtnText}>Enable</Text>
          </TouchableOpacity>
        </View>
      )}

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

      {/* ── Sticky Banner Ad ────────────────────────────────────────── */}
      <View style={styles.adContainer}>
        <BannerAd
          unitId={adUnitId}
          size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
          requestOptions={{
            requestNonPersonalizedAdsOnly: true,
          }}
        />
      </View>
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
  banner: {
    backgroundColor: 'rgba(255, 214, 10, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 214, 10, 0.25)',
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  bannerText: {
    ...Typography.fontRegular,
    fontSize: 13,
    color: '#FFD60A',
    flex: 1,
    lineHeight: 18,
    letterSpacing: Typography.letterSpacingNormal,
  },
  bannerBtn: {
    backgroundColor: '#FFD60A',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Radius.sm,
  },
  bannerBtnText: {
    ...Typography.fontSemibold,
    fontSize: 12,
    color: '#000000',
  },
  adContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderColor: Colors.border,
  },
});
