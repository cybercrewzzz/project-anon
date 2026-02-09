import { AppText } from '@/components/AppText';
import { Button, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <View>
        <AppText
          variant="largeTitle"
          color="primary"
          emphasis="emphasized"
          style={{ textAlign: 'center' }}
        >
          Welcome to Anora
        </AppText>
        <AppText variant="title1" style={{ textAlign: 'center' }}>
          The Project Anon
        </AppText>
        <AppText style={{ textAlign: 'center' }}>
          - Proudly presented by SDGP-140 -
        </AppText>
      </View>
      <View>
        <AppText variant="largeTitle">largeTitle</AppText>
        <AppText variant="title1">title1</AppText>
        <AppText variant="title2">title2</AppText>
        <AppText variant="title3">title3</AppText>
        <AppText variant="headline">headline</AppText>
        <AppText variant="body">body</AppText>
<<<<<<< HEAD
        <AppText variant="bodySecondary">bodySecondary</AppText>
        <AppText variant="caption">caption</AppText>
        <Button
          title="welcome" 
          onPress={() => router.navigate('/StartedScreen/welcome')}
        />
=======
        <AppText variant="callout">callout</AppText>
        <AppText variant="subhead">subhead</AppText>
        <AppText variant="footnote">footnote</AppText>
        <AppText variant="caption1">caption1</AppText>
        <AppText variant="caption2">caption2</AppText>
>>>>>>> main
      </View>
      <StatusBar />
    </View>
  );
}

const styles = StyleSheet.create((theme, rt) => ({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.background.default,
    marginTop: rt.insets.top,
    gap: 50,
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
