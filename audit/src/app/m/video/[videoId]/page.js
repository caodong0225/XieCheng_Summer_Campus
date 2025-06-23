'use client';

import { 
  List, 
  Avatar, 
  Skeleton, 
  message, 
  Pagination, 
  Space, 
  Typography, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col,
  Modal,
  Popconfirm,
  Select,
  Tag
} from "antd";
import { 
  SearchOutlined, 
  DeleteOutlined,
  PlayCircleOutlined,
  CalendarOutlined,
  UserOutlined,
  SortAscendingOutlined,
  SortDescendingOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { getVideoAll, deleteVideoById } from '@/api/video';
import { useRouter } from 'next/navigation';
import UserAvatar from "@/components/common/user_avatar";

const { Text, Title } = Typography;
const { Search } = Input;

const VideoManagementPage = () => {
  const router = useRouter();
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 筛选状态
  const [filters, setFilters] = useState({
    description: '',
    sortField: 'created_at',
    sortOrder: 'desc'
  });

  const fetchVideos = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const params = {
        page: page,
        limit: pageSize,
        sortField: filters.sortField,
        sortOrder: filters.sortOrder,
        description: filters.description
      };
      
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await getVideoAll(params);
      
      if (response.code === 200) {
        setVideos(response.data.videos || []);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.data.total || 0
        });
      } else {
        message.error('获取视频列表失败');
      }
    } catch (error) {
      console.error('获取视频列表错误:', error);
      message.error('获取视频列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, [filters]);

  const handlePageChange = (page, pageSize) => {
    fetchVideos(page, pageSize);
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      description: value
    }));
  };

  const handleSortChange = (field) => {
    const order = filters.sortField === field && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    setFilters(prev => ({
      ...prev,
      sortField: field,
      sortOrder: order
    }));
  };

  const handleDelete = (videoId) => {
    Modal.confirm({
      title: '确认删除',
      content: '确定要删除这个视频吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteVideoById(videoId);
          if (response.success) {
            message.success('删除成功');
            fetchVideos(pagination.current, pagination.pageSize);
          } else {
            message.error('删除失败');
          }
        } catch (error) {
          console.error('删除错误:', error);
          message.error('删除失败');
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

  const handleViewUser = (user_id) => {
    router.push(`/m/user/${user_id}`);
  }

  // 新功能：跳转到视频详情页
  const handleViewVideoDetail = (videoId) => {
    router.push(`/m/video/${videoId}`);
  }

  const getSortIcon = (field) => {
    if (filters.sortField !== field) return null;
    
    return filters.sortOrder === 'asc' ? 
      <SortAscendingOutlined className="text-blue-500" /> : 
      <SortDescendingOutlined className="text-blue-500" />;
  };

  if (loading && videos.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-indigo-600">视频管理</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map(item => (
                <Card key={item}>
                  <Skeleton active avatar paragraph={{ rows: 3 }} />
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-indigo-600">视频管理</h1>
          </div>
          
          {/* 筛选区域 */}
          <Card className="mb-6" bodyStyle={{ padding: '16px 24px' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col xs={24} md={12} lg={8}>
                <Search
                  placeholder="搜索视频描述"
                  enterButton={<Button type="primary" icon={<SearchOutlined />} />}
                  size="large"
                  onSearch={handleSearch}
                  allowClear
                />
              </Col>
              
              <Col xs={24} md={12} lg={16}>
                <div className="flex flex-wrap gap-3 justify-end">
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-600">排序:</span>
                    <Button 
                      type="text"
                      className={`flex items-center ${filters.sortField === 'created_at' ? 'text-indigo-600' : ''}`}
                      onClick={() => handleSortChange('created_at')}
                    >
                      <CalendarOutlined />
                      <span className="ml-1">创建时间</span>
                      {getSortIcon('created_at')}
                    </Button>
                    <Button 
                      type="text"
                      className={`flex items-center ml-2 ${filters.sortField === 'id' ? 'text-indigo-600' : ''}`}
                      onClick={() => handleSortChange('id')}
                    >
                      <span>ID</span>
                      {getSortIcon('id')}
                    </Button>
                  </div>
                  
                  <div className="flex items-center">
                    <span className="mr-2 text-gray-600">每页数量:</span>
                    <Select
                      defaultValue={10}
                      onChange={(value) => {
                        setPagination(prev => ({...prev, pageSize: value}));
                        fetchVideos(1, value);
                      }}
                      options={[
                        { value: 5, label: '5条' },
                        { value: 10, label: '10条' },
                        { value: 20, label: '20条' },
                        { value: 50, label: '50条' },
                      ]}
                    />
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
          
          {/* 视频列表 */}
          {videos.length === 0 ? (
            <div className="text-center py-12">
              <div className="mb-4">
                <PlayCircleOutlined className="text-5xl text-gray-300" />
              </div>
              <Title level={4} className="text-gray-500">暂无视频数据</Title>
              <p className="text-gray-400 mb-6">尝试调整搜索条件或上传新视频</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {videos.map(video => (
                  <Card
                    key={video.id}
                    hoverable
                    cover={
                      <div 
                        className="relative h-48 overflow-hidden cursor-pointer"
                        onClick={() => handleViewVideoDetail(video.id)}
                      >
                        <img
                          alt={video.description}
                          src={video.thumbnail}
                          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
                          onError={(e) => {
                            e.target.src = '/placeholder-image.jpg';
                          }}
                        />
                        <div 
                          className="absolute inset-0 flex items-center justify-center"
                          onClick={(e) => {
                            e.stopPropagation(); // 阻止事件冒泡
                            window.open(video.link, '_blank');
                          }}
                        >
                          <PlayCircleOutlined className="text-4xl text-white opacity-80 hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    }
                    actions={[
                      <Popconfirm
                        title="确定要删除这个视频吗？"
                        onConfirm={() => handleDelete(video.id)}
                        okText="删除"
                        cancelText="取消"
                        okButtonProps={{ danger: true }}
                      >
                        <Button type="text" danger icon={<DeleteOutlined />} />
                      </Popconfirm>,
                      <Button 
                        type="text" 
                        icon={<PlayCircleOutlined />}
                        onClick={() => window.open(video.link, '_blank')}
                      >
                        播放
                      </Button>
                    ]}
                    // 添加卡片主体区域的点击事件
                    bodyStyle={{ cursor: 'pointer' }}
                    onClick={() => handleViewVideoDetail(video.id)}
                  >
                    <div className="min-h-[120px]">
                      <div className="mb-3">
                        <p className="text-gray-700 line-clamp-2">{video.description}</p>
                      </div>
                      
                      <div 
                        className="flex items-center text-sm text-gray-500 mb-2"
                        onClick={(e) => {
                          e.stopPropagation(); // 阻止事件冒泡到卡片
                          handleViewUser(video.user_id);
                        }}
                      >
                        <UserAvatar user={video} size={20} />
                        <Button type="text" className="mr-3 pl-2">{video.username}</Button>
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500">
                        <CalendarOutlined className="mr-1" />
                        <span>{formatDate(video.created_at)}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
              
              <div className="mt-8 flex justify-center">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => 
                    `显示 ${range[0]}-${range[1]} 条，共 ${total} 条视频`
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoManagementPage;