import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Modal, ScrollView, Text, TextInput, TouchableOpacity, View } from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
import tw from 'twrnc';

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

  const pickMedia = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      alert('需要访问您的相册权限才能选择图片');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.All,
      allowsEditing: true,
      quality: 1,
      allowsMultipleSelection: true,
    });

    if (!result.canceled) {
      const newItems = result.assets.map((asset, index) => ({
        id: Math.random().toString(),
        uri: asset.uri,
        type: asset.type === 'video' ? 'video' as const : 'image' as const,
        weight: mediaItems.length + index
      }));
      setMediaItems([...mediaItems, ...newItems]);
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
        initialIndex: index.toString()
      }
    });
  };

  const handlePublish = () => {
    if (!title.trim()) {
      alert('请输入标题');
      return;
    }
    if (!content.trim()) {
      alert('请输入内容');
      return;
    }
    if (mediaItems.length === 0) {
      alert('请至少添加一张图片');
      return;
    }
    // TODO: 实现发布逻辑
    console.log('发布内容：', {
      title,
      content,
      mediaItems
    });
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
          <Text style={tw`flex-1`} numberOfLines={1}>{item.uri.split('/').pop()}</Text>
          <TouchableOpacity onPress={() => removeMedia(item.id)}>
            <Ionicons name="close-circle" size={24} color="red" />
          </TouchableOpacity>
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };


  return (
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
            style={tw`w-24 h-24 border-2 border-dashed border-gray-300 rounded-lg justify-center items-center mt-2 bg-gray-50`}
            onPress={pickMedia}
          >
            <Ionicons name="add-circle-outline" size={32} color="#9CA3AF" />
            <Text style={tw`text-xs text-gray-500 mt-1`}>添加图片/视频</Text>
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
  );
}