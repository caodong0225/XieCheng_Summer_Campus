import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { Dimensions, StatusBar, TouchableOpacity, View } from 'react-native';
import tw from 'twrnc';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface ImageViewerProps {
  imageUri: string;
}

export default function ImageViewer({ imageUri }: ImageViewerProps) {
  const router = useRouter();

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={tw`flex-1 bg-black`}>
      <StatusBar barStyle="light-content" />
      
      {/* 顶部工具栏 */}
      <View style={tw`absolute top-0 left-0 right-0 z-10 flex-row justify-between items-center px-4 pt-12 pb-4`}>
        <TouchableOpacity 
          onPress={handleClose}
          style={tw`bg-black/50 rounded-full p-2`}
        >
          <Ionicons name="close" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* 图片区域 */}
      <View style={tw`flex-1 justify-center items-center`}>
        <Image
          source={{ uri: imageUri }}
          style={tw`w-full h-full`}
          contentFit="contain"
        />
      </View>
    </View>
  );
} 