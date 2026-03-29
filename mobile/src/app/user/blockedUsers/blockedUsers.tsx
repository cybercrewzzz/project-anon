import React, { useState } from 'react';
import {
  View,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AppText } from '@/components/AppText';
import { apiClient } from '@/api/client';
import { BlockEntrySchema } from '@/api/schemas/common';
import type { BlockEntry } from '@/api/schemas/common';
import { queryKeys } from '@/api/keys';
import { parseApiError } from '@/api/errors';

// ── Inline API (works independently without block.ts from PR 4) ───────────────

async function getBlockList(): Promise<{ data: BlockEntry[] }> {
  const { data } = await apiClient.get('/block');
  return z.object({ data: z.array(BlockEntrySchema) }).parse(data);
}

async function unblockUser(blockedId: string): Promise<{ message: string }> {
  const { data } = await apiClient.delete(`/block/${blockedId}`);
  return data;
}

// ── Component ─────────────────────────────────────────────────────────────────

export default function BlockedUsersScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [unblockTarget, setUnblockTarget] = useState<string | null>(null);

  const {
    data: blockedUsers,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: queryKeys.blocks,
    queryFn: getBlockList,
  });

  const unblockMutation = useMutation({
    mutationFn: unblockUser,
    onSuccess: () => {
      setUnblockTarget(null);
      queryClient.invalidateQueries({ queryKey: queryKeys.blocks });
    },
    onError: error => {
      setUnblockTarget(null);
      const apiError = parseApiError(error);
      Alert.alert('Unblock failed', apiError.message);
    },
  });

  const handleUnblock = () => {
    if (unblockTarget) {
      unblockMutation.mutate(unblockTarget);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Error state ──
  if (isError) {
    return (
      <View style={styles.centered}>
        <LinearGradient
          colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
          style={styles.background}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <AppText variant="body" color="primary">
          Could not load blocked users.
        </AppText>
        <Pressable
          onPress={() => refetch()}
          disabled={isFetching}
          style={styles.retryButton}
        >
          {isFetching ? (
            <ActivityIndicator size="small" />
          ) : (
            <AppText variant="body" emphasis="emphasized" color="accent">
              Retry
            </AppText>
          )}
        </Pressable>
      </View>
    );
  }

  const entries = blockedUsers?.data ?? [];

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Image
            source={require('@/assets/icons/chevronRightOPT.svg')}
            style={styles.backIcon}
            contentFit="contain"
          />
        </Pressable>
        <AppText variant="title3" emphasis="emphasized">
          Blocked Users
        </AppText>
        <View style={styles.headerSpacer} />
      </View>

      {/* List */}
      {entries.length === 0 ? (
        <View style={styles.emptyContainer}>
          <AppText style={styles.emptyEmoji}>🎉</AppText>
          <AppText variant="title3" emphasis="emphasized" textAlign="center">
            No blocked users
          </AppText>
          <AppText variant="body" color="gray" textAlign="center">
            You haven&apos;t blocked anyone yet. If you ever need to, you can do
            it during a chat session.
          </AppText>
        </View>
      ) : (
        <FlatList
          data={entries}
          keyExtractor={item => item.blockedId}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <View style={styles.row}>
              {/* Avatar placeholder */}
              <View style={styles.avatarPlaceholder}>
                <AppText variant="headline" color="secondary">
                  🚫
                </AppText>
              </View>

              {/* Info */}
              <View style={styles.rowInfo}>
                <AppText variant="subhead" emphasis="emphasized" numberOfLines={1}>
                  User {item.blockedId.slice(0, 8)}…
                </AppText>
                <AppText variant="caption1" color="gray">
                  Blocked {formatDate(item.blockedAt)}
                </AppText>
              </View>

              {/* Unblock button */}
              <Pressable
                style={styles.unblockButton}
                onPress={() => setUnblockTarget(item.blockedId)}
              >
                <AppText
                  variant="footnote"
                  emphasis="emphasized"
                  color="accent"
                >
                  Unblock
                </AppText>
              </Pressable>
            </View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {/* Unblock confirmation modal */}
      <Modal
        visible={unblockTarget !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setUnblockTarget(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setUnblockTarget(null)}
        />
        <View style={styles.modalSheet}>
          <View style={styles.modalHandle} />
          <AppText
            variant="title3"
            emphasis="emphasized"
            textAlign="center"
          >
            Unblock this user?
          </AppText>
          <AppText variant="body" color="gray" textAlign="center">
            They will be able to match with you again in future sessions.
          </AppText>
          <View style={styles.modalDivider} />
          <View style={styles.modalButtonRow}>
            <Pressable
              style={styles.modalCancelButton}
              onPress={() => setUnblockTarget(null)}
              disabled={unblockMutation.isPending}
            >
              <AppText variant="body" emphasis="emphasized" color="secondary">
                Cancel
              </AppText>
            </Pressable>
            <Pressable
              style={[
                styles.modalUnblockButton,
                unblockMutation.isPending && styles.buttonDisabled,
              ]}
              onPress={handleUnblock}
              disabled={unblockMutation.isPending}
            >
              <AppText variant="body" emphasis="emphasized" color="secondary">
                {unblockMutation.isPending ? 'Unblocking...' : 'Unblock'}
              </AppText>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s4,
    paddingBottom: rt.insets.bottom,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing.s4,
  },
  background: {
    position: 'absolute',
    inset: 0,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.s5,
    paddingBottom: theme.spacing.s4,
  },
  backIcon: {
    width: 24,
    height: 24,
    transform: [{ rotate: '180deg' }],
  },
  headerSpacer: {
    width: 24,
  },
  retryButton: {
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s5,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.s7,
    gap: theme.spacing.s3,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: theme.spacing.s3,
  },
  listContent: {
    paddingHorizontal: theme.spacing.s5,
    paddingBottom: theme.spacing.s6,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s4,
    paddingVertical: theme.spacing.s4,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.surface.muted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowInfo: {
    flex: 1,
    gap: theme.spacing.s1,
  },
  unblockButton: {
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    borderWidth: 1,
    borderColor: theme.text.accent,
  },
  separator: {
    height: 1,
    backgroundColor: theme.border.default,
  },
  // ── Unblock confirmation modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: theme.background.overlay,
  },
  modalSheet: {
    backgroundColor: theme.background.default,
    paddingTop: theme.spacing.s3,
    paddingBottom: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    alignItems: 'center',
    gap: theme.spacing.s4,
  },
  modalHandle: {
    width: 50,
    height: 4,
    borderRadius: 2,
    backgroundColor: theme.text.muted,
    marginBottom: theme.spacing.s3,
  },
  modalDivider: {
    width: '100%',
    height: 1,
    backgroundColor: theme.border.default,
  },
  modalButtonRow: {
    flexDirection: 'row',
    gap: theme.spacing.s5,
    marginTop: theme.spacing.s3,
  },
  modalCancelButton: {
    backgroundColor: theme.action.muted,
    paddingVertical: theme.spacing.s3 + theme.spacing.s1,
    paddingHorizontal: theme.spacing.s7,
    borderRadius: theme.radius.full,
  },
  modalUnblockButton: {
    backgroundColor: theme.action.secondary,
    paddingVertical: theme.spacing.s3 + theme.spacing.s1,
    paddingHorizontal: theme.spacing.s7,
    borderRadius: theme.radius.full,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
}));
