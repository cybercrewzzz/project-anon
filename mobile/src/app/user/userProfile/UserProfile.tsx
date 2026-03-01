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
        <Image source={leftIcon} style={{ width: 18, height: 18 }} />
        <AppText variant="body" emphasis="emphasized" color={color}>
          {text}
        </AppText>
      </View>
      <View>
        <Image source={rightIcon} style={styles.menuItemicon} />
      </View>
    </View>
  );
};

const UserProfile = () => {
  return (
    <View style={styles.container}>
      <View style={styles.screenTitle}>
        <AppText variant="headline">User Profile</AppText>
      </View>
      <View style={styles.profileCardContainer}>
        <View>
          <AppText variant="body" emphasis="emphasized">
            AnonymousUser47
          </AppText>
          <AppText variant="caption1" style={styles.profileCardText}>
            Rael Usre Nema | RaelUserNema@gmail.com
          </AppText>
          <AppText variant="footnote" style={styles.profileCardText}>
            View Activity
          </AppText>
        </View>
        <View style={styles.profileCardIcon}>
          <Image
            source={require('@/assets/icons/profileIconOPT.svg')}
            style={{ width: 49, height: 49, borderRadius: 40 }}
          />
        </View>
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
          leftIcon={require('@/assets/icons/paymentOPT.svg')}
          text="Payment"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/historyOPT.svg')}
          text="History"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/aboutOPT.svg')}
          text="About"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/feedbackOPT.svg')}
          text="Send Feedback"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/helpOPT.svg')}
          text="Help & FAQs"
          rightIcon={require('@/assets/icons/chevronRightOPT.svg')}
        />
        <MenuItem
          leftIcon={require('@/assets/icons/logOutOPT.svg')}
          text="Log Out"
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
  screenTitle: {
    alignItems: 'center',
    marginTop: 20,
  },
  profileCardContainer: {
    flexDirection: 'row',
    marginTop: rt.insets.top + 30,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
  },
  profileCardText: {
    marginTop: 4,
  },
  profileCardIcon: {
    paddingLeft: 10,
    justifyContent: 'center',
  },
  settingMenuCardContainer: {
    marginTop: rt.insets.top + 10,
    backgroundColor: theme.surface.primary,
    borderRadius: theme.radius.md,
    padding: theme.spacing.s4,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: theme.spacing.s3,
    paddingHorizontal: theme.spacing.s3,
  },
  menuItemText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  menuItemicon: {
    width: 15,
    height: 15,
  },
}));
