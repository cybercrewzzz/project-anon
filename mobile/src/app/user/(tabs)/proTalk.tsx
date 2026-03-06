import { View, Text, Button } from 'react-native';
import React from 'react';
import { router } from 'expo-router';

const ProTalk = () => {
  return (
    <View>
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
    </View>
  );
};

export default ProTalk;
