/** Backend error envelope: { statusCode, message, error? } */
export interface ApiErrorResponse {
  statusCode: number;
  message: string | string[];
  error?: string;
}

/** Account roles */
export type AccountRole = 'user' | 'volunteer' | 'admin';

/** Age range enum — matches backend AgeRange Prisma enum */
export type AgeRange =
  | 'range_16_20'
  | 'range_21_26'
  | 'range_27_plus';

/** Account object returned inside auth responses */
export interface Account {
  accountId: string;
  email: string;
  nickname: string;
  name?: string | null;
  roles: AccountRole[];
}

/** Auth response from POST /auth/register and POST /auth/login */
export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  account: Account;
}

/** Token refresh response from POST /auth/refresh */
export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

/** Generic paginated response wrapper */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}
