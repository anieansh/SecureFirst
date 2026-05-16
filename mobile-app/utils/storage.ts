import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_KEY = '@securefirst_user';
const TOKEN_KEY = '@securefirst_token';

export const storage = {
  async saveUser(user: any) {
    try {
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Error saving user to storage', e);
    }
  },

  async getUser() {
    try {
      const user = await AsyncStorage.getItem(USER_KEY);
      return user ? JSON.parse(user) : null;
    } catch (e) {
      console.error('Error getting user from storage', e);
      return null;
    }
  },

  async saveToken(token: string) {
    try {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } catch (e) {
      console.error('Error saving token to storage', e);
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error getting token from storage', e);
      return null;
    }
  },

  async clearAll() {
    try {
      await AsyncStorage.removeItem(USER_KEY);
      await AsyncStorage.removeItem(TOKEN_KEY);
    } catch (e) {
      console.error('Error clearing storage', e);
    }
  }
};
