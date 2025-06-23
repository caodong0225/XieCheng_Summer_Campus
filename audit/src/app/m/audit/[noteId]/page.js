'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  Typography, 
  Space, 
  Tag, 
  Button, 
  Skeleton, 
  message, 
  Image,
  Carousel,
  Row,
  Col,
  Avatar,
  Modal,
  Tooltip,
  Form,
  Input
} from 'antd';
import { 
  ArrowLeftOutlined, 
  HeartOutlined,
  StarOutlined,
  UserOutlined,
  CalendarOutlined,
  MailOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  ZoomInOutlined,
  FullscreenOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getNoteById, deleteNote, reviewNote } from '../../../../api/note';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import UserAvatar from "@/components/common/user_avatar";

const { Title, Text } = Typography;
const { TextArea } = Input;

const NoteDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId;
  
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [fullscreenMode, setFullscreenMode] = useState(false);
  
  // 拒绝理由相关状态
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();

  useEffect(() => {
    if (noteId) {
      fetchNoteDetail();
    }
  }, [noteId]);

  // 键盘导航支持
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!imageModalVisible) return;
      
      switch (e.key) {
        case 'ArrowLeft':
          e.preventDefault();
          handlePrevImage();
          break;
        case 'ArrowRight':
          e.preventDefault();
          handleNextImage();
          break;
        case 'Escape':
          e.preventDefault();
          setImageModalVisible(false);
          break;
        case 'f':
        case 'F':
          e.preventDefault();
          setFullscreenMode(!fullscreenMode);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageModalVisible, fullscreenMode, note?.attachments?.length]);

  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      const data = await getNoteById(noteId);
      if (data) {
        setNote(data);
      } else {
        message.error('获取游记详情失败');
      }
    } catch (error) {
      console.error('获取游记详情错误:', error);
      message.error('获取游记详情失败');
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
      content: '确定要删除这篇游记吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        try {
          const response = await deleteNote(noteId);
          if (response.success) {
            message.success('删除成功');
            router.back();
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

  const handleStatusChange = async (newStatus, rejectReason = '') => {
    try {
      const auditData = { status: newStatus };
      if (newStatus === 'rejected' && rejectReason) {
        auditData.rejectReason = rejectReason;
      }
      
      const response = await reviewNote(noteId, auditData);
      if (response.success) {
        message.success('状态更新成功');
        setNote(prev => ({ ...prev, status: newStatus }));
      } else {
        message.error('状态更新失败');
      }
    } catch (error) {
      console.error('状态更新错误:', error);
      message.error('状态更新失败');
    }
  };

  const handleReject = () => {
    setRejectModalVisible(true);
    rejectForm.resetFields();
  };

  const handleRejectConfirm = async () => {
    try {
      const values = await rejectForm.validateFields();
      await handleStatusChange('rejected', values.rejectReason);
      setRejectModalVisible(false);
      rejectForm.resetFields();
    } catch (error) {
      console.error('表单验证错误:', error);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalVisible(false);
    rejectForm.resetFields();
  };

  const getStatusTag = (status) => {
    const statusMap = {
      'checking': { color: 'orange', text: '审核中' },
      'approved': { color: 'green', text: '已通过' },
      'rejected': { color: 'red', text: '已拒绝' }
    };
    
    const statusInfo = statusMap[status] || { color: 'default', text: status };
    return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
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

  const openImageModal = (index) => {
    setCurrentImageIndex(index);
    setImageModalVisible(true);
    setFullscreenMode(false);
  };

  const handlePrevImage = useCallback(() => {
    if (note?.attachments?.length > 0) {
      setCurrentImageIndex(prev => 
        prev === 0 ? note.attachments.length - 1 : prev - 1
      );
    }
  }, [note?.attachments?.length]);

  const handleNextImage = useCallback(() => {
    if (note?.attachments?.length > 0) {
      setCurrentImageIndex(prev => 
        prev === note.attachments.length - 1 ? 0 : prev + 1
      );
    }
  }, [note?.attachments?.length]);

  const handleCarouselChange = (from, to) => {
    setCurrentImageIndex(to);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <div className="mb-6">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                返回
              </Button>
            </div>
            <Skeleton active paragraph={{ rows: 10 }} />
          </div>
        </div>
      </div>
    );
  }

  if (!note) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 shadow-lg rounded-lg text-center">
            <div className="mb-6">
              <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                返回
              </Button>
            </div>
            <Text type="secondary">游记不存在或已被删除</Text>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          {/* 头部操作栏 */}
          <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-500 to-green-500">
            <div className="flex justify-between items-center">
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={handleBack}
                className="text-white border-white hover:bg-white hover:text-blue-500"
              >
                返回列表
              </Button>
              <Space>
                {note.status !== 'approved' && (
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => handleStatusChange('approved')}
                    className="bg-green-500 border-green-500 hover:bg-green-600"
                  >
                    通过
                  </Button>
                )}
                {note.status !== 'rejected' && (
                  <Button 
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleReject}
                  >
                    拒绝
                  </Button>
                )}
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={handleDelete}
                >
                  删除
                </Button>
              </Space>
            </div>
          </div>

          {/* 游记内容 */}
          <div className="p-8">
            {/* 标题和状态 */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-4">
                <Title level={1} className="mb-0 text-gray-800">{note.title}</Title>
                {getStatusTag(note.status)}
              </div>
              
              {/* 统计信息 */}
              <div className="flex items-center justify-center space-x-8 text-gray-500 mb-6">
                <span className="flex items-center">
                  <HeartOutlined className="mr-2 text-red-400" />
                  {note.likes || 0} 点赞
                </span>
                <span className="flex items-center">
                  <StarOutlined className="mr-2 text-yellow-400" />
                  {note.collections || 0} 收藏
                </span>
                <span className="flex items-center">
                  <CalendarOutlined className="mr-2 text-blue-400" />
                  {formatDate(note.created_at)}
                </span>
              </div>
            </div>

            {/* 作者信息 */}
            <Card className="mb-8 bg-gray-50 border-0 shadow-sm">
              <div className="flex items-center space-x-4">
                <UserAvatar user={note.user} size={50} />
                <div className="flex-1 pl-4">
                  <div className="flex items-center space-x-3 mb-2">
                    <Text strong className="text-lg">{note.user?.username}</Text>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center">
                      <MailOutlined className="mr-1" />
                      {note.user?.email}
                    </span>
                    <span className="flex items-center">
                      <CalendarOutlined className="mr-1" />
                      {formatDate(note.user?.created_at)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>

            {/* 图片展示 */}
            {note.attachments && note.attachments.length > 0 && (
              <div className="mb-8">
                <div className="flex items-center justify-between mb-6">
                  <Title level={3} className="mb-0 text-gray-700">图片展示</Title>
                  <Text type="secondary" className="text-sm">共 {note.attachments.length} 张图片</Text>
                </div>
                
                
                {/* 缩略图网格 */}
                <div className="thumbnail-grid">
                  {note.attachments.map((attachment, index) => (
                    <div 
                      key={attachment.id}
                      className="thumbnail-item"
                      onClick={() => openImageModal(index)}
                    >
                      <img
                        src={attachment.value}
                        alt={`缩略图 ${index + 1}`}
                        onError={(e) => {
                          e.target.src = '/placeholder-image.jpg';
                        }}
                      />
                      <div className="absolute top-2 right-2 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded-full">
                        {index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 游记描述 */}
            <div className="mb-8">
              <Title level={3} className="mb-6 text-gray-700">游记内容</Title>
              <Card className="bg-gray-50 border-0 shadow-sm">
                <div className="prose max-w-none">
                  <ReactMarkdown 
                    remarkPlugins={[remarkGfm]}
                    components={{
                      p: ({ children, ...props }) => (
                        <p className="mb-4 text-gray-700 leading-relaxed" {...props}>
                          {children}
                        </p>
                      ),
                      h1: ({ children, ...props }) => (
                        <h1 className="text-2xl font-bold mb-4 mt-6 text-gray-800" {...props}>
                          {children}
                        </h1>
                      ),
                      h2: ({ children, ...props }) => (
                        <h2 className="text-xl font-bold mb-3 mt-5 text-gray-800" {...props}>
                          {children}
                        </h2>
                      ),
                      h3: ({ children, ...props }) => (
                        <h3 className="text-lg font-bold mb-2 mt-4 text-gray-800" {...props}>
                          {children}
                        </h3>
                      ),
                      ul: ({ children, ...props }) => (
                        <ul className="list-disc pl-6 mb-4 text-gray-700" {...props}>
                          {children}
                        </ul>
                      ),
                      ol: ({ children, ...props }) => (
                        <ol className="list-decimal pl-6 mb-4 text-gray-700" {...props}>
                          {children}
                        </ol>
                      ),
                      li: ({ children, ...props }) => (
                        <li className="mb-1" {...props}>
                          {children}
                        </li>
                      ),
                      blockquote: ({ children, ...props }) => (
                        <blockquote className="border-l-4 border-blue-300 pl-4 italic text-gray-600 mb-4 bg-blue-50 py-2 rounded-r" {...props}>
                          {children}
                        </blockquote>
                      ),
                      code: ({ children, ...props }) => (
                        <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono" {...props}>
                          {children}
                        </code>
                      ),
                      pre: ({ children, ...props }) => (
                        <pre className="bg-gray-800 text-white p-4 rounded-lg overflow-x-auto mb-4" {...props}>
                          {children}
                        </pre>
                      ),
                      img: ({ src, alt, ...props }) => (
                        <img 
                          src={src} 
                          alt={alt} 
                          className="max-w-full h-auto rounded-lg my-4 shadow-md" 
                          {...props}
                        />
                      ),
                    }}
                  >
                    {note.description || '暂无内容'}
                  </ReactMarkdown>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* 图片查看模态框 */}
      <Modal
        open={imageModalVisible}
        onCancel={() => setImageModalVisible(false)}
        footer={null}
        width={fullscreenMode ? '100vw' : '90vw'}
        centered
        destroyOnClose
        className={fullscreenMode ? 'fullscreen-modal' : ''}
        style={fullscreenMode ? { top: 0, padding: 0 } : {}}
      >
        <div className="relative">
          {/* 导航按钮 */}
          <Button
            className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 border-none text-white hover:bg-opacity-70"
            icon={<LeftOutlined />}
            onClick={handlePrevImage}
            size="large"
          />
          <Button
            className="absolute right-4 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 border-none text-white hover:bg-opacity-70"
            icon={<RightOutlined />}
            onClick={handleNextImage}
            size="large"
          />
          
          {/* 全屏切换按钮 */}
          <Tooltip title={fullscreenMode ? '退出全屏 (F)' : '全屏 (F)'}>
            <Button
              className="absolute top-4 right-4 z-10 bg-black bg-opacity-50 border-none text-white hover:bg-opacity-70"
              icon={<FullscreenOutlined />}
              onClick={() => setFullscreenMode(!fullscreenMode)}
              size="middle"
            />
          </Tooltip>

          <Carousel 
            dots={false} 
            initialSlide={currentImageIndex}
            beforeChange={handleCarouselChange}
            effect="fade"
          >
            {note.attachments?.map((attachment, index) => (
              <div key={attachment.id} className="flex justify-center items-center">
                <img
                  src={attachment.value}
                  alt={`大图 ${index + 1}`}
                  className="max-w-full max-h-[70vh] object-contain"
                  onError={(e) => {
                    e.target.src = '/placeholder-image.jpg';
                  }}
                />
              </div>
            ))}
          </Carousel>
          
          {/* 图片计数器 */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-50 text-white px-3 py-1 rounded">
            {currentImageIndex + 1} / {note.attachments?.length}
          </div>
          
          {/* 键盘提示 */}
          <div className="absolute bottom-4 right-4 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
            ← → 切换 | ESC 关闭 | F 全屏
          </div>
        </div>
      </Modal>

      {/* 拒绝理由模态框 */}
      <Modal
        title="拒绝理由"
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item
            name="rejectReason"
            label="拒绝理由"
            rules={[
              { required: true, message: '请输入拒绝理由' },
              { min: 5, message: '拒绝理由至少5个字符' },
              { max: 500, message: '拒绝理由不能超过500个字符' }
            ]}
          >
            <TextArea
              rows={4}
              placeholder="请输入拒绝这篇游记的理由..."
              showCount
              maxLength={500}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default NoteDetailPage;
