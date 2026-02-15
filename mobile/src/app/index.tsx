<<<<<<< HEAD
import { AppText } from '@/components/AppText';
import { Pressable, View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';

export default function Index() {
  return (
    <View style={styles.container}>
      <View>
        <AppText
          variant="screenTitle"
          color="primary"
          style={{ textAlign: 'center' }}
        >
          Welcome to Anora
        </AppText>
        <AppText variant="cardTitle" style={{ textAlign: 'center' }}>
          The Project Anon
        </AppText>
        <AppText style={{ textAlign: 'center' }}>
          - Proudly presented by SDGP-140 -
        </AppText>
      </View>
      <View>
        <AppText variant="screenTitle">screenTitle</AppText>
        <AppText variant="sectionTitle">sectionTitle</AppText>
        <AppText variant="cardTitle">cardTitle</AppText>
        <AppText variant="listHeader">listHeader</AppText>
        <AppText variant="body">body</AppText>
        <AppText variant="bodySecondary">bodySecondary</AppText>
        <AppText variant="caption">caption</AppText>
        <Pressable style={{backgroundColor: "#9500FF", padding: 15, borderRadius: 25, width: 300, alignItems: "center"}} onPress={() => router.push("/TnS")}>
          <AppText>Terms & Conditions</AppText>
        </Pressable>
      </View>
      <StatusBar />
    </View>
  );
}
=======
import React from 'react';
import { Redirect } from 'expo-router';
import { useRole } from '@/store/useRole';

const Index = () => {
  const role = useRole(state => state.role);
  if (role === 'user') return <Redirect href="/user/home" />;
  if (role === 'volunteer') return <Redirect href="/volunteer/home" />;
  if (!role) {
    console.log(
      'Add EXPO_PUBLIC_ROLE=user or EXPO_PUBLIC_ROLE=volunteer to mobile/.env file',
    );
  }
};
>>>>>>> main

export default Index;
