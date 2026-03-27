import { Platform } from 'react-native';
import { registerDeviceToken } from '@/api/account';

/**
 * Attempts to retrieve the device push token and register it with the backend.
 * Safe to call fire-and-forget — all errors are caught silently.
 *
 * NOTE: Requires `expo-notifications` to be installed for token retrieval.
 * Until it is installed, this function is a no-op.
 */
export async function tryRegisterPushToken(): Promise<void> {
  try {
    // Dynamically require expo-notifications so the app won't crash
    // if the package isn't installed yet.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    // eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
    const Notifications = require('expo-notifications') as any;

    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') return;

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const platform: 'ios' | 'android' | 'web' =
      Platform.OS === 'ios' ? 'ios'
      : Platform.OS === 'android' ? 'android'
      : 'web';

    await registerDeviceToken({ fcmToken: tokenData.data, platform });
  } catch {
    // Silently ignore — push token registration is best-effort
  }
}
