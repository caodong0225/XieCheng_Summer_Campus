import { AntDesign, Feather, FontAwesome, Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';
import tw from 'twrnc';
import { collectVideo, getVideoById, getVideoList, likeVideo, watchVideo } from '../../api/video';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

type VideoBasicInfo = {
  id: number;
  created_at: string;
  description: string;
  link: string;
  thumbnail: string;
};

type VideoItem = VideoBasicInfo & {
  updated_at?: string;
  created_by?: number;
  likeCount: number;
  collectionCount: number;
  isCollected: boolean;
  isLiked: boolean;
  viewCount: {
    totalViews: string;
    uniqueUsers: number;
  };
  detailLoaded: boolean; // 标记详情是否已加载
};

export default function VideoScreen() {
  const router = useRouter();
  const { videoId } = useLocalSearchParams<{ videoId: string }>();
  
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [videoIds, setVideoIds] = useState<number[]>([]);
  
  const flatListRef = useRef<FlatList>(null);
  const currentVideoId = useRef<number | null>(null);

  // 初始化加载视频列表
  useEffect(() => {
    fetchVideoIds();
  }, []);

  // 监听videoIds变化，自动加载当前索引的视频详情
  useEffect(() => {
    if (videoIds.length > 0 && currentIndex < videoIds.length) {
      // 确保videos数组长度与videoIds匹配
      setVideos(prev => {
        const newVideos = [...prev];
        while (newVideos.length < videoIds.length) {
          newVideos.push(null as any);
        }
        return newVideos;
      });
      
      loadVideoDetail(currentIndex);
    }
  }, [videoIds, currentIndex]);

  // 处理初始视频ID定位
  useEffect(() => {
    if (videoId && videos.length > 0) {
      const index = videos.findIndex(v => v.id.toString() === videoId);
      if (index !== -1) {
        setCurrentIndex(index);
        // 滚动到指定视频
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({ index, animated: false });
        }, 100);
      }
    }
  }, [videoId, videos]);

  // 获取未读视频列表
  const fetchVideoIds = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
        setPage(1);
      } else {
        setLoading(true);
      }
      setError(null);
      
      const currentPage = isRefresh ? 1 : page;
      const response = await getVideoList({ page: currentPage, limit: 10 });
      console.log("response" + JSON.stringify(response));
      if (response.success && response.list) {
        // response.list包含基本视频信息，但需要获取完整详情
        const basicVideos = response.list;
        console.log("basicVideos" + JSON.stringify(basicVideos))
        
        const newVideoIds = basicVideos.map((video: any) => video.id);
        console.log("newVideoIds" + JSON.stringify(newVideoIds));
        
        if (isRefresh) {
          setVideoIds(newVideoIds);
          setVideos([]);
          setCurrentIndex(0);
        } else {
          // 避免重复添加
          setVideoIds(prev => {
            const existingIds = new Set(prev);
            const uniqueNewIds = newVideoIds.filter((id: number) => !existingIds.has(id));
            const result = [...prev, ...uniqueNewIds];
            console.log("updated videoIds" + JSON.stringify(result));
            return result;
          });
        }
        
        setPage(currentPage + 1);
        setHasMore(basicVideos.length === 10);
      } else {
        setError(response.message || '获取视频列表失败');
      }
    } catch (err) {
      setError('获取视频列表时发生错误');
      console.error('Error fetching video list:', err);
    } finally {
      if (isRefresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  // 加载单个视频详情
  const loadVideoDetail = async (index: number) => {
    console.log("loadVideoDetail index:" + index);
    console.log("videoIds length:" + videoIds.length);
    console.log("videoIds:" + JSON.stringify(videoIds));
    
    const videoId = videoIds[index];
    console.log("videoId for index " + index + ":" + videoId);
    
    if (!videoId) {
      console.log("No videoId found for index " + index);
      return; // 如果没有videoId，跳过
    }
    
    // 检查是否已经有完整的详情数据
    const existingVideo = videos[index];
    console.log("existingVideo for index " + index + ":" + JSON.stringify(existingVideo));
    
    if (existingVideo && existingVideo.likeCount !== undefined) {
      console.log("Video detail already loaded for index " + index);
      return; // 如果已经有完整详情了，跳过
    }
    
    console.log("Loading video detail for videoId:" + videoId);
    
    try {
      // 设置占位符
      setVideos(prev => {
        const newVideos = [...prev];
        while (newVideos.length <= index) {
          newVideos.push(null as any);
        }
        return newVideos;
      });
      
      const response = await getVideoById(videoId);
      console.log("getVideoById response:" + JSON.stringify(response));
      
      if (response.success && response.data) {
        setVideos(prev => {
          const newVideos = [...prev];
          newVideos[index] = response.data;
          console.log("Updated videos array for index " + index);
          return newVideos;
        });
      } else {
        console.error('获取视频详情失败:', videoId, response.message);
      }
    } catch (err) {
      console.error('加载视频详情错误:', videoId, err);
    }
  };

  // 发送观看请求
  const sendWatchRequest = async (videoId: number) => {
    // 避免重复发送同一个视频的观看请求
    if (currentVideoId.current === videoId) return;
    
    try {
      currentVideoId.current = videoId;
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

  const onRefresh = () => {
    fetchVideoIds(true);
  };

  // 加载更多视频
  const loadMore = () => {
    if (hasMore && !loading && !refreshing) {
      fetchVideoIds();
    }
  };

  // 处理视频播放结束
  const handleVideoEnd = (index: number) => {
    // 如果还有下一个视频，自动切换到下一个
    if (index < videoIds.length - 1) {
      const nextIndex = index + 1;
      setCurrentIndex(nextIndex);
      
      // 滚动到下一个视频
      flatListRef.current?.scrollToIndex({
        index: nextIndex,
        animated: true
      });
    } else {
      // 如果是最后一个视频，加载更多
      loadMore();
    }
  };

  // 处理视频开始播放
  const handleVideoLoad = async (videoId: number) => {
    // 视频开始播放时发送观看请求
    await sendWatchRequest(videoId);
  };

  // 处理滑动结束
  const handleScrollEnd = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / SCREEN_HEIGHT);
    
    if (index !== currentIndex) {
      setCurrentIndex(index);
      
      // 加载当前视频详情
      loadVideoDetail(index);
      
      // 发送观看请求
      const videoId = videoIds[index];
      if (videoId) {
        sendWatchRequest(videoId);
      }
      
      // 检查是否需要加载更多
      if (index >= videoIds.length - 3 && hasMore) {
        loadMore();
      }
    }
  };

  // 点赞视频
  const handleLike = async (videoId: number, index: number) => {
    try {
      const response = await likeVideo(videoId);
      if (response.success && response.data) {
        setVideos(prev => prev.map((video, i) => {
          if (i === index) {
            return {
              ...video,
              isLiked: response.data.favorited,
              likeCount: response.data.favoriteCount
            };
          }
          return video;
        }));
      } else {
        Alert.alert('提示', response.message || '操作失败，请重试');
      }
    } catch (err) {
      Alert.alert('提示', '操作失败，请重试');
    }
  };

  // 收藏视频
  const handleCollect = async (videoId: number, index: number) => {
    try {
      const response = await collectVideo(videoId);
      if (response.success && response.data) {
        setVideos(prev => prev.map((video, i) => {
          if (i === index) {
            return {
              ...video,
              isCollected: response.data.collected,
              collectionCount: response.data.collectionCount
            };
          }
          return video;
        }));
      } else {
        Alert.alert('提示', response.message || '操作失败，请重试');
      }
    } catch (err) {
      Alert.alert('提示', '操作失败，请重试');
    }
  };

  // 渲染单个视频项
  const renderVideoItem = ({ item, index }: { item: VideoItem | null; index: number }) => {
    if (!item) {
      return (
        <View style={[styles.videoContainer, tw`justify-center items-center`]}>
          <ActivityIndicator size="large" color="#fff" />
          <Text style={tw`text-white mt-4`}>加载视频中...</Text>
        </View>
      );
    }
    
    return (
      <VideoItem
        item={item}
        index={index}
        onLike={handleLike}
        onCollect={handleCollect}
        onVideoEnd={handleVideoEnd}
        onVideoLoad={handleVideoLoad}
      />
    );
  };

  if (loading && !refreshing && videos.length === 0) {
    return (
      <View style={[styles.container, tw`justify-center items-center`]}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={tw`text-white mt-4`}>加载中...</Text>
      </View>
    );
  }

  if (error && videos.length === 0) {
    return (
      <View style={[styles.container, tw`justify-center items-center`]}>
        <Ionicons name="alert-circle-outline" size={64} color="#fff" style={tw`mb-4`} />
        <Text style={tw`text-white text-lg mb-4`}>{error}</Text>
        <TouchableOpacity 
          style={tw`bg-blue-500 px-6 py-3 rounded-lg`}
          onPress={() => fetchVideoIds(true)}
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
          视频推荐
        </Text>
      </View>

      {/* 视频列表 */}
      <FlatList
        ref={flatListRef}
        data={videos}
        keyExtractor={(item, index) => `${item ? item.id : 'placeholder'}-${index}`}
        renderItem={renderVideoItem}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
        onEndReached={loadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#fff']}
            tintColor="#fff"
            title="下拉刷新"
            titleColor="#fff"
          />
        }
        getItemLayout={(data, index) => ({
          length: SCREEN_HEIGHT,
          offset: SCREEN_HEIGHT * index,
          index,
        })}
      />
    </View>
  );
}

// 独立的视频项组件
const VideoItem: React.FC<{
  item: VideoItem;
  index: number;
  onLike: (videoId: number, index: number) => void;
  onCollect: (videoId: number, index: number) => void;
  onVideoEnd: (index: number) => void;
  onVideoLoad: (videoId: number) => void;
}> = ({ item, index, onLike, onCollect, onVideoEnd, onVideoLoad }) => {
  const [paused, setPaused] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const videoRef = useRef<any>(null);

  const formatCount = (count: string | number) => {
    const num = typeof count === 'string' ? parseInt(count) : count;
    if (num >= 10000) {
      return (num / 10000).toFixed(1) + '万';
    }
    return num.toString();
  };

  const handleVideoEnd = () => {
    // 视频播放结束时，自动切换到下一个视频
    onVideoEnd(index);
  };

  const handleVideoLoad = () => {
    setIsLoading(false);
    setPaused(false);
    // 视频开始播放时不发送watch请求，避免重复
  };

  return (
    <View style={styles.videoContainer}>
      {/* 视频播放区域 */}
      <TouchableOpacity
        activeOpacity={1}
        style={styles.videoWrapper}
        onPress={() => setPaused(p => !p)}
      >
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#fff" />
          </View>
        )}
        
        <Video
          ref={videoRef}
          source={{ uri: item.link }}
          style={styles.video}
          resizeMode="cover"
          repeat={false}
          controls={false}
          paused={paused}
          onLoad={handleVideoLoad}
          onEnd={handleVideoEnd}
          onError={(error) => {
            console.error('Video error:', error);
            setIsLoading(false);
          }}
        />
        
        {paused && (
          <View style={styles.centerPlayIcon}>
            <AntDesign name="playcircleo" size={64} color="#fff" />
          </View>
        )}
      </TouchableOpacity>

      {/* 右侧操作栏 */}
      <View style={styles.actionBar}>
        <TouchableOpacity 
          onPress={() => onLike(item.id, index)} 
          style={styles.actionBtn}
        >
          <AntDesign 
            name={item.isLiked ? "heart" : "hearto"} 
            size={32} 
            color={item.isLiked ? "#e74c3c" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(item.likeCount)}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity onPress={() => {}} style={styles.actionBtn}>
          <FontAwesome name="commenting-o" size={32} color="#fff" />
          <Text style={tw`text-white text-sm opacity-80 ml-4`}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          onPress={() => onCollect(item.id, index)} 
          style={styles.actionBtn}
        >
          <Feather 
            name={item.isCollected ? "bookmark" : "bookmark"} 
            size={32} 
            color={item.isCollected ? "#f1c40f" : "#fff"} 
          />
          <Text style={styles.actionText}>{formatCount(item.collectionCount)}</Text>
        </TouchableOpacity>
      </View>

      {/* 底部信息栏 */}
      <View style={styles.bottomInfo}>
        <Text style={styles.videoTitle} numberOfLines={2}>
          {item.description || '暂无描述'}
        </Text>
        <View style={tw`flex-row items-center mt-2`}>
          <Text style={tw`text-white text-sm opacity-80`}>
            {formatCount(item.viewCount.totalViews)} 播放
          </Text>
          <Text style={tw`text-white text-sm opacity-80 ml-4`}>
            {new Date(item.created_at).toLocaleDateString()}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    position: 'relative',
  },
  videoWrapper: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  video: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#000',
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