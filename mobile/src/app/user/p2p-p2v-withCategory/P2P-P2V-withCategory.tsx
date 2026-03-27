import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TextInput,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Image } from 'expo-image';
import { AppText } from '@/components/AppText';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import Toggle from '@/components/Toggle';
import { purple } from '@/theme/palettes/purple';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryKeys } from '@/api/keys';
import { fetchSessionTickets, connectSession } from '@/api/session-api';
import { ApiError } from '@/api/errors';
import { useCategories } from '@/hooks/useLookup';

const HistoryBarGradient = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundSecondary,
}));

const ConnectButtonGradient = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.textGradient,
}));

// Feeling level emoji map (1=worst → 5=best)
const FEELING_EMOJIS = [
  { level: 1, icon: require('@/assets/icons/face-em1.svg') },
  { level: 2, icon: require('@/assets/icons/face-em2.svg') },
  { level: 3, icon: require('@/assets/icons/face-em3.svg') },
  { level: 4, icon: require('@/assets/icons/face-em4.svg') },
  { level: 5, icon: require('@/assets/icons/face-em5.svg') },
];

const P2P_P2V_withCategory = () => {
  const router = useRouter();
  const [problemText, setProblemText] = useState('');
  const [feelingLevel, setFeelingLevel] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(
    null,
  );
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);

  // ── Live ticket count from GET /session/tickets ─────────────────────────
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: queryKeys.tickets,
    queryFn: fetchSessionTickets,
    staleTime: 30_000, // refetch every 30 seconds
  });

  // ── Categories from lookup ───────────────────────────────────────────────
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const selectedCategory = categories?.find(
    c => c.categoryId === selectedCategoryId,
  );

  // ── POST /session/connect mutation ───────────────────────────────────────
  const connectMutation = useMutation({
    mutationFn: connectSession,
    onSuccess: result => {
      if ('status' in result && result.status === 'waiting') {
        // Path B: queued — navigate to waiting screen with sessionId
        router.push({
          pathname: '/user/WaitingScreen/waitingScreen',
          params: { sessionId: result.sessionId },
        });
      } else if ('sessionId' in result && 'volunteerId' in result) {
        // Path A: instant match — navigate straight to chat
        router.push({
          pathname: '/user/session/[chat]',
          params: { chat: result.sessionId },
        });
      }
    },
    onError: (error: unknown) => {
      if (error instanceof ApiError) {
        if (error.statusCode === 403) {
          Alert.alert(
            'No Tickets Left',
            'You have used all your sessions for today. Please try again tomorrow.',
          );
        } else if (error.statusCode === 409) {
          Alert.alert(
            'Active Session',
            'You already have an active session. Please end it before starting a new one.',
          );
        } else {
          Alert.alert('Connection Failed', error.message);
        }
      } else {
        Alert.alert('Error', 'Something went wrong. Please try again.');
      }
    },
  });

  const handleConnect = () => {
    if (!selectedCategoryId) {
      Alert.alert('Select a Category', 'Please choose what is troubling you.');
      return;
    }
    if (!feelingLevel) {
      Alert.alert('How are you feeling?', 'Please select your feeling level.');
      return;
    }
    if ((tickets?.remaining ?? 0) === 0) {
      Alert.alert(
        'No Tickets Left',
        'You have used all your sessions for today.',
      );
      return;
    }

    connectMutation.mutate({
      categoryId: selectedCategoryId,
      feelingLevel,
      customLabel: problemText.trim() || undefined,
      idempotencyKey: crypto.randomUUID(),
    });
  };

  const ticketCount =
    ticketsLoading ? '...' : (tickets?.remaining ?? 0).toString();
  const isConnecting = connectMutation.isPending;

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.screenTitle}>
          <AppText variant="headline">Peer to Peer</AppText>
        </View>
        <View style={styles.smallCardContainer}>
          <View style={styles.pointCard}>
            <Image
              source={require('@/assets/icons/pointsStar.svg')}
              style={{ width: 25, height: 25 }}
            ></Image>
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.pointText}
            >
              185
            </AppText>
          </View>

          {/* ── Live ticket count ─────────────────────────── */}
          <View style={styles.ticketCard}>
            <Image
              source={require('@/assets/icons/ticket.svg')}
              style={{ width: 25, height: 25 }}
            ></Image>
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.ticketText}
            >
              {ticketCount}
            </AppText>
          </View>
        </View>

        {/* ── Feeling level selector ─────────────────────── */}
        <View style={styles.emotionCard}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.emotionCardText}
          >
            How are you feeling Right Now?
          </AppText>
          <View style={styles.emojeeContainer}>
            {FEELING_EMOJIS.map(({ level, icon }) => (
              <Pressable
                key={level}
                onPress={() => setFeelingLevel(level)}
                style={[
                  styles.emojiWrapper,
                  feelingLevel === level && styles.emojiWrapperSelected,
                ]}
              >
                <Image source={icon} style={{ width: 35, height: 35 }} />
              </Pressable>
            ))}
          </View>
          {feelingLevel && (
            <AppText variant="caption1" style={styles.feelingLabel}>
              Feeling level: {feelingLevel}/5
            </AppText>
          )}
        </View>

        {/* ── Category selector ─────────────────────────── */}
        <View style={styles.categoryCard}>
          <AppText
            variant="body"
            emphasis="emphasized"
            style={styles.emotionCardText}
          >
            What is troubling you today?
          </AppText>
          <Pressable
            style={styles.categoryType}
            onPress={() => setShowCategoryPicker(v => !v)}
          >
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.categoryTypeText}
            >
              {categoriesLoading ?
                'Loading…'
              : (selectedCategory?.name ?? 'Select a Category')}
            </AppText>
            <Image
              source={require('@/assets/icons/chevron-downOPT.svg')}
              style={styles.dropDownIcon}
            ></Image>
          </Pressable>

          {/* ── Inline category picker ─────────────────── */}
          {showCategoryPicker && (
            <View style={styles.categoryPickerList}>
              {(categories ?? []).map(cat => (
                <Pressable
                  key={cat.categoryId}
                  style={[
                    styles.categoryPickerItem,
                    selectedCategoryId === cat.categoryId &&
                      styles.categoryPickerItemSelected,
                  ]}
                  onPress={() => {
                    setSelectedCategoryId(cat.categoryId);
                    setShowCategoryPicker(false);
                  }}
                >
                  <AppText
                    variant="caption1"
                    emphasis={
                      selectedCategoryId === cat.categoryId ?
                        'emphasized'
                      : 'regular'
                    }
                  >
                    {cat.name}
                  </AppText>
                </Pressable>
              ))}
            </View>
          )}

          <View>
            <AppText
              variant="body"
              emphasis="emphasized"
              style={styles.descriptionTitleText}
            >
              Tell Your Problem
            </AppText>
            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Tell us about your issue (optional)"
                placeholderTextColor={purple[400]}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                value={problemText}
                onChangeText={setProblemText}
              />
            </View>

            <View style={styles.toggleRow}>
              <Toggle label="Same-Gender" initialValue={false} />
              <Toggle label="Volunteer Only" initialValue={true} />
            </View>

            {/* ── Connect button ─────────────────────── */}
            <Pressable
              onPress={handleConnect}
              disabled={isConnecting}
              style={styles.connectButtonWrapper}
            >
              <ConnectButtonGradient
                style={[
                  styles.connectButton,
                  isConnecting && styles.connectButtonDisabled,
                ]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
              >
                {isConnecting ?
                  <ActivityIndicator color="#fff" size="small" />
                : <AppText variant="body" emphasis="emphasized" color="secondary">
                    Connect
                  </AppText>
                }
              </ConnectButtonGradient>
            </Pressable>
            <AppText variant="caption1" style={styles.anonymousText}>
              Your match will remain anonymous!
            </AppText>
          </View>
        </View>

        {/* ── Connection History ─────────────────────────── */}
        <View style={styles.connectionHistoryPressable}>
          <Pressable
            onPress={() =>
              router.push('/user/session-history/sessionHistory')
            }
          >
            <HistoryBarGradient
              style={styles.connectionHistoryBar}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
            >
              <AppText
                variant="body"
                emphasis="emphasized"
                style={styles.connectionHistoryText}
              >
                Connection History
              </AppText>
              <View>
                <Image
                  source={require('@/assets/icons/chevronRightOPT.svg')}
                  style={styles.chevronRight}
                />
              </View>
            </HistoryBarGradient>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
};

export default P2P_P2V_withCategory;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.surface.secondary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  scrollContent: {
    paddingBottom: 32,
  },
  screenTitle: {
    alignItems: 'center',
    marginTop: 20,
  },
  pointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.accent,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  ticketCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.full,
    paddingHorizontal: 10,
    paddingVertical: 5,
    gap: 4,
  },
  smallCardContainer: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 20,
    justifyContent: 'flex-end',
  },
  pointText: {
    color: theme.text.secondary,
  },
  ticketText: {
    color: theme.text.accent,
    paddingHorizontal: 5,
  },
  emotionCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    marginTop: 20,
  },
  emotionCardText: {
    color: theme.text.subtle1,
    margin: 5,
    marginTop: 10,
  },
  emojeeContainer: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 24,
    padding: 4,
    justifyContent: 'center',
  },
  emojiWrapper: {
    padding: 4,
    borderRadius: theme.radius.full,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  emojiWrapperSelected: {
    borderColor: theme.background.accent,
    backgroundColor: theme.background.accent + '20',
  },
  feelingLabel: {
    color: theme.text.muted,
    textAlign: 'center',
    marginTop: 6,
  },
  categoryCard: {
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
    marginTop: 20,
  },
  categoryType: {
    flexDirection: 'row',
    marginTop: 10,
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
  },
  categoryTypeText: {
    color: theme.text.primary,
    paddingVertical: 8,
    paddingHorizontal: 4,
    flex: 1,
  },
  dropDownIcon: {
    width: 16,
    height: 14,
    alignSelf: 'center',
    marginRight: 8,
  },
  categoryPickerList: {
    marginTop: 4,
    backgroundColor: theme.surface.secondary,
    borderRadius: theme.radius.md,
    borderWidth: 1,
    borderColor: theme.text.subtle2,
    overflow: 'hidden',
  },
  categoryPickerItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: theme.text.subtle2 + '40',
  },
  categoryPickerItemSelected: {
    backgroundColor: theme.background.accent + '20',
  },
  descriptionTitleText: {
    marginTop: 20,
    color: theme.text.subtle1,
  },
  textInputContainer: {
    marginTop: 10,
    backgroundColor: theme.surface.secondary,
    borderColor: theme.text.subtle2,
    borderWidth: 2,
    borderRadius: theme.radius.md,
    minHeight: 100,
  },
  textInput: {
    padding: 12,
    color: theme.text.primary,
    fontSize: 14,
    minHeight: 100,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
    marginTop: 10,
    paddingHorizontal: 4,
    paddingVertical: 8,
  },
  connectButtonWrapper: {
    alignSelf: 'stretch',
  },
  connectButton: {
    paddingVertical: theme.spacing.s3 + theme.spacing.s2,
    paddingHorizontal: theme.spacing.s5,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: theme.radius.md,
  },
  connectButtonDisabled: {
    opacity: 0.6,
  },
  anonymousText: {
    color: theme.text.muted,
    textAlign: 'center',
    marginTop: 12,
  },
  connectionHistoryPressable: {
    marginTop: 20,
    borderRadius: theme.radius.md,
    overflow: 'hidden',
    boxShadow: theme.elevation.level3,
  },
  connectionHistoryBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  connectionHistoryText: {
    color: theme.text.accent,
  },
  chevronRight: {
    width: 14,
    height: 14,
    tintColor: theme.background.accent,
  },
}));