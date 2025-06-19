import { AntDesign, Feather, FontAwesome } from '@expo/vector-icons';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Dimensions, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Video from 'react-native-video';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

const VIDEO_RATIO = 16 / 9;
const videoWidth = SCREEN_WIDTH;
const videoHeight = SCREEN_WIDTH / VIDEO_RATIO;

type VideoData = {
  url: string;
  likes: number;
  comments: number;
  collects: number;
};

type ActionBarProps = {
  likes: number;
  comments: number;
  collects: number;
  onLike: () => void;
  onComment: () => void;
  onCollect: () => void;
  liked: boolean;
  collected: boolean;
};

// 假数据，后续可用API替换
const getVideoList = async (): Promise<VideoData[]> => [
  { url: 'https://frp.caodong0225.top/xiecheng/video-1750347854411-6a64ada7000e4bd3.mp4', likes: 123, comments: 45, collects: 10 },
  // 可继续添加更多视频
];

const ActionBar = ({ likes, comments, collects, onLike, onComment, onCollect, liked, collected }: ActionBarProps) => (
  <View style={styles.actionBar}>
    <TouchableOpacity onPress={onLike} style={styles.actionBtn}>
      <AntDesign name={liked ? "heart" : "hearto"} size={32} color={liked ? "#e74c3c" : "#fff"} />
      <Text style={styles.actionText}>{likes}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onComment} style={styles.actionBtn}>
      <FontAwesome name="commenting-o" size={32} color="#fff" />
      <Text style={styles.actionText}>{comments}</Text>
    </TouchableOpacity>
    <TouchableOpacity onPress={onCollect} style={styles.actionBtn}>
      <Feather name={collected ? "bookmark" : "bookmark"} size={32} color={collected ? "#f1c40f" : "#fff"} />
      <Text style={styles.actionText}>{collects}</Text>
    </TouchableOpacity>
  </View>
);

const VideoItem = ({ uri, likes, comments, collects }: { uri: string; likes: number; comments: number; collects: number }) => {
  const [liked, setLiked] = useState<boolean>(false);
  const [collected, setCollected] = useState<boolean>(false);
  const [likeCount, setLikeCount] = useState<number>(likes);
  const [collectCount, setCollectCount] = useState<number>(collects);
  const [paused, setPaused] = useState<boolean>(false);

  return (
    <View style={{ height: SCREEN_HEIGHT, width: SCREEN_WIDTH, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' }}>
      <TouchableOpacity
        activeOpacity={1}
        style={{ justifyContent: 'center', alignItems: 'center', width: videoWidth, height: videoHeight }}
        onPress={() => setPaused(p => !p)}
      >
        <Video
          source={{ uri }}
          style={{
            width: videoWidth,
            height: videoHeight,
            backgroundColor: '#000',
          }}
          resizeMode="contain"
          repeat
          controls={false}
          paused={paused}
        />
        {paused && (
          <View style={styles.centerPlayIcon}>
            <AntDesign name="playcircleo" size={64} color="#fff" />
          </View>
        )}
      </TouchableOpacity>
      {/* 右下角操作栏 */}
      <View style={styles.actionBarBottom}>
        <TouchableOpacity onPress={() => {
          setLiked(!liked);
          setLikeCount(likeCount + (liked ? -1 : 1));
        }} style={styles.actionBtn}>
          <AntDesign name={liked ? "heart" : "hearto"} size={32} color={liked ? "#e74c3c" : "#fff"} />
          <Text style={styles.actionText}>{likeCount}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {}} style={styles.actionBtn}>
          <FontAwesome name="commenting-o" size={32} color="#fff" />
          <Text style={styles.actionText}>{comments}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => {
          setCollected(!collected);
          setCollectCount(collectCount + (collected ? -1 : 1));
        }} style={styles.actionBtn}>
          <Feather name={collected ? "bookmark" : "bookmark"} size={32} color={collected ? "#f1c40f" : "#fff"} />
          <Text style={styles.actionText}>{collectCount}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default function VideoScreen() {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function fetchVideos() {
      setLoading(true);
      try {
        const list = await getVideoList();
        setVideos(list);
      } catch (e) {
        setVideos([]);
      }
      setLoading(false);
    }
    fetchVideos();
  }, []);

  if (loading) {
    return <ActivityIndicator style={{ flex: 1 }} size="large" color="#000" />;
  }

  return (
    <FlatList
      data={videos}
      keyExtractor={(_, idx) => idx.toString()}
      renderItem={({ item }) => (
        <VideoItem
          uri={item.url}
          likes={item.likes}
          comments={item.comments}
          collects={item.collects}
        />
      )}
      pagingEnabled
      showsVerticalScrollIndicator={false}
      snapToInterval={SCREEN_HEIGHT}
      decelerationRate="fast"
      getItemLayout={(_, index) => ({ length: SCREEN_HEIGHT, offset: SCREEN_HEIGHT * index, index })}
    />
  );
}

const styles = StyleSheet.create({
  actionBar: {
    // 废弃
    display: 'none',
  },
  actionBarBottom: {
    position: 'absolute',
    right: 20,
    bottom: 40,
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
    fontSize: 16,
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
});