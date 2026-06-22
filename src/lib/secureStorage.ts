import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'attendance_app_access_token';
const REFRESH_TOKEN_KEY = 'attendance_app_refresh_token';

export const secureStorage = {
  async setTokens(accessToken: string, refreshToken: string) {
    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  },
  async getAccessToken() {
    return SecureStore.getItemAsync(TOKEN_KEY);
  },
  async getRefreshToken() {
    return SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
  },
  async removeTokens() {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
    await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  },
  async clearTokens() {
    await this.removeTokens();
  }
};
