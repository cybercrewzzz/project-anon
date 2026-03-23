import React from 'react';
import { Tabs, useRouter } from 'expo-router';
import { Image } from 'expo-image';

const UserTabsLayout = () => {
  const router = useRouter();
  return (
    <Tabs
      initialRouteName="home"
      screenOptions={{ headerShown: false, tabBarHideOnKeyboard: true }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/icons/home.svg')}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="connect"
        options={{
          href: '/user/PeertoPeer/peertopeer',
          title: 'Connect',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/icons/connect.svg')}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="groups"
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
            router.push('/coming-soon');
          },
        }}
        options={{
          title: 'Groups',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/icons/groups.svg')}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="proTalk"
        listeners={{
          tabPress: (e: any) => {
            e.preventDefault();
            router.push('/coming-soon');
          },
        }}
        options={{
          title: 'ProTalk',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/images/proTalkTemp.webp')}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: '/user/userProfile/UserProfile',
          title: 'Settings',
          tabBarIcon: () => (
            <Image
              source={require('@/assets/icons/settings.svg')}
              style={{ width: 20, height: 20 }}
              contentFit="contain"
            />
          ),
        }}
      />
    </Tabs>
  );
};

export default UserTabsLayout;
