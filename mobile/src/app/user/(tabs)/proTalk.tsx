import { View, Text, Button, StyleSheet } from 'react-native';
import React from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

const ProTalk = () => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text>ProTalk</Text>
        <Button
          title="TnS Agreee"
          onPress={() => router.push('/user/TnS agree/TnS')}
        />
        <Button
          title="Special Notice"
          onPress={() => router.push('/user/Special Notice/specialnotice')}
        />
        <Button
          title="Peer to Peer"
          onPress={() => router.push('/user/PeertoPeer/peertopeer')}
        />
        <Button
          title="To User Profile"
          onPress={() => router.push('/user/userProfile/UserProfile')}
        />
        <Button
          title="To Waiting Screen"
          onPress={() => router.push('/user/WaitingScreen/waitingScreen')}
        />
        <Button
          title="To P2P-P2V-withCategory"
          onPress={() =>
            router.navigate('/user/p2p-p2v-withCategory/P2P-P2V-withCategory')
          }
        />
        <Button
          title="To Category Dropdown Filter"
          onPress={() =>
            router.push('/user/categorydropdownfilter/categorydropdownfilter')
          }
        />
        <Button
          title="Category Dropdown 1"
          onPress={() =>
            router.navigate('/user/categorydropdown1/categorydrop1')
          }
        />
      </View>
    </SafeAreaView>
  );
};

export default ProTalk;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
});
