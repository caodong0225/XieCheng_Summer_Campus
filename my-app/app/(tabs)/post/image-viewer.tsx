import { useLocalSearchParams } from 'expo-router';
import ImageViewer from '../../components/ImageViewer';

export default function ImageViewerScreen() {
  const { imageUri } = useLocalSearchParams<{ imageUri: string }>();
  
  return <ImageViewer imageUri={imageUri} />;
} 