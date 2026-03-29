import React, { useState, useCallback } from 'react';
import {
  View,
  Pressable,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import type { AppTheme } from '@/theme/appTheme';
import { AppText } from '@/components/AppText';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useInfiniteQuery } from '@tanstack/react-query';
import { fetchSessionHistory } from '@/api/session-api';
import type { SessionHistoryItem } from '@/api/schemas';

const PAGE_LIMIT = 15;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDuration(startedAt: string, endedAt: string | null): string {
  if (!endedAt) return '—';
  const diffMs = new Date(endedAt).getTime() - new Date(startedAt).getTime();
  const totalSeconds = Math.floor(diffMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

function formatStatusLabel(status: string): string {
  switch (status) {
    case 'cancelled_timeout':
      return 'Cancelled (Timeout)';
    case 'cancelled_disconnect':
      return 'Cancelled (Disconnect)';
    case 'completed':
      return 'Completed';
    case 'waiting':
      return 'Waiting';
    case 'started':
      return 'In Progress';
    case 'cancelled':
      return 'Cancelled';
    default:
      return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
  }
}

function statusColor(status: string, theme: AppTheme): string {
  if (status === 'completed') return theme.state.success;
  if (status.startsWith('cancelled')) return theme.state.error;
  return theme.text.muted;
}

function StarRating({ rating }: { rating: number | null }) {
  const { theme } = useUnistyles();
  if (rating === null)
    return (
      <AppText variant="caption2" color="accent">
        Not rated
      </AppText>
    );
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <Ionicons
          key={i}
          name={i <= rating ? 'star' : 'star-outline'}
          size={12}
          color={i <= rating ? theme.state.warning : theme.text.subtle2}
        />
      ))}
    </View>
  );
}

// ── Session History Item Card ─────────────────────────────────────────────────

function HistoryCard({ item }: { item: SessionHistoryItem }) {
  const { theme } = useUnistyles();
  return (
    <View style={cardStyles.card}>
      <View style={cardStyles.topRow}>
        <View style={cardStyles.categoryBadge}>
          <AppText variant="caption1" emphasis="emphasized" color="accent">
            {item.category ?? 'General'}
          </AppText>
        </View>
        <View
          style={[
            cardStyles.statusBadge,
            { backgroundColor: statusColor(item.status, theme) + '20' },
          ]}
        >
          <View
            style={[
              cardStyles.statusDot,
              { backgroundColor: statusColor(item.status, theme) },
            ]}
          />
          <AppText
            variant="caption2"
            style={{ color: statusColor(item.status, theme) }}
          >
            {formatStatusLabel(item.status)}
          </AppText>
        </View>
      </View>

      <View style={cardStyles.midRow}>
        <View style={cardStyles.metaItem}>
          <Ionicons name="calendar-outline" size={13} color={theme.text.muted} />
          <AppText variant="caption2" color="accent">
            {formatDate(item.startedAt)}
          </AppText>
        </View>
        <View style={cardStyles.metaItem}>
          <Ionicons name="time-outline" size={13} color={theme.text.muted} />
          <AppText variant="caption2" color="accent">
            {formatDuration(item.startedAt, item.endedAt)}
          </AppText>
        </View>
      </View>

      <View style={cardStyles.ratingRow}>
        <AppText variant="caption2" color="accent">
          Your rating:{'  '}
        </AppText>
        <StarRating rating={item.yourRating} />
        {item.starred && (
          <Ionicons
            name="bookmark"
            size={13}
            color={theme.action.primary}
            style={{ marginLeft: 6 }}
          />
        )}
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create(theme => ({
  card: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.s4,
    marginHorizontal: theme.spacing.s4,
    marginBottom: theme.spacing.s3,
    gap: theme.spacing.s2,
    boxShadow: theme.elevation.level2,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    backgroundColor: theme.background.accent + '15',
    paddingHorizontal: theme.spacing.s3,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: theme.spacing.s2,
    paddingVertical: 3,
    borderRadius: theme.radius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  midRow: {
    flexDirection: 'row',
    gap: theme.spacing.s4,
    marginTop: 2,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  closedReason: {
    color: '#9E9E9E',
    fontStyle: 'italic',
  },
}));

// ── Empty State ───────────────────────────────────────────────────────────────

function EmptyState() {
  const { theme } = useUnistyles();
  return (
    <View style={emptyStyles.container}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme.text.subtle2} />
      <AppText variant="title3" textAlign="center" emphasis="emphasized">
        No Sessions Yet
      </AppText>
      <AppText variant="body" textAlign="center" color="accent">
        Your past sessions will appear here once you connect with a volunteer.
      </AppText>
    </View>
  );
}

const emptyStyles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.s6,
    gap: theme.spacing.s4,
    paddingBottom: theme.spacing.s7,
  },
}));

// ── Session History Screen ────────────────────────────────────────────────────

export default function SessionHistoryScreen() {
  const router = useRouter();
  const { theme } = useUnistyles();
  const [refreshing, setRefreshing] = useState(false);

  const {
    data,
    isLoading,
    isError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['session', 'history'],
    queryFn: ({ pageParam = 1 }) =>
      fetchSessionHistory({ page: pageParam as number, limit: PAGE_LIMIT }),
    getNextPageParam: lastPage => {
      const loaded = lastPage.page * lastPage.limit;
      return loaded < lastPage.total ? lastPage.page + 1 : undefined;
    },
    initialPageParam: 1,
  });

  const allSessions = data?.pages.flatMap(p => p.sessions) ?? [];
  const total = data?.pages[0]?.total ?? 0;

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleLoadMore = () => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} style={styles.backIcon} />
        </Pressable>
        <View style={styles.headerTitles}>
          <AppText variant="title3" emphasis="emphasized">
            Session History
          </AppText>
          {total > 0 && (
            <AppText variant="caption1" color="accent">
              {total} session{total !== 1 ? 's' : ''} total
            </AppText>
          )}
        </View>
      </View>

      {/* Body */}
      {isLoading && (
        <View style={styles.centered}>
          <ActivityIndicator size="large" />
          <AppText variant="body" color="accent" style={{ marginTop: 12 }}>
            Loading your history…
          </AppText>
        </View>
      )}

      {isError && !isLoading && (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={48} color={theme.state.error} />
          <AppText variant="body" textAlign="center" color="accent">
            Failed to load session history.
          </AppText>
          <Pressable style={styles.retryButton} onPress={() => refetch()}>
            <AppText variant="body" color="secondary">
              Try Again
            </AppText>
          </Pressable>
        </View>
      )}

      {!isLoading && !isError && (
        <FlatList
          data={allSessions}
          keyExtractor={item => item.sessionId}
          renderItem={({ item }) => <HistoryCard item={item} />}
          ListEmptyComponent={<EmptyState />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListFooterComponent={
            isFetchingNextPage ?
              <ActivityIndicator size="small" style={{ marginVertical: 16 }} />
            : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    backgroundColor: theme.background.default,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s4,
    paddingVertical: theme.spacing.s3,
    gap: theme.spacing.s3,
    borderBottomWidth: 1,
    borderBottomColor: theme.text.subtle2 + '30',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    color: theme.text.primary,
  },
  headerTitles: {
    flex: 1,
    gap: 2,
  },
  listContent: {
    paddingTop: theme.spacing.s4,
    paddingBottom: theme.spacing.s7,
    flexGrow: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s4,
    paddingHorizontal: theme.spacing.s6,
  },
  retryButton: {
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s6,
    backgroundColor: theme.action.secondary,
    borderRadius: theme.radius.full,
  },
}));
