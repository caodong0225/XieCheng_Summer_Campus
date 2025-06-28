import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import Toast from 'react-native-toast-message';
import tw from 'twrnc';
import { deleteAttachment, deleteNote, getNoteDetail, updateNote } from '../../api/note';
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

export default function EditNoteScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [currentPreviewIndex, setCurrentPreviewIndex] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [originalNote, setOriginalNote] = useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // 获取游记详情
  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      const response = await getNoteDetail(id);
      if (response.code === 200) {
        const note = response.data;
        setOriginalNote(note);
        setTitle(note.title || '');
        setContent(note.description || '');
        
        // 转换附件为MediaItem格式
        const attachments = note.attachments || [];
        const mediaItems = attachments
          .sort((a: any, b: any) => a.weight - b.weight)
          .map((attachment: any) => ({
            id: attachment.id.toString(),
            uri: attachment.value,
            type: 'image' as const,
            weight: attachment.weight
          }));
        setMediaItems(mediaItems);
      } else {
        Toast.show({
          type: 'error',
          text1: '获取失败',
          text2: response.message || '获取游记详情失败',
        });
      }
    } catch (error) {
      console.error('获取游记详情失败：', error);
      Toast.show({
        type: 'error',
        text1: '获取失败',
        text2: '获取游记详情失败，请重试',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchNoteDetail();
    }
  }, [id]);

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
        setIsUploading(true);

        const uploadPromises = result.assets.map(async (asset, index) => {
          const response = await fetch(asset.uri);
          const blob = await response.blob();
          const file = new File([blob], 'image.jpg', { type: 'image/jpeg' });
          const uploadResult = await newUpload(file);

          console.log(uploadResult)
          
          if (uploadResult) {
            return {
              id: Math.random().toString(),
              uri: uploadResult.url,
              type: asset.type === 'video' ? 'video' as const : 'image' as const,
              weight: mediaItems.length + index
            };
          } else {
            throw new Error(uploadResult.message || '上传失败');
          }
        });

        const newItems = await Promise.all(uploadPromises);
        const updatedMediaItems = [...mediaItems, ...newItems];
        setMediaItems(updatedMediaItems);
        setIsUploading(false);

        // 编辑模式：立即调用updateNote API更新附件信息
        if (id) {
          try {
            const attachmentData = {
              type: 'picture',
              link: newItems[0].uri, // 使用第一个新上传的图片URL
              weight: mediaItems.length // 使用当前媒体项数量作为weight
            };

            console.log('添加附件数据：', attachmentData);
            const updateResult = await updateNote(id, attachmentData);
            
            if (updateResult && updateResult.code === 200) {
              Toast.show({
                type: 'success',
                text1: '上传成功',
                text2: `成功上传 ${newItems.length} 个文件并更新游记！`,
              });
            } else {
              Toast.show({
                type: 'error',
                text1: '上传成功',
                text2: `成功上传 ${newItems.length} 个文件，但更新游记失败`,
              });
            }
          } catch (updateError) {
            console.error('更新游记失败：', updateError);
            Toast.show({
              type: 'error',
              text1: '上传成功',
              text2: `成功上传 ${newItems.length} 个文件，但更新游记失败`,
            });
          }
        } else {
          // 新建模式：只显示上传成功提示
          Toast.show({
            type: 'success',
            text1: '上传成功',
            text2: `成功上传 ${newItems.length} 个文件！`,
          });
        }

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

  const removeMedia = async (id: string) => {
    try {
      // 检查是否是编辑模式（通过检查id是否为数字字符串来判断）
      const isEditMode = /^\d+$/.test(id);
      
      if (isEditMode) {
        // 编辑模式：调用API删除服务器上的图片
        const response = await deleteAttachment(id);
        if (response && response.code === 200) {
          // 从本地列表中移除
          setMediaItems(mediaItems.filter(item => item.id !== id));
          Toast.show({
            type: 'success',
            text1: '删除成功',
            text2: '图片已从服务器删除',
          });
        } else {
          Toast.show({
            type: 'error',
            text1: '删除失败',
            text2: response?.message || '删除图片失败，请重试',
          });
        }
      } else {
        // 新建模式：只从本地列表中移除
        setMediaItems(mediaItems.filter(item => item.id !== id));
      }
    } catch (error) {
      console.error('删除图片失败：', error);
      Toast.show({
        type: 'error',
        text1: '删除失败',
        text2: '删除图片失败，请重试',
      });
    }
  };

  const handlePreview = (index: number) => {
    router.push({
      pathname: '/post/preview',
      params: {
        images: JSON.stringify(mediaItems),
        initialIndex: index.toString(),
        title: title,
        content: content
      }
    });
  };

  const handleUpdate = async () => {
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
      // 只更新标题和描述，附件在添加时已经实时更新
      const noteData = {
        title: title.trim(),
        description: content.trim(),
      };

      console.log('更新游记数据：', noteData);
      const result = await updateNote(id, noteData);
      
      if (result && result.code === 200) {
        Toast.show({
          type: 'success',
          text1: '🎉 更新成功',
          text2: result.message || '游记更新成功！',
          onShow: () => {
            setTimeout(() => {
              router.push({
                pathname: '/profile/note-detail',
                params: { id: id }
              });
            }, 1000);
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '更新失败',
          text2: result?.message || '更新失败，请稍后重试',
        });
      }
    } catch (error) {
      console.error('更新失败：', error);
      Toast.show({
        type: 'error',
        text1: '更新失败',
        text2: '更新失败，请稍后重试',
      });
    }
  };

  const handleDeleteNote = () => {
    setShowDeleteModal(true);
  };

  const confirmDeleteNote = async () => {
    try {
      const result = await deleteNote(id);
      if (result && result.code === 200) {
        Toast.show({
          type: 'success',
          text1: '删除成功',
          text2: '游记已成功删除',
          onShow: () => {
            setTimeout(() => {
              router.push('/(tabs)/profile/my-travels');
            }, 1000);
          }
        });
      } else {
        Toast.show({
          type: 'error',
          text1: '删除失败',
          text2: result?.message || '删除游记失败，请重试',
        });
      }
    } catch (error) {
      console.error('删除游记失败：', error);
      Toast.show({
        type: 'error',
        text1: '删除失败',
        text2: '删除游记失败，请重试',
      });
    } finally {
      setShowDeleteModal(false);
    }
  };

  const cancelDeleteNote = () => {
    setShowDeleteModal(false);
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

  if (loading) {
    return (
      <View style={tw`flex-1 justify-center items-center bg-white`}>
        <Text>加载中...</Text>
      </View>
    );
  }

  return (
    <>
      <ScrollView style={tw`flex-1 bg-white`}>
        <View style={tw`px-4 py-3 border-b border-gray-100 flex-row items-center justify-between`}>
          <TouchableOpacity 
            onPress={() => router.back()}
            style={tw`p-1`}
          >
            <Ionicons name="arrow-back" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={tw`text-lg font-bold text-gray-800`}>编辑游记</Text>
          <TouchableOpacity 
            onPress={handleDeleteNote}
            style={tw`p-1`}
          >
            <Ionicons name="trash-outline" size={24} color="#ef4444" />
          </TouchableOpacity>
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
              onPress={handleUpdate}
            >
              <Text style={tw`text-white text-base font-bold`}>更新</Text>
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
      
      {/* 自定义删除确认对话框 */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={cancelDeleteNote}
      >
        <View style={tw`flex-1 bg-black bg-opacity-50 justify-center items-center`}>
          <View style={tw`bg-white rounded-lg p-6 mx-4 w-80`}>
            <View style={tw`items-center mb-4`}>
              <View style={tw`bg-red-100 rounded-full p-3 mb-3`}>
                <Ionicons name="trash-outline" size={32} color="#ef4444" />
              </View>
              <Text style={tw`text-lg font-bold text-gray-800`}>确认删除</Text>
            </View>
            
            <Text style={tw`text-gray-600 text-center mb-6`}>
              确定要删除这篇游记吗？删除后将无法恢复。
            </Text>
            
            <View style={tw`flex-row gap-3`}>
              <TouchableOpacity
                style={tw`flex-1 py-3 px-4 border border-gray-300 rounded-lg`}
                onPress={cancelDeleteNote}
              >
                <Text style={tw`text-center text-gray-700 font-medium`}>取消</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={tw`flex-1 py-3 px-4 bg-red-500 rounded-lg`}
                onPress={confirmDeleteNote}
              >
                <Text style={tw`text-center text-white font-medium`}>删除</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      
      <Toast />
    </>
  );
} 