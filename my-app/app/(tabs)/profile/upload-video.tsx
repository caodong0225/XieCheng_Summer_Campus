import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Toast from 'react-native-toast-message';
import Video from 'react-native-video';
import tw from 'twrnc';
import { videoUploadWithProgress } from '../../api/upload';

interface VideoFile {
  uri: string;
  name: string;
  size: number;
  type: string;
}

export default function UploadVideoScreen() {
  const router = useRouter();
  const [selectedVideo, setSelectedVideo] = useState<VideoFile | null>(null);
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [videoPaused, setVideoPaused] = useState(true);
  const [isVideoLoading, setIsVideoLoading] = useState(false);
  const videoRef = useRef<any>(null);

  const pickVideo = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'video/*',
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        const videoFile: VideoFile = {
          uri: asset.uri,
          name: asset.name || 'video.mp4',
          size: asset.size || 0,
          type: asset.mimeType || 'video/mp4',
        };

        setSelectedVideo(videoFile);
        setVideoPaused(true); // 重置视频暂停状态
        setIsVideoLoading(true); // 开始加载新视频
      }
    } catch (error) {
      console.error('选择视频失败:', error);
      Alert.alert('错误', '选择视频文件失败');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2) + ' ' + sizes[i]);
  };

  const handleUpload = async () => {
    if (!selectedVideo) {
      Alert.alert('提示', '请先选择视频文件');
      return;
    }

    if (!description.trim()) {
      Alert.alert('提示', '请输入视频描述');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      // 创建 File 对象
      const response = await fetch(selectedVideo.uri);
      const blob = await response.blob();
      const file = new File([blob], selectedVideo.name, { type: selectedVideo.type });

      await videoUploadWithProgress(
        file,
        description.trim(),
        (progress) => {
          setUploadProgress(progress);
        }
      );

      Toast.show({
        type: 'success',
        text1: '上传成功',
        text2: '视频已成功上传',
      });

      // 上传成功后跳转到视频列表
      setTimeout(() => {
        router.push('/(tabs)/profile/my-videos');
      }, 1500);

    } catch (error: any) {
      console.error('上传失败:', error);
      Toast.show({
        type: 'error',
        text1: '上传失败',
        text2: error.message || '请重试',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setSelectedVideo(null);
    setDescription('');
    setUploadProgress(0);
    setVideoPaused(true);
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <Toast />
      
      {/* 头部 */}
      <View style={tw`flex-row items-center p-4 border-b border-gray-200 bg-white`}>
        <TouchableOpacity 
          onPress={() => router.back()} 
          style={tw`mr-4 p-1`}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={tw`text-lg font-semibold flex-1`}>上传视频</Text>
        {!uploading && (
          <TouchableOpacity
            onPress={resetForm}
            style={tw`p-2`}
          >
            <Ionicons name="refresh" size={20} color="#666" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={tw`flex-1 p-4`}>
        {/* 视频选择区域 */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold mb-3`}>选择视频</Text>
          
          {!selectedVideo ? (
            <TouchableOpacity
              style={tw`border-2 border-dashed border-gray-300 rounded-lg p-8 items-center justify-center bg-gray-50`}
              onPress={pickVideo}
              disabled={uploading}
            >
              <Ionicons name="videocam-outline" size={48} color="#666" style={tw`mb-3`} />
              <Text style={tw`text-gray-600 text-lg mb-2`}>点击选择视频</Text>
              <Text style={tw`text-gray-400 text-sm`}>支持 MP4、MOV、AVI 等格式</Text>
              <Text style={tw`text-gray-400 text-xs mt-1`}>最大 500MB</Text>
            </TouchableOpacity>
          ) : (
            <View style={tw`bg-gray-50 rounded-lg p-4`}>
              <View style={tw`flex-row items-center mb-3`}>
                <Ionicons name="videocam" size={24} color="#3b82f6" style={tw`mr-3`} />
                <View style={tw`flex-1`}>
                  <Text style={tw`font-medium text-gray-800`} numberOfLines={1}>
                    {selectedVideo.name}
                  </Text>
                  <Text style={tw`text-gray-500 text-sm`}>
                    {formatFileSize(selectedVideo.size)}
                  </Text>
                </View>
                {!uploading && (
                  <TouchableOpacity
                    onPress={pickVideo}
                    style={tw`p-2`}
                  >
                    <Ionicons name="refresh" size={20} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
              
              {/* 视频预览区域 */}
              <View style={tw`w-full h-48 rounded-lg overflow-hidden mb-3 bg-gray-200 relative`}>
                <TouchableOpacity
                  activeOpacity={1}
                  style={tw`w-full h-full`}
                  onPress={() => setVideoPaused(!videoPaused)}
                  disabled={uploading}
                >
                  {/* 视频加载指示器 */}
                  {isVideoLoading && (
                    <View style={tw`absolute inset-0 bg-black bg-opacity-20 justify-center items-center`}>
                      <ActivityIndicator size="large" color="#3b82f6" />
                    </View>
                  )}
                  
                  <Video
                    ref={videoRef}
                    source={{ uri: selectedVideo.uri }}
                    style={tw`w-full h-full`}
                    resizeMode="cover"
                    repeat={true}
                    paused={videoPaused || uploading}
                    controls={false}
                    onLoad={() => setIsVideoLoading(false)}
                    onError={(error) => {
                      console.error('视频预览错误:', error);
                      setIsVideoLoading(false);
                      Alert.alert('错误', '无法加载视频预览');
                    }}
                  />
                  
                  {/* 视频播放控制覆盖层 */}
                  {(videoPaused || isVideoLoading) && (
                    <View style={tw`absolute inset-0 bg-black bg-opacity-30 justify-center items-center`}>
                      <Ionicons 
                        name={isVideoLoading ? "refresh" : "play"} 
                        size={48} 
                        color="white" 
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              
              {/* 视频控制按钮 */}
              <View style={tw`flex-row justify-center gap-4`}>
                <TouchableOpacity
                  onPress={() => setVideoPaused(!videoPaused)}
                  style={tw`bg-blue-500 px-4 py-2 rounded-full`}
                  disabled={uploading}
                >
                  <Ionicons 
                    name={videoPaused ? "play" : "pause"} 
                    size={20} 
                    color="white" 
                  />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => {
                    if (videoRef.current) {
                      videoRef.current.seek(0);
                      setVideoPaused(true);
                    }
                  }}
                  style={tw`bg-gray-300 px-4 py-2 rounded-full`}
                  disabled={uploading}
                >
                  <Ionicons name="refresh" size={20} color="black" />
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* 视频描述 */}
        <View style={tw`mb-6`}>
          <Text style={tw`text-lg font-semibold mb-3`}>视频描述</Text>
          <TextInput
            style={tw`border border-gray-300 rounded-lg p-3 text-base min-h-[100px]`}
            placeholder="请输入视频描述..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            maxLength={250}
            editable={!uploading}
            placeholderTextColor="#999"
          />
          <Text style={tw`text-gray-400 text-xs mt-1 text-right`}>
            {description.length}/500
          </Text>
        </View>

        {/* 上传进度 */}
        {uploading && (
          <View style={tw`mb-6`}>
            <Text style={tw`text-lg font-semibold mb-3`}>上传进度</Text>
            <View style={tw`bg-gray-200 rounded-full h-3 mb-2`}>
              <View 
                style={[tw`bg-blue-500 h-3 rounded-full`, { width: `${uploadProgress}%` }]}
              />
            </View>
            <Text style={tw`text-center text-gray-600`}>
              {uploadProgress.toFixed(1)}%
            </Text>
          </View>
        )}

        {/* 上传按钮 */}
        <TouchableOpacity
          style={tw`bg-blue-500 p-4 rounded-lg ${(!selectedVideo || uploading) ? 'opacity-50' : ''}`}
          onPress={handleUpload}
          disabled={!selectedVideo || uploading}
        >
          <View style={tw`flex-row items-center justify-center`}>
            {uploading ? (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-medium`}>上传中...</Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="white" style={tw`mr-2`} />
                <Text style={tw`text-white font-medium`}>开始上传</Text>
              </>
            )}
          </View>
        </TouchableOpacity>

        {/* 提示信息 */}
        <View style={tw`mt-6 p-4 bg-blue-50 rounded-lg`}>
          <Text style={tw`text-blue-800 font-medium mb-2`}>上传提示：</Text>
          <Text style={tw`text-blue-700 text-sm mb-1`}>• 支持 MP4、MOV、AVI 等常见视频格式</Text>
          <Text style={tw`text-blue-700 text-sm mb-1`}>• 单个文件最大 500MB</Text>
          <Text style={tw`text-blue-700 text-sm mb-1`}>• 上传过程中请保持网络连接</Text>
          <Text style={tw`text-blue-700 text-sm`}>• 视频会自动生成缩略图</Text>
        </View>
      </ScrollView>
    </View>
  );
}