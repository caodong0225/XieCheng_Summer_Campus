import { getUserById, updateMeUserExt } from '@/api/user';
import { clearLoginToken, getUser } from '@/store/token';
import { getAvatar } from '@/utils/string';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { Image, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';

export default function ProfileScreen() {
  const [userInfo, setUserInfo] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isChanged, setIsChanged] = useState(false);
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserInfo();
  }, []);

  const loadUserInfo = async () => {
    try {
      const user = await getUser();
      if (user) {
        const userData = await getUserById(user.id);
        setUserInfo(userData);
        setBio(userData?.userExtraInfo?.description || '');
      }
    } catch (error) {
      console.error('加载用户信息失败:', error);
      Toast.show({
        type: 'error',
        text1: '加载用户信息失败',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBio = async () => {
    try {
      await updateMeUserExt({ "description": bio });
      setIsEditing(false);
      Toast.show({
        type: 'success',
        text1: '个人介绍已更新',
      });
      setIsChanged(false);
      loadUserInfo();
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '更新失败，请重试',
      });
    }
  };

  const handleLogout = async () => {
    try {
      await clearLoginToken();
      router.replace('/(auth)/login');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: '退出登录失败',
      });
    }
  };

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center`}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <>
    <Toast />
    <ScrollView style={tw`flex-1 bg-white`}>
      <View style={tw`p-4`}>
        {/* 个人信息卡片 */}
        <View style={tw`bg-gray-50 rounded-lg p-4 mb-4`}>
          <View style={tw`flex-row items-center mb-4`}>
            <Image
              source={{ uri: getAvatar(userInfo) }}
              style={tw`w-16 h-16 rounded-full mr-4`}
            />
            <View style={tw`flex-1 flex-wrap`}>
              <Text style={tw`text-2xl font-bold flex-wrap`}>{userInfo?.username || '用户'}</Text>
              <Text style={tw`text-gray-600 flex-wrap`}>{userInfo?.email}</Text>
            </View>
          </View>
          
          {isEditing ? (
            <View>
              <TextInput
                style={tw`border border-gray-300 rounded-lg p-2 mb-2`}
                multiline
                numberOfLines={4}
                value={bio}
                onChangeText={(text) => {
                  setBio(text);
                  if (text !== userInfo?.userExtraInfo?.description) {
                    setIsChanged(true);
                  } else {
                    setIsChanged(false);
                  }
                }}
                placeholder= {userInfo?.userExtraInfo?.description || '请输入个人介绍'}
              />
              <View style={tw`flex-row justify-end`}>
                <TouchableOpacity
                  style={tw`bg-gray-200 px-4 py-2 rounded-lg mr-2`}
                  onPress={() => setIsEditing(false)}
                >
                  <Text>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={tw`bg-blue-500 px-4 py-2 rounded-lg ${!isChanged ? 'opacity-50' : ''}`}
                  disabled={!isChanged}
                  onPress={handleUpdateBio}
                >
                  <Text style={tw`text-white`}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View>
              <Text style={tw`text-gray-700 mb-2`}>{userInfo?.userExtraInfo?.description || '这个人很懒，什么都没写~'}</Text>
              <TouchableOpacity
                style={tw`bg-blue-500 px-4 py-2 rounded-lg self-start`}
                onPress={() => setIsEditing(true)}
              >
                <Text style={tw`text-white`}>编辑个人介绍</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 我的游记 */}
        <TouchableOpacity
          style={tw`bg-white p-4 rounded-lg border border-gray-200 mb-4`}
          onPress={() => router.push('/(tabs)/profile/my-travels')}
        >
          <Text style={tw`text-lg font-semibold`}>我的游记</Text>
          <Text style={tw`text-gray-500`}>查看我发布的游记</Text>
        </TouchableOpacity>

        {/* 应用信息 */}
        <TouchableOpacity
          style={tw`bg-white p-4 rounded-lg border border-gray-200 mb-4`}
          onPress={() => router.push('/(tabs)/profile/about')}
        >
          <Text style={tw`text-lg font-semibold`}>关于应用</Text>
          <Text style={tw`text-gray-500`}>版本信息、使用说明等</Text>
        </TouchableOpacity>

        {/* 退出登录 */}
        <TouchableOpacity
          style={tw`bg-red-500 p-4 rounded-lg`}
          onPress={handleLogout}
        >
          <Text style={tw`text-white text-center font-semibold`}>退出登录</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </>
  );
}