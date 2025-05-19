import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Animated, Dimensions, StatusBar, Text, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';
import { createNote } from '../api/note';
import CustomAlert from './CustomAlert';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
  images: Array<{
    id: string;
    uri: string;
    type: 'image' | 'video';
    weight: number;
  }>;
  initialIndex: number;
  title?: string;
  content?: string;
  onClose?: () => void;
}

export default function ImageViewer({ images, initialIndex, title, content, onClose }: ImageViewerProps) {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [alertConfig, setAlertConfig] = useState<{
    visible: boolean;
    title: string;
    message?: string;
    buttons: Array<{
      text: string;
      onPress: () => void;
      style?: 'default' | 'cancel' | 'destructive';
    }>;
  }>({
    visible: false,
    title: '',
    buttons: []
  });

  const showAlert = (title: string, message: string, buttons: Array<{
    text: string;
    onPress: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>) => {
    setAlertConfig({
      visible: true,
      title,
      message,
      buttons
    });
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      router.back();
    }
  };

  const handleScroll = (event: any) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / SCREEN_WIDTH);
    if (newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
    }
  };

  const handleMoreOptions = () => {
    showAlert(
      '更多选项',
      '',
      [
        {
          text: '下载图片',
          onPress: () => handleDownload(images[currentIndex].uri)
        },
        {
          text: '投诉',
          onPress: handleReport
        },
        {
          text: '取消',
          style: 'cancel',
          onPress: () => {}
        }
      ]
    );
  };

  const handleDownload = async (imageUri: string) => {
    try {
      showAlert(
        '提示',
        '图片下载功能即将开放',
        [{ text: '确定', onPress: () => {} }]
      );
    } catch (error) {
      showAlert(
        '错误',
        '下载失败，请稍后重试',
        [{ text: '确定', onPress: () => {} }]
      );
    }
  };

  const handleReport = () => {
    showAlert(
      '投诉',
      '确定要投诉这张图片吗？',
      [
        {
          text: '取消',
          style: 'cancel',
          onPress: () => {}
        },
        {
          text: '确定',
          onPress: () => {
            showAlert(
              '提示',
              '投诉已提交',
              [{ text: '确定', onPress: () => {} }]
            );
          }
        }
      ]
    );
  };

  const handlePublish = async () => {
    if (!title || !content) {
      showAlert(
        '提示',
        '标题和内容不能为空',
        [{ text: '确定', onPress: () => {} }]
      );
      return;
    }

    try {
      const noteData = {
        title: title.trim(),
        description: content.trim(),
        attachments: images.map((item, index) => ({
          type: 'picture',
          link: item.uri,
          weight: index
        }))
      };

      const result = await createNote(noteData);
      
      if (result.success) {
        showAlert(
          '发布成功',
          '游记已成功发布',
          [
            {
              text: '确定',
              onPress: () => {
                router.replace('/(tabs)/profile/my-travels');
              }
            }
          ]
        );
      } else {
        showAlert(
          '发布失败',
          result.message || '发布失败，请稍后重试',
          [{ text: '确定', onPress: () => {} }]
        );
      }
    } catch (error) {
      console.error('发布失败：', error);
      showAlert(
        '发布失败',
        '发布失败，请稍后重试',
        [{ text: '确定', onPress: () => {} }]
      );
    }
  };

  return (
    <View style={tw`absolute inset-0 bg-black z-50`}>
      <StatusBar barStyle="light-content" backgroundColor="black" />
      
      {/* 顶部工具栏 */}
      <View style={tw`absolute top-12 left-0 right-0 z-10 flex-row justify-between items-center px-4`}>
        <TouchableOpacity onPress={handleClose}>
          <Ionicons name="close" size={30} color="white" />
        </TouchableOpacity>
        <View style={tw`flex-row items-center`}>
          <Ionicons name="images-outline" size={20} color="white" />
          <Text style={tw`text-white ml-2`}>{currentIndex + 1}/{images.length}</Text>
        </View>
        <TouchableOpacity onPress={handleMoreOptions}>
          <Ionicons name="ellipsis-horizontal" size={30} color="white" />
        </TouchableOpacity>
      </View>

      {/* 图片滑动区域 */}
      <Animated.ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentOffset={{ x: initialIndex * SCREEN_WIDTH, y: 0 }}
        style={tw`flex-1 bg-black`}
      >
        {images.map((image, index) => (
          <View 
            key={image.id}
            style={[
              tw`justify-center items-center bg-black`,
              { width: SCREEN_WIDTH, height: SCREEN_HEIGHT }
            ]}
          >
            <Image
              source={{ uri: image.uri }}
              style={tw`w-full h-full bg-black`}
              contentFit="contain"
              transition={200}
            />
          </View>
        ))}
      </Animated.ScrollView>

      {/* 底部指示器 */}
      <View style={tw`absolute bottom-8 left-0 right-0 flex-row justify-center`}>
        {images.map((_, index) => (
          <View
            key={index}
            style={tw`w-2 h-2 rounded-full mx-1 ${
              index === currentIndex ? 'bg-white' : 'bg-white/50'
            }`}
          />
        ))}
      </View>

      {/* 自定义 Alert */}
      <CustomAlert
        visible={alertConfig.visible}
        title={alertConfig.title}
        message={alertConfig.message}
        buttons={alertConfig.buttons}
        onDismiss={() => setAlertConfig(prev => ({ ...prev, visible: false }))}
      />
    </View>
  );
}