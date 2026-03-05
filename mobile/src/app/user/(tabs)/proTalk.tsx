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
    </View>
  );
};

export default ProTalk;
