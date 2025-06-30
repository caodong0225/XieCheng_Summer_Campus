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
  Input,
  Alert,
  Divider,
  Badge
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
  EyeOutlined,
  FileImageOutlined,
  EditOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import { useRouter, useParams } from 'next/navigation';
import { getNoteById, deleteNote, reviewNote, deleteAttachment } from '../../../../api/note';
import UserAvatar from "@/components/common/user_avatar";

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;

const NoteDetailPage = () => {
  const router = useRouter();
  const params = useParams();
  const noteId = params.noteId;
  
  const [note, setNote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  
  // 拒绝理由相关状态
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectForm] = Form.useForm();

  // 错误处理状态
  const [error, setError] = useState(null);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

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
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [imageModalVisible, note?.attachments?.length]);

  const fetchNoteDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await getNoteById(noteId);
      if (data) {
        setNote(data);
      } else {
        throw new Error('获取游记详情失败');
      }
    } catch (error) {
      console.error('获取游记详情错误:', error);
      setError(error.message || '获取游记详情失败');
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
      content: '确定要删除这篇游记吗？此操作不可恢复。',
      okText: '确认',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        try {
          const response = await deleteNote(noteId);
          message.success('删除成功');
          router.back();
        } catch (error) {
          console.error('删除错误:', error);
          setError(error.message || '删除失败');
          setErrorModalVisible(true);
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
      // 如果请求成功执行到这里，说明审核操作成功
      // 根据操作类型更新状态字段
      if (newStatus === 'approved') {
        setNote(prev => ({ 
          ...prev, 
          isRejected: false, 
          isChecking: false 
        }));
      } else if (newStatus === 'rejected') {
        setNote(prev => ({ 
          ...prev, 
          isRejected: true, 
          isChecking: false 
        }));
      }
      message.success('状态更新成功');
    } catch (error) {
      console.error('状态更新错误:', error);
      setError(error.message || '状态更新失败');
      // setErrorModalVisible(true);
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

  const getStatusTag = (note) => {
    if (note.isRejected) {
      return (
        <Tag color="red" icon={<CloseOutlined />} className="text-sm font-medium px-3 py-1">
          已拒绝
        </Tag>
      );
    } else if (note.isChecking) {
      return (
        <Tag color="orange" icon={<ExclamationCircleOutlined />} className="text-sm font-medium px-3 py-1">
          审核中
        </Tag>
      );
    } else {
      return (
        <Tag color="green" icon={<CheckOutlined />} className="text-sm font-medium px-3 py-1">
          已通过
        </Tag>
      );
    }
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

  if (!note) {
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
              <div className="text-6xl mb-4">📝</div>
              <Title level={3} className="text-gray-600">游记不存在或已被删除</Title>
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
                {note.isChecking && (
                  <Button 
                    type="primary" 
                    icon={<CheckOutlined />}
                    onClick={() => handleStatusChange('approved')}
                    className="bg-green-500 border-green-500 hover:bg-green-600 shadow-lg"
                    size="large"
                  >
                    通过审核
                  </Button>
                )}
                {!note.isRejected && (
                  <Button 
                    danger
                    icon={<CloseOutlined />}
                    onClick={handleReject}
                    className="shadow-lg"
                    size="large"
                  >
                    拒绝
                  </Button>
                )}
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

          {/* 游记内容 */}
          <div className="p-8">
            {/* 标题和状态 */}
            <div className="mb-8 text-center">
              <div className="flex items-center justify-center space-x-4 mb-6">
                <Title level={1} className="mb-0 text-gray-800 font-bold">{note.title}</Title>
                {getStatusTag(note)}
              </div>
              
              {/* 统计信息 */}
              <div className="flex items-center justify-center space-x-8 text-gray-500 mb-6">
                <div className="flex items-center bg-red-50 px-4 py-2 rounded-full">
                  <HeartOutlined className="mr-2 text-red-400" />
                  <span className="font-medium">{note.likes || 0} 点赞</span>
                </div>
                <div className="flex items-center bg-yellow-50 px-4 py-2 rounded-full">
                  <StarOutlined className="mr-2 text-yellow-400" />
                  <span className="font-medium">{note.collections || 0} 收藏</span>
                </div>
                <div className="flex items-center bg-blue-50 px-4 py-2 rounded-full">
                  <CalendarOutlined className="mr-2 text-blue-400" />
                  <span className="font-medium">{formatDate(note.created_at)}</span>
                </div>
              </div>
            </div>

            {/* 作者信息 */}
            <Card className="mb-8 bg-gradient-to-r from-gray-50 to-blue-50 border-0 shadow-lg rounded-xl">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <UserAvatar user={note.user} size={60} />
                  <Badge status="success" className="absolute -bottom-1 -right-1" />
                </div>
                <div className="flex-1 pl-4">
                  <div className="flex items-center space-x-3 mb-3">
                    <Title level={4} className="mb-0 text-gray-800">{note.user?.username}</Title>
                    <Tag color="blue" icon={<UserOutlined />}>作者</Tag>
                  </div>
                  <div className="flex items-center space-x-6 text-sm text-gray-500">
                    <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                      <MailOutlined className="mr-2 text-blue-400" />
                      {note.user?.email}
                    </span>
                    <span className="flex items-center bg-white px-3 py-1 rounded-full shadow-sm">
                      <CalendarOutlined className="mr-2 text-green-400" />
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
                  <div className="flex items-center space-x-3">
                    <FileImageOutlined className="text-2xl text-blue-500" />
                    <Title level={3} className="mb-0 text-gray-700">图片展示</Title>
                  </div>
                  <Tag color="blue" className="text-sm font-medium px-3 py-1">
                    共 {note.attachments.length} 张图片
                  </Tag>
                </div>
                
                {/* 缩略图网格 */}
                <Row gutter={[20, 20]}>
                  {note.attachments.map((attachment, index) => (
                    <Col key={attachment.id} xs={24} sm={12} md={8} lg={6}>
                      <div 
                        className="relative rounded-xl overflow-hidden cursor-pointer h-56 group shadow-lg hover:shadow-xl transition-all duration-300"
                        onClick={() => openImageModal(index)}
                      >
                        <Image
                          src={attachment.value}
                          alt={`缩略图 ${index + 1}`}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          preview={false}
                        />
                        <div className="absolute top-3 right-3 bg-gray bg-opacity-60 text-black text-sm px-2 py-1 rounded-full font-medium">
                          {index + 1}
                        </div>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            )}

            {/* 游记描述 */}
            <div className="mb-8">
              <div className="flex items-center space-x-3 mb-6">
                <EditOutlined className="text-2xl text-green-500" />
                <Title level={3} className="mb-0 text-gray-700">游记内容</Title>
              </div>
              <Card className="bg-gradient-to-r from-gray-50 to-green-50 border-0 shadow-lg rounded-xl">
                <div className="text-gray-700 whitespace-pre-wrap leading-relaxed text-base">
                  {note.description || '暂无内容'}
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
        width="auto"
        centered
        destroyOnClose
        className="image-view-modal"
        style={{ maxWidth: '90vw' }}
      >
        <div className="relative">
          {/* 删除按钮 */}
          <Button
            type="text"
            icon={<DeleteOutlined />}
            className="absolute top-4 right-4 z-20 text-white bg-black bg-opacity-40 hover:bg-opacity-60 border-none rounded-full"
            onClick={async () => {
              const attachment = note.attachments?.[currentImageIndex];
              if (!attachment) return;

              try {
                await deleteAttachment(attachment.id);
                message.success('删除成功');

                const newAttachments = [...note.attachments];
                newAttachments.splice(currentImageIndex, 1);

                if (newAttachments.length === 0) {
                  setImageModalVisible(false);
                } else {
                  const newIndex = Math.min(currentImageIndex, newAttachments.length - 1);
                  setCurrentImageIndex(newIndex);
                }

                note.attachments = newAttachments;
              } catch (err) {
                setError(err.message || '删除失败');
                setErrorModalVisible(true);
              }
            }}
          />

          {/* 导航按钮 */}
          <Button
            className="absolute left-10 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 border-none text-white hover:bg-opacity-70 rounded-full"
            icon={<RightOutlined />}
            onClick={handlePrevImage}
            size="large"
          />
          <Button
            className="absolute right-10 top-1/2 transform -translate-y-1/2 z-10 bg-black bg-opacity-50 border-none text-white hover:bg-opacity-70 rounded-full"
            icon={<LeftOutlined />}
            onClick={handleNextImage}
            size="large"
          />

          {/* 当前图片 */}
          <div className="flex justify-center items-center" style={{ maxHeight: '70vh' }}>
            <img
              src={note.attachments?.[currentImageIndex]?.value}
              alt={`大图 ${currentImageIndex + 1}`}
              className="max-w-[80vw] max-h-[70vh] object-contain rounded-lg"
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>

          {/* 图片计数器 */}
          <div className="text-center mt-4 text-gray-600 font-medium">
            {currentImageIndex + 1} / {note.attachments?.length}
          </div>

          {/* 键盘提示 */}
          <div className="text-center mt-2 text-xs text-gray-400">
            ← → 切换 | ESC 关闭
          </div>
        </div>
      </Modal>

      {/* 拒绝理由模态框 */}
      <Modal
        title={
          <div className="flex items-center space-x-2">
            <CloseOutlined className="text-red-500" />
            <span>拒绝理由</span>
          </div>
        }
        open={rejectModalVisible}
        onOk={handleRejectConfirm}
        onCancel={handleRejectCancel}
        okText="确认拒绝"
        cancelText="取消"
        okButtonProps={{ danger: true }}
        className="reject-modal"
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
              className="rounded-lg"
            />
          </Form.Item>
        </Form>
      </Modal>

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

export default NoteDetailPage;