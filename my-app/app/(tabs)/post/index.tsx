import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { createNote } from '../../api/note';
import { newUpload } from '../../api/upload';

interface MediaItem {
  id: string;
  uri: string;
  type: 'image' | 'video';
  weight: number;
}

interface DragItemProps {
  item: MediaItem;
  drag: () => void;
  isActive: boolean;
}

export default function PostScreen() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Toast.show({
        type: 'error',
        text1: '权限请求',
        text2: '需要访问您的相册权限才能选择图片',
      });
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      try {
        // 设置上传状态
        setIsUploading(true);

        // Upload each selected media file immediately
        const uploadPromises = result.assets.map(async (asset, index) => {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          const uploadResult = await newUpload(file);

          console.log(uploadResult)
          
          if (uploadResult) {
            return {
              id: Math.random().toString(),
              uri: uploadResult.url, // 使用返回的完整URL
              type: asset.type === 'video' ? 'video' as const : 'image' as const,
              weight: mediaItems.length + index // 确保weight按顺序递增
            };
          } else {
            throw new Error(uploadResult.message || '上传失败');
          }
        });

        const newItems = await Promise.all(uploadPromises);
        const updatedMediaItems = [...mediaItems, ...newItems];
        setMediaItems(updatedMediaItems);
        setIsUploading(false);

        // 上传成功后显示提示
        Toast.show({
          type: 'success',
          text1: '上传成功',
          text2: `成功上传 ${newItems.length} 个文件！`,
        });

      } catch (error) {
        console.error('上传失败：', error);
        setIsUploading(false);
        Toast.show({
          type: 'error',
          text1: '上传失败',
          text2: '图片上传失败，请重试',
        });
      }
    }
  };

  const removeMedia = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };

  const handlePreview = (index: number) => {
    router.push({
      pathname: '/post/preview',
      params: {
        images: JSON.stringify(mediaItems),
        initialIndex: index.toString(),
        title: title,       // 新增标题参数
        content: content    // 新增内容参数
      }
    });
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Toast.show({
        type: 'error',
        text1: '提示',
        text2: '请输入标题',
      });
      return;
    }
    if (!content.trim()) {
      Toast.show({
        type: 'error',
        text1: '提示',
        text2: '请输入内容',
      });
      return;
    }
    if (mediaItems.length === 0) {
      Toast.show({
        type: 'error',
        text1: '提示',
        text2: '请至少添加一张图片',
      });
      return;
    }

    try {
      // 构造符合要求的数据格式，确保weight从0开始按顺序递增
      const noteData = {
        title: title.trim(),
        description: content.trim(),
        attachments: mediaItems.map((item, index) => ({
          type: 'picture',
          link: item.uri,
          weight: index // 使用当前数组索引作为weight，确保从0开始递增
        }))
      };

      console.log('发布数据：', noteData);
      const result = await createNote(noteData);
      
      // 检查API响应格式
      if (result && result.code === 200) {
        // 显示成功提示
        Toast.show({
          type: 'success',
          text1: '🎉 发布成功',
          text2: `${result.message || '游记创建成功！'}`,
          onShow: () => {
            // 如果开启自动跳转，2秒后自动跳转到游记详情页面
            setTimeout(() => {
              router.push({
                pathname: '/note-detail',
                params: {
                  noteId: result.data.noteId.toString()
                }
              });
            }, 1000);
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '发布失败',
          text2: result?.message || '发布失败，请稍后重试',
        });
      }
    } catch (error) {
      console.error('发布失败：', error);
      Toast.show({
        type: 'error',
        text1: '发布失败',
        text2: '发布失败，请稍后重试',
      });
    }
  };

  const renderMediaItem = ({ item, drag, isActive, getIndex }: any) => {
    const index = getIndex ? getIndex() : 0;
    return (
      <ScaleDecorator>
        <TouchableOpacity
          onLongPress={drag}
          disabled={isActive}
          style={tw`mb-2 flex-row items-center bg-white rounded-lg p-2 shadow`}
          onPress={() => handlePreview(index)}
        >
          <Image
            source={{ uri: item.uri }}
            style={tw`w-20 h-20 rounded mr-2`}
          />
          <View style={tw`flex-1`} />
          <TouchableOpacity onPress={() => removeMedia(item.id)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };


  return (
    <>
      <ScrollView style={tw`flex-1 bg-white`}>
        <View style={tw`px-4 py-3 border-b border-gray-100`}>
          <Text style={tw`text-lg font-bold text-center text-gray-800`}>发布游记</Text>
        </View>

        <View style={tw`p-4`}>
          <TextInput
            style={tw`text-xl font-bold mb-4 pb-2 border-b border-gray-200 text-gray-800`}
            placeholder="添加标题会被更多人看到"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={setTitle}
          />

          <TextInput
            style={tw`text-base min-h-[150px] p-3 border border-gray-200 rounded-lg mb-4 text-gray-700`}
            placeholder="分享你的旅行故事..."
            placeholderTextColor="#9CA3AF"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
          />

          <View style={tw`mb-4`}>
            <DraggableFlatList
              data={mediaItems}
              renderItem={renderMediaItem}
              keyExtractor={(item) => item.id}
              onDragEnd={({ data }) => {
                // 更新数据时重新设置weight
                const updatedData = data.map((item, index) => ({
                  ...item,
                  weight: index
                }));
                setMediaItems(updatedData);
              }}
              horizontal
              showsHorizontalScrollIndicator={false}
            />

            <TouchableOpacity 
              style={tw`w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg justify-center items-center mt-2 bg-gray-50 ${isUploading ? 'opacity-50' : ''}`}
              onPress={pickMedia}
              disabled={isUploading}
            >
              {isUploading ? (
                <View style={tw`items-center`}>
                  <Ionicons name="cloud-upload" size={32} color="#3B82F6" />
                  <Text style={tw`text-xs text-blue-500 mt-1`}>上传中...</Text>
                </View>
              ) : (
                <View style={tw`items-center`}>
                  <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
                  <Text style={tw`text-xs text-gray-500 mt-1`}>添加图片/视频</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          <View style={tw`flex-row gap-3`}>
            <TouchableOpacity 
              style={tw`flex-1 bg-gray-100 py-4 rounded-lg items-center`}
              activeOpacity={0.8}
              onPress={() => handlePreview(0)}
            >
              <Text style={tw`text-gray-600 text-base font-bold`}>预览</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={tw`flex-1 bg-blue-500 py-4 rounded-lg items-center shadow-sm`}
              activeOpacity={0.8}
              onPress={handlePublish}
            >
              <Text style={tw`text-white text-base font-bold`}>发布</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          visible={previewVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setPreviewVisible(false)}
        >
          <View style={tw`flex-1 bg-black`}>
            <TouchableOpacity 
              style={tw`absolute top-12 right-4 z-10 bg-black/50 rounded-full p-2`}
              onPress={() => setPreviewVisible(false)}
            >
              <Ionicons name="close" size={24} color="white" />
            </TouchableOpacity>
            
            <ScrollView 
              horizontal 
              pagingEnabled 
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                const newIndex = Math.round(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                setCurrentPreviewIndex(newIndex);
              }}
              style={tw`flex-1`}
            >
              {mediaItems.map((item, index) => (
                <View key={item.id} style={tw`w-full h-full justify-center items-center`}>
                  <Image
                    source={{ uri: item.uri }}
                    style={tw`w-full h-full`}
                    contentFit="contain"
                  />
                </View>
              ))}
            </ScrollView>

            <View style={tw`absolute bottom-8 left-0 right-0 flex-row justify-center`}>
              {mediaItems.map((_, index) => (
                <View
                  key={index}
                  style={tw`w-2 h-2 rounded-full mx-1 ${
                    index === currentPreviewIndex ? 'bg-white' : 'bg-white/50'
                  }`}
                />
              ))}
            </View>
          </View>
        </Modal>
      </ScrollView>
      <Toast />
    </>
  );
}