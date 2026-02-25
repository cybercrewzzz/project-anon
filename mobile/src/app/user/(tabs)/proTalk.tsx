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
        title="peer to peer"
        onPress={() => router.push('/user/PeertoPeer/peertopeer')}
      />


    </View>
  );
};

export default ProTalk;
