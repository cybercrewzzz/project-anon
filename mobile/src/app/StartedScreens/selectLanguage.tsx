import { AppText } from '@/components/AppText';
import React from 'react';
import { View, Image, Button, Pressable } from 'react-native';
import { StyleSheet, withUnistyles } from 'react-native-unistyles';
import { LinearGradient } from 'expo-linear-gradient';

const GradientColors = withUnistyles(LinearGradient, theme => ({
  colors: theme.gradient.backgroundPrimary,
}));

const SelectLanguage = () => {
  const bannerImage = require('mobile/assets/images/banners/startBanner.png');
  const [appLanguage, setAppLanguage] = React.useState('english');

  return (

    <View style={styles.screen}>
      <GradientColors style={styles.gradient} />
      <View>
        <Image
          source={bannerImage}
          style={{ width: '100%', marginBottom: 20, marginTop: 20 }}
          resizeMode="contain"
        />
      </View>
      <View
        style={{
          flex: 1,
          justifyContent: 'space-between',
          backgroundColor: '#451246',
          padding: 10,
        }}
      >
        <View>
          <View>
            <AppText variant="sectionTitle" color="accent">
              Choose Your App Language:
            </AppText>
          </View>
          <View>
            <AppText variant="body" color="primary">
              Select the language you prefer for using the app. You can change
              this later in settings.
            </AppText>
          </View>
          <View style={styles.card}>
            <AppText variant="cardTitle" color="primary">
              App Interface Language
            </AppText>
            <View>
              <Pressable> <AppText> ABC</AppText></Pressable>
            </View>
          </View>
          <View style={styles.card}>
            <AppText variant="cardTitle" color="primary">
              How would you like to talk with others?
            </AppText>
            <View>
              <Button title="🌐 English (US)" onPress={() => {}} />
              <Button title="🌐 English (US)" onPress={() => {}} />
            </View>
          </View>
        </View>
        <View style={{ marginTop: 20, marginBottom: 40 }}>
          <Button title="Select Language" onPress={() => {}} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  screen: {
    flex: 1,
    paddingTop: rt.insets.top,
    paddingBottom: rt.insets.bottom,
    paddingLeft: rt.insets.left + 16,
    paddingRight: rt.insets.right + 16,
    backgroundColor: theme.background.default,
  },
  gradient: {
    position: 'absolute',
    inset: 0,
  },
  card: {
    backgroundColor: theme.surface.primary,
    padding: 10,
    borderRadius: 17,
    marginTop: 15,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
export default SelectLanguage;
