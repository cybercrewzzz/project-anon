import { apiClient } from './client';
import { parseApiError } from './errors';

export interface Language {
  code: string;
  name: string;
  nativeName?: string;
}

export async function getLanguages(): Promise<Language[]> {
  try {
    const { data } = await apiClient.get<Language[]>('/account/languages');
    return data;
  } catch (error) {
    throw parseApiError(error);
  }
}
