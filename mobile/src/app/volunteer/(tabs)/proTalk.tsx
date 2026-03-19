import { View } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import Button from '@/components/button';
import { AppText } from '@/components/AppText';
import { StyleSheet } from 'react-native-unistyles';

const ProTalk = () => {
  return (
    <View style={styles.container}>
      <AppText variant="title1" emphasis="emphasized" color="accent">
        ProTalk
      </AppText>
      <View style={styles.buttonsContainer}>
        <Button
          text="Open Peer to Peer"
          onPress={() => router.push('/volunteer/P2p-And/p2p-and')}
        />
        <Button
          text="To Specialisation Dropdown Filter"
          onPress={() =>
            router.push('/volunteer/Specialisations/specialisationFilter')
          }
        />
      </View>
    </View>
  );
};

export default ProTalk;

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    backgroundColor: theme.background.default,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing.s7,
    paddingHorizontal: theme.spacing.s5,
  },
  buttonsContainer: {
    alignSelf: 'stretch',
    gap: theme.spacing.s4,
  },
}));
