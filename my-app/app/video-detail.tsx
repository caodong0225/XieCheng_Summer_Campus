import { AntDesign, Feather, Ionicons } from '@expo/vector-icons';
import { Image as ExpoImage } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import tw from 'twrnc';
import { collectVideo, getVideoById, likeVideo, watchVideo } from './api/video';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type VideoDetail = {
  id: number;
  created_at: string;
  description: string;
  link: string;
  thumbnail: string;
  likeCount: number;
  collectionCount: number;
  isCollected: boolean;
  isLiked: boolean;
  viewCount: {
    totalViews: string;
    uniqueUsers: number;
  };
};

export default function VideoDetailScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  
  const [video, setVideo] = useState<VideoDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [paused, setPaused] = useState<boolean>(false);
  const [videoLoading, setVideoLoading] = useState<boolean>(true);
  const [hasWatched, setHasWatched] = useState(false);
  
  const videoRef = useRef<any>(null);

  // 加载视频详情
  useEffect(() => {
    if (videoId) {
      fetchVideoDetail();
    }
  }, [videoId]);

  const fetchVideoDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getVideoById(parseInt(videoId));
      
      if (response.success && response.data) {
        setVideo(response.data);
      } else {
        setError(response.message || '获取视频详情失败');
      }
    } catch (err) {
      setError('获取视频详情时发生错误');
      console.error('Error fetching video detail:', err);
    } finally {
      setLoading(false);
    }
  };

  // 发送观看请求
  const sendWatchRequest = async (videoId: number) => {
    if (hasWatched) return;
    
    try {
      setHasWatched(true);
      const response = await watchVideo(videoId);
      if (response.success) {
        console.log('观看视频成功:', videoId);
      } else {
        console.error('观看视频失败:', videoId, response.message);
      }
    } catch (err) {
      console.error('观看请求错误:', videoId, err);
    }
  };

  // 点赞视频
  const handleLike = async () => {
    if (!video) return;
    
    try {
      const response = await likeVideo(video.id);
      if (response.success && response.data) {
        setVideo(prev => prev ? {
          ...prev,
          isLiked: response.data.favorited,
          likeCount: response.data.favoriteCount
        } : null);
      } else {
        Alert.alert('提示', response.message || '操作失败，请重试');
      }
    } catch (err) {
      Alert.alert('提示', '操作失败，请重试');
    }
  };

  // 收藏视频
  const handleCollect = async () => {
    if (!video) return;
    
    try {
      const response = await collectVideo(video.id);
      if (response.success && response.data) {
        setVideo(prev => prev ? {
          ...prev,
          isCollected: response.data.collected,
          collectionCount: response.data.collectionCount
        } : null);
      } else {
        Alert.alert('提示', response.message || '操作失败，请重试');
      }
    } catch (err) {
      Alert.alert('提示', '操作失败，请重试');
    }
  };

  const formatCount = (count: string | number) => {
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  const handleVideoLoad = async () => {
    console.log('视频加载完成');
    setVideoLoading(false);
    setPaused(false);
    if (video && !hasWatched) {
      await sendWatchRequest(video.id);
    }
  };

  const handleVideoError = (error: any) => {
    console.error('视频播放错误:', error);
    setVideoLoading(false);
    Alert.alert('错误', '视频播放失败，请检查网络连接');
  };

  if (loading) {
    return (
      <View style={[styles.container, tw`justify-center items-center`]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={tw`text-white mt-4`}>加载中...</Text>
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={[styles.container, tw`justify-center items-center`]}>
        <Ionicons name="alert-circle-outline" size={64} color="#fff" style={tw`mb-4`} />
        <Text style={tw`text-white text-lg mb-4`}>{error || '视频不存在'}</Text>
        <TouchableOpacity 
          style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
          onPress={fetchVideoDetail}
        >
          <Text style={tw`text-white font-medium`}>重试</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 顶部导航栏 */}
      <View style={tw`absolute top-12 left-0 right-0 z-20 flex-row items-center px-4`}>
        <TouchableOpacity 
          onPress={() => router.back()}
          style={tw`bg-black bg-opacity-50 rounded-full p-2`}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={tw`text-white font-medium ml-4 flex-1`}>
          视频详情
        </Text>
      </View>

      {/* 视频播放区域 */}
      <View style={styles.videoContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={styles.videoWrapper}
          onPress={() => setPaused(p => !p)}
        >
          {/* 视频加载指示器 */}
          {videoLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#fff" />
              <Text style={tw`text-white mt-2`}>加载视频中...</Text>
            </View>
          )}
          
          {/* 视频缩略图背景 */}
          {videoLoading && video.thumbnail && (
            <ExpoImage
              source={{ uri: video.thumbnail }}
              style={styles.thumbnailImage}
              contentFit="cover"
            />
          )}
          
          <Video
            ref={videoRef}
            source={{ uri: video.link }}
            style={styles.video}
            resizeMode="contain"
            repeat={false}
            controls={false}
            paused={paused}
            onLoad={handleVideoLoad}
            onError={handleVideoError}
            onBuffer={() => {
              console.log('视频缓冲中...');
            }}
            onReadyForDisplay={() => {
              console.log('视频准备显示');
              setVideoLoading(false);
            }}
          />
          
          {paused && !videoLoading && (
            <View style={styles.centerPlayIcon}>
              <AntDesign name="playcircleo" size={64} color="#fff" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 右侧操作栏 */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={handleLike} 
          style={styles.actionBtn}
        >
          <AntDesign 
            name={video.isLiked ? "heart" : "hearto"} 
            size={32} 
            color={video.isLiked ? "#e74c3c" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(video.likeCount)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={handleCollect} 
          style={styles.actionBtn}
        >
          <Feather 
            name={video.isCollected ? "bookmark" : "bookmark"} 
            size={32} 
            color={video.isCollected ? "#f1c40f" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(video.collectionCount)}</Text>
        </TouchableOpacity>
      </View>

      {/* 底部信息栏 */}
      <View style={styles.bottomInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {video.description || '暂无描述'}
        </Text>
        <View style={tw`flex-row items-center mt-2`}>
          <Text style={tw`text-white text-sm opacity-80`}>
            {formatCount(video.viewCount.totalViews)} 播放
          </Text>
          <Text style={tw`text-white text-sm opacity-80 ml-4`}>
            {new Date(video.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
  },
  thumbnailImage: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    opacity: 0.3,
  },
  actionBar: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
    zIndex: 10,
  },
  actionBtn: {
    marginBottom: 24,
    alignItems: 'center',
  },
  actionText: {
    color: '#fff',
    marginTop: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
  centerPlayIcon: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  bottomInfo: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 80,
    zIndex: 10,
  },
  videoTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    lineHeight: 22,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 5,
  },
});