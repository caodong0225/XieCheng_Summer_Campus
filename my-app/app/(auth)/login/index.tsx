import { login } from '@/api/user';
import { setJwtToken } from '@/store/token';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';

export default function LoginScreen() {
  const [form, setForm] = useState({
    username: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!form.username || !form.password) {
        Toast.show({
            type: 'error',
            text1: '请填写完整信息',
          });
      return;
    }

    try {
      setLoading(true);
      const res = await login(form.username, form.password);
      
      if (res?.data?.token) {
        await setJwtToken(res.data.token);
        router.replace('/(tabs)/home'); // 登录成功跳转首页
      }
    } catch (error) {
      console.error('登录失败:', error);
      Toast.show({
        type: 'error',
        text1: (error as Error).message || '登录失败',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 p-4 bg-gray-100 justify-center`}>
      <Text style={tw`text-3xl font-bold mb-8 text-center text-blue-600`}>
        欢迎登录
      </Text>

      <View style={tw`bg-white p-6 rounded-lg shadow-sm`}>
        <TextInput
          style={tw`h-12 border border-gray-300 rounded-lg px-4 mb-4`}
          placeholder="用户名"
          value={form.username}
          onChangeText={text => setForm({ ...form, username: text })}
        />

        <TextInput
          style={tw`h-12 border border-gray-300 rounded-lg px-4 mb-6`}
          placeholder="密码"
          secureTextEntry
          value={form.password}
          onChangeText={text => setForm({ ...form, password: text })}
        />

        <TouchableOpacity
          style={tw`bg-blue-500 h-12 rounded-lg justify-center items-center`}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={tw`text-white text-lg font-medium`}>
            {loading ? '登录中...' : '立即登录'}
          </Text>
        </TouchableOpacity>

        <View style={tw`mt-4 flex-row justify-center`}>
          <Text style={tw`text-gray-600`}>没有账号？</Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
            <Text style={tw`text-blue-500 font-medium`}>立即注册</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast />
    </View>
    
  );
}