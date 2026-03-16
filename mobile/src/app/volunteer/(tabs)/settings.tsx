import { View, ScrollView, Pressable, Text } from 'react-native';
import React from 'react';
import { AppText, AppTextProps } from '@/components/AppText';
import { Image, ImageSource } from 'expo-image';
import { StyleSheet } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { logout } from '@/api/auth';

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

const Home = () => {
  const router = useRouter();
  const refreshToken = useAuth(state => state.refreshToken);
  const signOut = useAuth(state => state.signOut);
  const showDevUI = process.env.EXPO_PUBLIC_SHOW_DEV_UI === 'true';

  // Dev-only temporary logout handler; gated behind EXPO_PUBLIC_SHOW_DEV_UI
  const handleLogout = async () => {
    if (!showDevUI) {
      return;
    }

    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // Ignore API errors — still sign out locally
    } finally {
      await signOut();
      router.replace('/start/welcome' as any);
    }
  };

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
        <View style={styles.profileCard}>
          <View style={styles.profileImage}>
            <Image
              source={require('@/assets/icons/GamifiedUserAvatarOPT.svg')}
              style={{ width: 80, height: 80 }}
              contentFit="contain"
            />
          </View>
          <View style={styles.profileDetails}>
            <AppText variant="headline" emphasis="emphasized" color="accent">
              John Doe
            </AppText>
            <AppText variant="footnote" emphasis="emphasized" color="primary">
              Institute Of Mental Health
            </AppText>
            <View style={styles.levelText}>
              <AppText variant="caption1">Level: </AppText>
              <AppText variant="footnote" emphasis="emphasized">
                Basic
              </AppText>
            </View>
          </View>
        </View>
        <View style={styles.xpSection}>
          <LinearGradient
            colors={['#1D47DC', '#0E7FBC']}
            style={styles.xpBarContainer}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            locations={[0, 0.5]}
          >
            <View style={styles.xpText}>
              <AppText variant="footnote" emphasis="regular" color="secondary">
                Level 1
              </AppText>
              <View style={styles.xpAmount}>
                <AppText
                  variant="footnote"
                  emphasis="emphasized"
                  color="secondary"
                >
                  XP:
                </AppText>
                <AppText
                  variant="footnote"
                  emphasis="regular"
                  color="secondary"
                >
                  150/300
                </AppText>
              </View>
            </View>
            <View style={styles.xpBar}>
              <View style={styles.xpBarFill}></View>
            </View>
          </LinearGradient>
          <View style={styles.xpCardsContainer}>
            <XpCard
              text="Daily login"
              value={3}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
            <XpCard
              text="Daily login"
              value={3}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
            <XpCard
              text="Daily login"
              value={3}
              icon={require('@/assets/images/fireIconOPT.webp')}
            />
          </View>
        </View>
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
        <View style={styles.menuSection}>
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
          <MenuItem
            leftIcon={require('@/assets/icons/languageOPT.svg')}
            text="Select Language"
            rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
          />
        </View>
        {/* TODO: Remove this temp button when permanent logout UI is built */}
        <Pressable
          onPress={handleLogout}
          style={{
            backgroundColor: '#DC2626',
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: 'center',
            marginTop: 8,
            marginBottom: 24,
          }}
        >
          <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
            🚪 Logout (Dev)
          </Text>
        </Pressable>
      </ScrollView>
    </View>
  );
};

export default Home;

const styles = StyleSheet.create((theme, rt) => ({
  screen: {
    flex: 1,
    paddingTop: rt.insets.top + theme.spacing.s6,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + theme.spacing.s5,
    paddingRight: rt.insets.right + theme.spacing.s5,
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
    width: '50%',
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
