import { View, ScrollView, ActivityIndicator } from 'react-native';
import React from 'react';
import { AppText, AppTextProps } from '@/components/AppText';
import { Image, ImageSource } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useVolunteerProfile } from '@/hooks/useVolunteerProfile';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface XpCardProps {
  text: string;
  value: number;
  icon: ImageSource;
}

interface MenuItemProps {
  leftIcon: ImageSource;
  text: string;
  color?: AppTextProps['color'];
  rightIcon?: ImageSource;
}

const XpCard = ({ text, value, icon }: XpCardProps) => {
  return (
    <View style={styles.card}>
      <View>
        <AppText variant="subhead" emphasis="emphasized" color="secondary">
          {text}
        </AppText>
      </View>
      <View style={styles.cardValue}>
        <Image
          source={icon}
          style={{ width: 24, height: 24 }}
          contentFit="contain"
        />
        <AppText variant="title3" emphasis="emphasized" color="secondary">
          {value}
        </AppText>
      </View>
    </View>
  );
};

const MenuItem = ({
  leftIcon,
  text,
  color = 'primary',
  rightIcon,
}: MenuItemProps) => {
  return (
    <View style={styles.menuItem}>
      <View style={styles.menuItemText}>
        <Image source={leftIcon} style={{ width: 24, height: 24 }} />
        <AppText variant="body" emphasis="emphasized" color={color}>
          {text}
        </AppText>
      </View>
      <View style={styles.menuItemicon}>
        <Image source={rightIcon} style={{ width: 18, height: 18 }} />
      </View>
    </View>
  );
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Map numeric level to a display label matching the Figma design */
function getLevelLabel(level: number): string {
  if (level <= 1) return 'Basic';
  if (level <= 3) return 'Intermediate';
  if (level <= 6) return 'Advanced';
  return 'Expert';
}

/** XP needed to reach the next level (simple linear scale: 300 × level) */
function getXpCap(level: number): number {
  return Math.max(1, level) * 300;
}

// ─── Screen ───────────────────────────────────────────────────────────────────

const SettingsScreen = () => {
  const { data: profile, isLoading, isError } = useVolunteerProfile();

  // ── Loading state ──
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  // ── Error state ──
  if (isError || !profile) {
    return (
      <View style={styles.centered}>
        <AppText variant="body" color="primary">
          Could not load profile. Please try again.
        </AppText>
      </View>
    );
  }

  // ── Derived values from real data ──
  const level = profile.experience?.level ?? 1;
  const points = profile.experience?.points ?? 0;
  const xpCap = getXpCap(level);
  const xpPercent = Math.min(points / xpCap, 1);
  const levelLabel = getLevelLabel(level);

  return (
    <View style={styles.screen}>
      <LinearGradient
        colors={['#F6E0FF', '#F9FBFF', '#D2ECFE']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        locations={[0.38, 0.63, 0.8]}
      />

      <ScrollView contentContainerStyle={styles.contentContainer}>
        {/* ── Profile card ── */}
        <View style={styles.profileCard}>
          <View style={styles.profileImage}>
            <Image
              source={require('@/assets/icons/GamifiedUserAvatarOPT.svg')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
          <View style={styles.profileDetails}>
            {/* Real name from API */}
            <AppText variant="headline" emphasis="emphasized" color="accent">
              {profile.name}
            </AppText>
            {/* Real institute from API */}
            <AppText variant="footnote" emphasis="emphasized" color="primary">
              {profile.instituteName}
            </AppText>
            <View style={styles.levelText}>
              <AppText variant="caption1">Level: </AppText>
              {/* Real level label derived from experience.level */}
              <AppText variant="footnote" emphasis="emphasized">
                {levelLabel}
              </AppText>
            </View>
          </View>
        </View>

        {/* ── XP section ── */}
        <View style={styles.xpSection}>
          <LinearGradient
            colors={['#1D47DC', '#0E7FBC']}
            style={styles.xpBarContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5]}
          >
            <View style={styles.xpText}>
              {/* Real level number */}
              <AppText variant="footnote" emphasis="regular" color="secondary">
                Level {level}
              </AppText>
              <View style={styles.xpAmount}>
                <AppText
                  variant="footnote"
                  emphasis="emphasized"
                  color="secondary"
                >
                  XP:{' '}
                </AppText>
                {/* Real points / cap */}
                <AppText
                  variant="footnote"
                  emphasis="regular"
                  color="secondary"
                >
                  {points}/{xpCap}
                </AppText>
              </View>
            </View>
            <View style={styles.xpBar}>
              {/* Dynamic fill width based on real XP progress */}
              <View
                style={[styles.xpBarFill, { width: `${xpPercent * 100}%` }]}
              />
            </View>
          </LinearGradient>

          <View style={styles.xpCardsContainer}>
            {/* Real points in all three cards — swap icons/labels as needed */}
            <XpCard
              text="Daily login"
              value={3}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
            <XpCard
              text="Points"
              value={points}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
            <XpCard
              text="Points"
              value={points}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
          </View>
        </View>

        {/* ── Certificate banner ── */}
        <View style={styles.Certificate}>
          <View style={styles.CertificateText}>
            <AppText variant="title3" emphasis="emphasized">
              Get Your
            </AppText>
            <AppText variant="title3" emphasis="emphasized">
              Certificate !
            </AppText>
          </View>
          <Image
            source={require('@/assets/icons/certificateOPT.svg')}
            style={styles.CertificateImage}
            contentFit="contain"
          />
        </View>

        {/* ── Menu section ── */}
        <View style={styles.menuSection}>
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Your Specialisation"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="History"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="About"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Help & FAQs"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Log out"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
        </View>
      </ScrollView>
    </View>
  );
};

export default SettingsScreen;

// ─── Styles (unchanged from original) ────────────────────────────────────────

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    gap: theme.spacing.s4,
    flex: 1,
  },
  background: {
    position: 'absolute',
    inset: 0,
  },
  profileCard: {
    backgroundColor: '#CDE2FF',
    flexDirection: 'row',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.mdSoft,
    alignItems: 'center',
    gap: theme.spacing.s5,
  },
  xpSection: {
    gap: theme.spacing.s3,
  },
  Certificate: {
    backgroundColor: '#CDE2FF',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: theme.spacing.s3,
    borderRadius: theme.radius.mdSoft,
    flexDirection: 'row',
  },
  menuSection: {
    backgroundColor: theme.background.secondary,
    borderRadius: theme.radius.md,
  },
  profileImage: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: theme.spacing.s3,
  },
  profileDetails: {
    alignContent: 'center',
    gap: theme.spacing.s2,
  },
  xpBarContainer: {
    borderRadius: theme.radius.md,
    padding: theme.spacing.s3,
    paddingVertical: theme.spacing.s4,
  },
  xpCardsContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
  },
  levelText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s1,
  },
  xpText: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  xpAmount: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  xpBar: {
    height: 12,
    backgroundColor: theme.background.secondary,
    borderRadius: theme.radius.full,
    marginTop: theme.spacing.s2,
  },
  xpBarFill: {
    height: '100%',
    backgroundColor: '#36D367',
    borderRadius: theme.radius.full,
  },
  card: {
    backgroundColor: '#72BCF8',
    borderRadius: theme.radius.md,
    paddingVertical: theme.spacing.s2,
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardValue: {
    flexDirection: 'row',
    gap: theme.spacing.s2,
    paddingVertical: theme.spacing.s1,
  },
  CertificateText: {
    gap: theme.spacing.s1,
  },
  CertificateImage: {
    width: 74,
    height: 69,
    position: 'absolute',
    right: theme.spacing.s3,
    bottom: -theme.spacing.s3,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s2,
  },
  menuItemText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s2,
  },
  menuItemicon: {},
}));
