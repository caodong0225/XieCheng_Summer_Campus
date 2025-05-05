import AsyncStorage from '@react-native-async-storage/async-storage';
// 或使用加密存储
// import * as Keychain from 'react-native-keychain';

const JWT_TOKEN_KEY = 'jobs:jwt_token';

// 基础版（使用 AsyncStorage）
export const storage = {
  setItem: async (key: string, value: string) => {
    try {
      await AsyncStorage.setItem(key, value);
    } catch (error) {
      console.error('Storage set error:', error);
    }
  },
  getItem: async (key: string) => {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error('Storage get error:', error);
      return null;
    }
  },
  removeItem: async (key: string) => {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error('Storage remove error:', error);
    }
  },
};

// 加密版（使用 react-native-keychain）
// export const secureStorage = {
//   setItem: async (key: string, value: string) => {
//     await Keychain.setGenericPassword(key, value, { service: key });
//   },
//   getItem: async (key: string) => {
//     const credentials = await Keychain.getGenericPassword({ service: key });
//     return credentials ? credentials.password : null;
//   },
//   removeItem: async (key: string) => {
//     await Keychain.resetGenericPassword({ service: key });
//   },
// };