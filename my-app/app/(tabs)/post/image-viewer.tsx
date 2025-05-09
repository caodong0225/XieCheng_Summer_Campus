import { useLocalSearchParams } from 'expo-router';
import ImageViewer from '../../components/ImageViewer';

export default function ImageViewerScreen() {
  const { images, initialIndex, title, content } = useLocalSearchParams<{ 
    images: string;
    initialIndex: string;
    title: string;
    content: string;
  }>();
  
  const parsedImages = JSON.parse(images);
  
  return (
    <ImageViewer 
      images={parsedImages} 
      initialIndex={parseInt(initialIndex)}
      title={title}
      content={content}
    />
  );
} 