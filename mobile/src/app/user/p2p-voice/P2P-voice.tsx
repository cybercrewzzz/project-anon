import { View, Text, StyleSheet } from 'react-native';
import React from 'react';

const P2PVoice = () => {
  return (
    <View style={styles.container}>
      <Text>P2P Voice Screen</Text>
    </View>
  );
};

export default P2PVoice;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
