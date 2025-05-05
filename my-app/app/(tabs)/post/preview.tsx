import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useRef, useState } from 'react';
import { Dimensions, StatusBar, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Animated, {
    interpolate,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import tw from 'twrnc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const DotIndicator = ({ index, scrollX }: { index: number; scrollX: any }) => {
  const animatedDotStyle = useAnimatedStyle(() => {
    const input = [
      (index - 1) * SCREEN_WIDTH,
      index * SCREEN_WIDTH,
      (index + 1) * SCREEN_WIDTH,
    ];
    
    const scale = interpolate(
      scrollX.value,
      input,
      [1, 1.5, 1],
      'clamp'
    );
    
    const opacity = interpolate(
      scrollX.value,
      input,
      [0.5, 1, 0.5],
      'clamp'
    );
    
    return {
      transform: [{ scale: withTiming(scale) }],
      opacity: withTiming(opacity),
    };
  });

  return (
    <Animated.View
      style={[
        tw`w-2 h-2 rounded-full mx-1 bg-black`,
        animatedDotStyle,
      ]}
    />
  );
};

export default function PreviewScreen() {
  const router = useRouter();
  const { images, initialIndex } = useLocalSearchParams<{ 
    images: string;
    initialIndex: string;
  }>();
  
  const parsedImages = JSON.parse(images);
  const [currentIndex, setCurrentIndex] = useState(parseInt(initialIndex));
  const [description, setDescription] = useState('');
  const scrollX = useSharedValue(0);
  const scrollViewRef = useRef(null);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const handleClose = () => {
    router.back();
  };

  const handleScroll = (event: any) => {
    const newIndex = Math.round(event.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    setCurrentIndex(newIndex);
  };

  const handlePublish = async () => {
    try {
      // 这里添加发布逻辑
      const postData = {
        images: parsedImages,
        description,
        createdAt: new Date().toISOString(),
      };

      // TODO: 调用API发布内容
      console.log('发布内容:', postData);
      
      // 发布成功后返回上一页
      router.back();
    } catch (error) {
      console.error('发布失败:', error);
      // TODO: 显示错误提示
    }
  };

  const handleImagePress = () => {
    const currentImage = parsedImages[currentIndex];
    router.push({
      pathname: '/post/image-viewer',
      params: { imageUri: currentImage.uri }
    });
  };

  return (
    <View style={tw`flex-1 bg-white`}>
      <StatusBar barStyle="dark-content" />
      
      {/* 顶部工具栏 */}
      <View style={tw`flex-row justify-between items-center px-4 pt-12 pb-4 border-b border-gray-200`}>
        <TouchableOpacity 
          onPress={handleClose}
          style={tw`p-2`}
        >
          <Ionicons name="close" size={24} color="black" />
        </TouchableOpacity>
        <Text style={tw`text-base font-medium`}>预览</Text>
        <View style={tw`w-10`} />
      </View>

      {/* 图片预览区域 */}
      <View style={tw`flex-1`}>
        <Animated.ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          onMomentumScrollEnd={handleScroll}
          contentOffset={{ x: parseInt(initialIndex) * SCREEN_WIDTH, y: 0 }}
          style={tw`h-[50%]`}
        >
          {parsedImages.map((image: any, index: number) => (
            <TouchableOpacity 
              key={image.id} 
              onPress={handleImagePress}
              style={tw`w-[${SCREEN_WIDTH}px] h-full justify-center items-center`}
            >
              <Image
                source={{ uri: image.uri }}
                style={tw`w-full h-full`}
                contentFit="contain"
              />
            </TouchableOpacity>
          ))}
        </Animated.ScrollView>

        {/* 底部指示器 */}
        <View style={tw`flex-row justify-center py-2`}>
          {parsedImages.map((_: any, index: number) => (
            <DotIndicator key={index} index={index} scrollX={scrollX} />
          ))}
        </View>

        {/* 文字说明区域 */}
        <View style={tw`px-4 py-2`}>
          <TextInput
            multiline
            placeholder="添加文字说明..."
            value={description}
            onChangeText={setDescription}
            style={tw`min-h-[100px] text-base`}
          />
        </View>
      </View>

      {/* 底部发布按钮 */}
      <View style={tw`p-4 border-t border-gray-200`}>
        <TouchableOpacity
          onPress={handlePublish}
          style={tw`bg-blue-500 py-3 rounded-full`}
        >
          <Text style={tw`text-white text-center font-medium text-base`}>
            发布
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
} 