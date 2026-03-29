import { Image, ImageSource } from 'expo-image';
import { View, Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { AppText } from '../AppText';

interface ChatScreenHeaderProps {
  profilePicture: ImageSource;
  name: string;
  roleTag: string;
  rating: string;
  /** Optional callback — when provided, shows a "!" icon to block the user */
  onBlockPress?: () => void;
}

export default function ChatScreenHeader({
  name,
  profilePicture,
  roleTag,
  rating,
  onBlockPress,
}: ChatScreenHeaderProps) {
  return (
    <View style={styles.header}>
      <View style={styles.avatar}>
        <Image source={profilePicture} style={styles.profilePicture} />
      </View>
      <View style={styles.headerDetails}>
        <View style={styles.nameContainer}>
          <AppText variant="callout" emphasis="emphasized">
            {name}
          </AppText>
          <Image
            source={require('@/assets/icons/saveVolunteer.svg')}
            style={styles.saveVolunteer}
          />
          {/* Block icon — only rendered when callback is provided */}
          {onBlockPress && (
            <Pressable
              onPress={onBlockPress}
              hitSlop={8}
              style={styles.blockButton}
            >
              <Image
                source={require('@/assets/icons/blockUser.svg')}
                style={styles.blockIcon}
                contentFit="contain"
              />
            </Pressable>
          )}
        </View>
        <View style={styles.tagContainer}>
          <View style={styles.roleTag}>
            <AppText variant="caption2" emphasis="emphasized" color="secondary">
              {roleTag}
            </AppText>
          </View>
          <View style={styles.ratingTag}>
            <Image
              source={require('@/assets/icons/ratingStar.svg')}
              style={styles.ratingImage}
              contentFit="contain"
            />
            <AppText variant="caption2" emphasis="emphasized">
              {rating}
            </AppText>
          </View>
        </View>
      </View>
      <View>
        <Image
          source={require('@/assets/icons/call.svg')}
          style={styles.call}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.s5,
    backgroundColor: theme.surface.chatSurface,
    padding: theme.spacing.s3,
    borderRadius: theme.radius.full,
    marginHorizontal: theme.spacing.s4,
  },
  avatar: {
    borderRadius: theme.radius.full,
    overflow: 'hidden',
  },
  profilePicture: {
    width: 50,
    height: 50,
  },
  headerDetails: {
    flex: 1,
    justifyContent: 'center',
    gap: theme.spacing.s3,
  },
  nameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.s3,
  },
  saveVolunteer: {
    width: 18,
    height: 18,
  },
  blockButton: {
    padding: theme.spacing.s1,
  },
  blockIcon: {
    width: 18,
    height: 18,
    tintColor: theme.state.warning,
  },
  tagContainer: {
    flexDirection: 'row',
    gap: theme.spacing.s3,
    alignItems: 'center',
  },
  roleTag: {
    backgroundColor: theme.surface.chatBubbleIncoming,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s1 + theme.spacing.s3,
    borderRadius: theme.radius.full,
  },
  ratingTag: {
    backgroundColor: theme.surface.primary,
    paddingVertical: theme.spacing.s2,
    paddingHorizontal: theme.spacing.s1 + theme.spacing.s3,
    borderRadius: theme.radius.full,
    gap: theme.spacing.s3,
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingImage: {
    width: 12,
    height: 12,
  },
  call: {
    width: 50,
    height: 50,
  },
}));
