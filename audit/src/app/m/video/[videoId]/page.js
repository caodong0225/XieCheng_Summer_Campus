'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Skeleton, 
  message, 
  Modal,
  Row,
  Col,
  Avatar,
  Statistic,
  Divider,
  Alert
} from 'antd';
import { 
  ArrowLeftOutlined, 
  HeartOutlined,
  HeartFilled,
  StarOutlined,
  StarFilled,
  PlayCircleOutlined,
  UserOutlined,
  CalendarOutlined,
  EyeOutlined,
  DeleteOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getVideoById, deleteVideoById } from '@/api/video';
import UserAvatar from "@/components/common/user_avatar";

const { Title, Text, Paragraph } = Typography;

const VideoDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId;
  
  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

  useEffect(() => {
    if (videoId) {
      fetchVideoDetail();
    }
  }, [videoId]);

  const fetchVideoDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getVideoById(videoId);
      if (data) {
        setVideo(data);
      } else {
        throw new Error('获取视频详情失败');
      }
    } catch (error) {
      console.error('获取视频详情错误:', error);
      setError(error.message || '获取视频详情失败');
      setErrorModalVisible(true);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.back();
  };

  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个视频吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteVideoById(videoId);
          if (response.code === 200) {
            message.success('删除成功');
            router.back();
          } else {
            throw new Error(response.message || '删除失败');
          }
        } catch (error) {
          console.error('删除错误:', error);
          setError(error.message || '删除失败');
          setErrorModalVisible(true);
        }
      }
    });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="text-white border-white hover:bg-white hover:text-blue-500">
                返回
              </Button>
            </div>
            <div className="p-8">
              <Skeleton active paragraph={{ rows: 10 }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="p-6 bg-gradient-to-r from-blue-500 to-purple-600">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack} className="text-white border-white hover:bg-white hover:text-blue-500">
                返回
              </Button>
            </div>
            <div className="p-8 text-center">
              <div className="text-6xl mb-4">🎬</div>
              <Title level={3} className="text-gray-600">视频不存在或已被删除</Title>
              <Text type="secondary">请检查链接是否正确</Text>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* 头部操作栏 */}
          <div className="p-6 bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 relative overflow-hidden">
            <div className="absolute inset-0 bg-black opacity-10"></div>
            <div className="relative flex justify-between items-center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
                className="text-white border-white hover:bg-white hover:text-blue-500 shadow-lg"
                size="large"
              >
                返回列表
              </Button>
              <Space size="middle">
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                  className="shadow-lg"
                  size="large"
                >
                  删除
                </Button>
              </Space>
            </div>
          </div>

          {/* 视频内容 */}
          <div className="p-8">
            {/* 标题和统计信息 */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Title level={1} className="mb-0 text-gray-800 font-bold">{video.description || '暂无标题'}</Title>
              </div>
              
              {/* 统计信息 */}
              <div className="flex items-center justify-center space-x-8 text-gray-500 mb-6">
                <div className="flex items-center bg-red-50 px-4 py-2 rounded-full">
                  <HeartOutlined className="mr-2 text-red-400" />
                  <span className="font-medium">{video.likeCount || 0} 点赞</span>
                </div>
                <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                  <StarOutlined className="mr-2 text-yellow-400" />
                  <span className="font-medium">{video.collectionCount || 0} 收藏</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                  <EyeOutlined className="mr-2 text-blue-400" />
                  <span className="font-medium">{video.viewCount?.totalViews || 0} 播放</span>
                </div>
                <div className="flex items-center bg-green-50 px-4 py-2 rounded-full">
                  <CalendarOutlined className="mr-2 text-green-400" />
                  <span className="font-medium">{formatDate(video.created_at)}</span>
                </div>
              </div>
            </div>

            {/* 内嵌视频播放器 */}
            <div className="mb-8">
              <Card className="bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg rounded-xl overflow-hidden">
                <div className="relative">
                  <video
                    controls
                    className="w-full h-auto max-h-[70vh] rounded-lg"
                    poster={video.thumbnail}
                    onError={(e) => {
                      console.error('视频加载失败:', e);
                      message.error('视频加载失败，请检查链接');
                    }}
                  >
                    <source src={video.link} type="video/mp4" />
                    您的浏览器不支持视频播放。
                  </video>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 错误处理模态框 */}
      <Modal
        title={
          <div className="flex items-center space-x-2 text-red-500">
            <ExclamationCircleOutlined />
            <span>操作失败</span>
          </div>
        }
        open={errorModalVisible}
        onOk={() => setErrorModalVisible(false)}
        onCancel={() => setErrorModalVisible(false)}
        okText="确定"
        cancelText="关闭"
        okButtonProps={{ type: 'primary' }}
      >
        <Alert
          message="错误信息"
          description={error}
          type="error"
          showIcon
          className="mb-4"
        />
        <div className="text-gray-600 text-sm">
          <p>如果问题持续存在，请联系技术支持。</p>
        </div>
      </Modal>
    </div>
  );
};

export default VideoDetailPage;