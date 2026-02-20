import { AppText, AppTextProps } from '@/components/AppText';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Image, ImageSource } from 'expo-image';

interface MenuItemProps {
  leftIcon: ImageSource;
  text: string;
  color?: AppTextProps['color'];
  rightIcon?: ImageSource;
}

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

const UserProfile = () => {
  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginTop: 20 }}>
        <AppText variant="headline">User Profile</AppText>
      </View>
      <View style={styles.profileCardContainer}>
        <AppText variant="body" emphasis="emphasized">
          AnonymousUser47
        </AppText>
        <AppText variant="footnote" style={{ marginTop: 4 }}>
          Rael Usre Nema | RaelUserNema@gmail.com
        </AppText>
        <AppText variant="footnote" style={{ marginTop: 4 }}>
          View Activity
        </AppText>
      </View>

      <View style={styles.settingMenuCardContainer}>
        <MenuItem
          leftIcon={require('@/assets/icons/languageOPT.svg')}
          text="Select Language"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/subscriptionOPT.svg')}
          text="Your Subscription"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/languageOPT.svg')}
          text="Payment"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/languageOPT.svg')}
          text="History"
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
    </View>
  );
};

export default UserProfile;

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.secondary,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
  },
  profileCardContainer: {
    //paddingTop: rt.insets.top + 30,
    marginTop: rt.insets.top + 30,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
  },
  settingMenuCardContainer: {
    marginTop: rt.insets.top + 10,
    //paddingTop: rt.insets.top + 30,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
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
