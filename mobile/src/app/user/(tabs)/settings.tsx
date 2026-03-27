import { View, Text, Pressable } from 'react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/store/useAuth';
import { logout } from '@/api/auth';
import { tryRemovePushToken } from '@/utils/pushToken';

const Settings = () => {
  const router = useRouter();
  const refreshToken = useAuth(state => state.refreshToken);
  const signOut = useAuth(state => state.signOut);

  // TODO: Remove this temp button when permanent logout UI is built ;)
  const handleLogout = async () => {
    try {
      // Best-effort push token removal before clearing state
      await tryRemovePushToken();

      if (refreshToken) await logout(refreshToken);
    } catch {
      // Ignore API errors — still sign out locally
    } finally {
      await signOut();
      router.replace('/start/welcome' as any);
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
        onPress={handleLogout}
        style={{
          marginTop: 40,
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
