import React from 'react';
import { Stack, Tabs } from 'expo-router';
import {Image } from 'expo-image';

// const VolunteerTabsLayout = () => {
//   return (
//     <Tabs initialRouteName="home" screenOptions={{ headerShown: true, headerTitleAlign: 'center' }}>
//       <Tabs.Screen
//         name="home"
//         options={{
//           title: 'Home',
//           tabBarIcon: () => (
//             <Image
//               source={require('@/assets/icons/home.svg')}
//               style={{ width: 20, height: 20 }}
//               contentFit="contain"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="connect"
//         options={{
//           title: 'Connect',
//           tabBarIcon: () => (
//             <Image
//               source={require('@/assets/icons/connect.svg')}
//               style={{ width: 20, height: 20 }}
//               contentFit="contain"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="groups"
//         options={{
//           title: 'Groups',
//           tabBarIcon: () => (
//             <Image
//               source={require('@/assets/icons/groups.svg')}
//               style={{ width: 20, height: 20 }}
//               contentFit="contain"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="proTalk"
//         options={{
//           title: 'ProTalk',
//           tabBarIcon: () => (
//             <Image
//               source={require('@/assets/images/proTalkTemp.webp')}
//               style={{ width: 20, height: 20 }}
//               contentFit="contain"
//             />
//           ),
//         }}
//       />
//       <Tabs.Screen
//         name="settings"
//         options={{
//           title: 'Settings',
//           tabBarIcon: () => (
//             <Image
//               source={require('@/assets/icons/settings.svg')}
//               style={{ width: 20, height: 20 }}
//               contentFit="contain"
//             />
//           ),
//         }}
//       />
//     </Tabs>
//   );
// };

// export default VolunteerTabsLayout;


const VolunteerLayout = () => {
  return (
    <Stack screenOptions={{ headerShown: false, headerTitleAlign: 'center'}}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen 
        name="p2p-and" 
        options={{ 
          headerShown: true,
          title: 'Volunteer Connect'
        }} 
      />
    </Stack>
  );
};

export default VolunteerLayout;
