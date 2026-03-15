export type AccountStatus = 'active' | 'suspended' | 'banned' | 'deleted';
export type Gender = 'male' | 'female' | 'non_binary' | 'prefer_not_to_say';
export type Role = 'user' | 'volunteer' | 'admin';
export type DevicePlatform = 'ios' | 'android' | 'web';

export interface Account {
  accountId: string;
  email: string;
  passwordHash: string | null;
  oauthProvider: string | null;
  oauthId: string | null;
  name: string | null;
  nickname: string | null;
  dateOfBirth: string;
  gender: Gender;
  interfaceLanguageId: string;
  status: AccountStatus;
  roles: Role[];
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}

export interface RefreshToken {
  tokenId: string;
  accountId: string;
  tokenHash: string;
  expiresAt: string;
  isRevoked: boolean;
  familyId: string;
}

export interface DeviceToken {
  deviceId: string;
  accountId: string;
  fcmToken: string;
  platform: DevicePlatform;
  lastActiveAt: string;
}

export interface Language {
  languageId: string;
  code: string;
  name: string;
}

export interface AccountLanguage {
  accountId: string;
  languageId: string;
}

export interface AccountDataStore {
  accounts: Account[];
  refreshTokens: RefreshToken[];
  deviceTokens: DeviceToken[];
  languages: Language[];
  accountLanguages: AccountLanguage[];
}
