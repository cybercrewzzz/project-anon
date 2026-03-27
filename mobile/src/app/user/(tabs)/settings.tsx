import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useUnistyles } from 'react-native-unistyles';
import { useRouter, Href } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { logout } from '@/api/auth';

const Settings = () => {
  const router = useRouter();
  const { theme } = useUnistyles();
  const refreshToken = useAuth(state => state.refreshToken);
  const signOut = useAuth(state => state.signOut);

  // TODO: Remove this temp button when permanent logout UI is built ;)
  const handleLogout = async () => {
    try {
      if (refreshToken) await logout(refreshToken);
    } catch {
      // Ignore API errors — still sign out locally
    } finally {
      await signOut();
      router.replace('/start/welcome');
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
      }}
    >
      <Text>Settings</Text>

      <Pressable
        onPress={() => router.push('/user/changePassword' as Href)}
        style={{
          marginTop: 40,
          backgroundColor: theme.action.primary,
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: theme.action.onPrimary, fontWeight: '700', fontSize: 16 }}>
          🔑 Change Password
        </Text>
      </Pressable>

      <Pressable
        onPress={handleLogout}
        style={{
          marginTop: 20,
          backgroundColor: '#DC2626',
          paddingVertical: 14,
          paddingHorizontal: 32,
          borderRadius: 12,
        }}
      >
        <Text style={{ color: '#fff', fontWeight: '700', fontSize: 16 }}>
          🚪 Logout (Dev)
        </Text>
      </Pressable>
    </View>
  );
};

export default Settings;
