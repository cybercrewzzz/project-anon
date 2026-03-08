import { AppText } from '@/components/AppText';
import { common } from '@/theme/palettes/common';
import { purple } from '@/theme/palettes/purple';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Switch, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

const connectionHistory = [
  { id: '1', name: 'RecAnonUser99', rating: 4.5, online: false },
  { id: '2', name: 'RecAnonUser99', rating: 4.5, online: true },
  { id: '3', name: 'RecAnonUser99', rating: 4.5, online: true },
];

const emojis = ['😖', '😔', '😐', '😊', '😇'];

export default function PeerToPeer() {
  const router = useRouter();
  const [selectedEmoji, setSelectedEmoji] = useState<number | null>(null);
  const [sameGender, setSameGender] = useState(false);
  const [volunteerOnly, setVolunteerOnly] = useState(true);
  const [starActive, setStarActive] = useState(false);
  const [ticketActive, setTicketActive] = useState(false);

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color={common.black} />
          </Pressable>
          <AppText variant="title3" emphasis="emphasized">
            Peer to Peer
          </AppText>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.badgeRow}>

  <Pressable
    onPress={() => setStarActive(!starActive)}
    style={[
      styles.starBadge,
      { backgroundColor: starActive ? common.white : purple[500] },
    ]}
  >
    <AppText
      style={[
        styles.starBadgeText,
        { color: starActive ? purple[500] : common.white },
      ]}
    >
      ⭐ 185
    </AppText>
  </Pressable>

  <Pressable
    onPress={() => setTicketActive(!ticketActive)}
    style={[
      styles.ticketBadge,
      { backgroundColor: ticketActive ? purple[500] : common.white },
    ]}
  >
    <AppText
      style={[
        styles.ticketBadgeText,
        { color: ticketActive ? common.white : common.gray[700] },
      ]}
    >
      🎫 5
    </AppText>
  </Pressable>

</View>


        {/* Mood Card */}
        <View style={styles.card}>
          <AppText variant="body" emphasis="emphasized" color="accent">
            How are you feeling Right Now?
          </AppText>
          <View style={styles.emojiRow}>
            {emojis.map((emoji, index) => (
              <Pressable
                key={index}
                style={[
                  styles.emojiBtn,
                  selectedEmoji === index && styles.emojiBtnSelected,
                ]}
                onPress={() => setSelectedEmoji(index)}
              >
                <AppText style={styles.emoji}>{emoji}</AppText>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Connect Card */}
        <View style={styles.card}>
          <AppText variant="body" emphasis="emphasized" color="accent">
            What&apos;s troubling you today?
          </AppText>

          <Pressable style={styles.dropdown}>
            <AppText variant="callout" color="muted">
              Select Category
            </AppText>
            <Ionicons name="chevron-down" size={18} color={common.gray[400]} />
          </Pressable>

          <View style={styles.switchRow}>
            <View style={styles.switchItem}>
              <AppText variant="footnote" color="primary">
                Same-Gender
              </AppText>
              <Switch
                value={sameGender}
                onValueChange={setSameGender}
                trackColor={{ false: common.gray[300], true: purple[500] }}
                thumbColor={common.white}
              />
            </View>
            <View style={styles.switchItem}>
              <AppText variant="footnote" color="primary">
                Volunteer Only
              </AppText>
              <Switch
                value={volunteerOnly}
                onValueChange={setVolunteerOnly}
                trackColor={{ false: common.gray[300], true: purple[500] }}
                thumbColor={common.white}
              />
            </View>
          </View>

          <Pressable style={styles.connectBtn}>
            <AppText variant="headline" emphasis="emphasized" color="secondary">
              Connect
            </AppText>
          </Pressable>

          <AppText variant="caption1" color="muted" textAlign="center">
            Your match will remain anonymous !
          </AppText>
        </View>

        {/* Connection History */}
        <View style={styles.card}>
          <AppText variant="body" emphasis="emphasized" color="accent">
            Connection History
          </AppText>
          {connectionHistory.map(user => (
            <View key={user.id} style={styles.userRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar}>
                  <Ionicons name="person" size={24} color={common.white} />
                </View>
                <View
                  style={[
                    styles.onlineDot,
                    {
                      backgroundColor: user.online
                        ? common.green[500]
                        : common.gray[300],
                    },
                  ]}
                />
              </View>

              <View style={styles.userInfo}>
                <AppText
                  variant="callout"
                  emphasis="emphasized"
                  color="primary"
                >
                  {user.name}
                </AppText>
                <View style={styles.ratingRow}>
                  <AppText variant="footnote" color="muted">
                    {user.rating}
                  </AppText>
                  <Ionicons name="star" size={12} color={common.yellow[500]} />
                </View>
              </View>

              <Pressable style={styles.favoriteBtn}>
                <Ionicons
                  name="star-outline"
                  size={22}
                  color={common.red[500]}
                />
              </Pressable>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    // Light lavender page background matching design
    backgroundColor: theme.background.secondary,
    paddingTop: rt.insets.top,
  },

  scrollContent: {
    paddingHorizontal: theme.spacing.s4,
    paddingBottom: theme.spacing.s7,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: theme.spacing.s4,
    marginBottom: theme.spacing.s2,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerSpacer: {
    width: 40,
  },

  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: theme.spacing.s3,
    marginBottom: theme.spacing.s4,
  },
  starBadge: {
    backgroundColor: purple[500],
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starBadgeText: {
    color: common.white,
    fontWeight: '600',
    fontSize: 14,
  },
  ticketBadge: {
    borderWidth: 1.5,
    borderColor: common.gray[300],
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    // White pill on the lavender background
    backgroundColor: theme.background.default,
  },
  ticketBadgeText: {
    color: common.gray[700],
    fontWeight: '600',
    fontSize: 14,
  },


  card: {
    backgroundColor: theme.background.default,
    borderRadius: theme.radius.lg,
    padding: theme.spacing.s4,
    marginBottom: theme.spacing.s4,
    gap: theme.spacing.s4,
   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2, // Android
  },

  emojiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    
  },
  emojiBtn: {
    padding: theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  emojiBtnSelected: {
    backgroundColor: theme.border.default,
  },
  emoji: {
    fontSize: 20,
  },

  dropdown: {
    // Soft lavender tray inside the white card
    backgroundColor: theme.background.secondary,
    padding: theme.spacing.s4,
    borderRadius: theme.radius.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  switchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },

  connectBtn: {
    backgroundColor: theme.action.primary,
    paddingVertical: theme.spacing.s4,
    borderRadius: theme.radius.full,
    alignItems: 'center',
  },

  // Soft lavender rows inside the white card
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.background.secondary,
    borderRadius: theme.radius.sm,
    padding: theme.spacing.s3,
    gap: theme.spacing.s3,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.radius.full,
    backgroundColor: purple[600],
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: theme.background.secondary,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  userInfo: {
    flex: 1,
    gap: 2,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  favoriteBtn: {
    padding: theme.spacing.s2,
  },
}));
