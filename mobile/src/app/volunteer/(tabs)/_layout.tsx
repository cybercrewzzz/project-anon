import React from 'react';
import { Tabs } from 'expo-router';

const VolunteerTabsLayout = () => {
  return (
    <Tabs initialRouteName="home" screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="connect" options={{ title: 'Connect' }} />
      <Tabs.Screen name="groups" options={{ title: 'Groups' }} />
      <Tabs.Screen name="proTalk" options={{ title: 'ProTalk' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
};

export default VolunteerTabsLayout;
