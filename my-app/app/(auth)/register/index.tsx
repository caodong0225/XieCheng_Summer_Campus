import { register } from '@/api/user';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    username: '',
    password: '',
    email: '',
  });
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    if (!form.username || !form.password || !form.email) {
        Toast.show({
            type: 'error',
            text1: "请填写所有字段",
          });
      return false;
    }
    if (form.password.length < 6) {
        Toast.show({
            type: 'error',
            text1: "密码至少需要6位",
          });
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        Toast.show({
            type: 'error',
            text1: "邮箱格式不正确",
          });
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);
      await register(form.username, form.password, form.email);
      // 使用Toast
      Toast.show({
        type: 'success',
        text1: "注册成功",
        onPress: () => router.back(),
      })
      // 自动退回登录页面
      router.back();
    } catch (error) {
        console.error('注册失败:', error);
        Toast.show({
          type: 'error',
          text1: (error as Error).message || '注册失败' // 明确断言类型
        })
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={tw`flex-1 p-4 bg-gray-100 justify-center`}>
      <Text style={tw`text-3xl font-bold mb-8 text-center text-green-600`}>
        新用户注册
      </Text>

      <View style={tw`bg-white p-6 rounded-lg shadow-sm`}>
        <TextInput
          style={tw`h-12 border border-gray-300 rounded-lg px-4 mb-4`}
          placeholder="用户名"
          value={form.username}
          onChangeText={text => setForm({ ...form, username: text })}
        />

        <TextInput
          style={tw`h-12 border border-gray-300 rounded-lg px-4 mb-4`}
          placeholder="邮箱"
          keyboardType="email-address"
          value={form.email}
          onChangeText={text => setForm({ ...form, email: text })}
        />

        <TextInput
          style={tw`h-12 border border-gray-300 rounded-lg px-4 mb-6`}
          placeholder="密码（至少6位）"
          secureTextEntry
          value={form.password}
          onChangeText={text => setForm({ ...form, password: text })}
        />

        <TouchableOpacity
          style={tw`bg-green-500 h-12 rounded-lg justify-center items-center`}
          onPress={handleRegister}
          disabled={loading}
        >
          <Text style={tw`text-white text-lg font-medium`}>
            {loading ? '注册中...' : '立即注册'}
          </Text>
        </TouchableOpacity>

        <View style={tw`mt-4 flex-row justify-center`}>
          <Text style={tw`text-gray-600`}>已有账号？</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={tw`text-green-500 font-medium`}>返回登录</Text>
          </TouchableOpacity>
        </View>
      </View>
      <Toast/>
    </View>
  );
}