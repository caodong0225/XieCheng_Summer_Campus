'use client';

import { 
  Tag, 
  List, 
  Avatar, 
  Skeleton, 
  message, 
  Pagination, 
  Space, 
  Typography, 
  Select, 
  Input, 
  Button, 
  Card, 
  Row, 
  Col,
  Dropdown,
  Modal,
  Form
} from "antd";
import { 
  SearchOutlined, 
  FilterOutlined, 
  MoreOutlined,
  DeleteOutlined,
  CheckOutlined,
  CloseOutlined,
  EyeOutlined
} from '@ant-design/icons';
import { useState, useEffect } from 'react';
import { getNoteAll, auditNote, deleteNote } from '../../../api/note';
import { useRouter } from 'next/navigation';

const { Text, Title } = Typography;
const { Option } = Select;
const { Search } = Input;
const { TextArea } = Input;

const AuditPage = () => {
  const router = useRouter();
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  
  // 筛选状态
  const [filters, setFilters] = useState({
    status: '',
    title: '',
    username: ''
  });

  // 排序状态
  const [sortConfig, setSortConfig] = useState({
    field: 'id',
    order: 'desc'
  });

  // 拒绝理由相关状态
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectingNoteId, setRejectingNoteId] = useState(null);
  const [rejectForm] = Form.useForm();

  const fetchNotes = async (page = 1, pageSize = 10) => {
    try {
      setLoading(true);
      const params = {
        pageNum: page,
        pageSize: pageSize,
        sort: sortConfig.field,
        order: sortConfig.order,
        ...filters
      };
      
      // 移除空值
      Object.keys(params).forEach(key => {
        if (params[key] === '' || params[key] === null || params[key] === undefined) {
          delete params[key];
        }
      });
      
      const response = await getNoteAll(params);
      
      if (response.success) {
        setNotes(response.list || []);
        setPagination({
          current: page,
          pageSize: pageSize,
          total: response.total || 0
        });
      } else {
        message.error('获取游记列表失败');
      }
    } catch (error) {
      console.error('获取游记列表错误:', error);
      message.error('获取游记列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [filters, sortConfig]);

  const handlePageChange = (page, pageSize) => {
    fetchNotes(page, pageSize);
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSearch = (value) => {
    setFilters(prev => ({
      ...prev,
      title: value
    }));
  };

  const handleSearchInputChange = (e) => {
    setFilters(prev => ({
      ...prev,
      title: e.target.value
    }));
  };

  const handleStatusChange = async (noteId, newStatus, rejectReason = '') => {
    try {
      const auditData = { status: newStatus };
      if (newStatus === 'rejected' && rejectReason) {
        auditData.rejectReason = rejectReason;
      }
      
      const response = await auditNote(noteId, auditData);
      if (response.success) {
        message.success('状态更新成功');
        // 更新本地状态
        setNotes(prev => prev.map(note => 
          note.id === noteId ? { ...note, status: newStatus } : note
        ));
      } else {
        message.error('状态更新失败');
      }
    } catch (error) {
      console.error('状态更新错误:', error);
      message.error('状态更新失败');
    }
  };

  const handleDelete = (noteId) => {
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
            fetchNotes(pagination.current, pagination.pageSize);
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

  const handleReject = (noteId) => {
    setRejectingNoteId(noteId);
    setRejectModalVisible(true);
    rejectForm.resetFields();
  };

  const handleRejectConfirm = async () => {
    try {
      const values = await rejectForm.validateFields();
      await handleStatusChange(rejectingNoteId, 'rejected', values.rejectReason);
      setRejectModalVisible(false);
      setRejectingNoteId(null);
      rejectForm.resetFields();
    } catch (error) {
      console.error('表单验证错误:', error);
    }
  };

  const handleRejectCancel = () => {
    setRejectModalVisible(false);
    setRejectingNoteId(null);
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

  const getStatusOptions = (currentStatus) => {
    const allStatuses = [
      { value: 'checking', label: '审核中', icon: <FilterOutlined /> },
      { value: 'approved', label: '通过', icon: <CheckOutlined /> },
      { value: 'rejected', label: '拒绝', icon: <CloseOutlined /> }
    ];
    
    return allStatuses.filter(status => status.value !== currentStatus);
  };

  const handleSortChange = (field, order) => {
    setSortConfig({ field, order });
  };

  const handleViewNote = (noteId) => {
    router.push(`/m/audit/${noteId}`);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
        <div className="container mx-auto px-4 py-8">
          <div className="bg-white p-6 shadow-lg rounded-lg">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">游记审批管理</h1>
            <List
              itemLayout="horizontal"
              dataSource={[1, 2, 3, 4, 5]}
              renderItem={() => (
                <List.Item>
                  <Skeleton active avatar paragraph={{ rows: 2 }} />
                </List.Item>
              )}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white p-6 shadow-lg rounded-lg">
          <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">游记审批管理</h1>
          
          {/* 筛选区域 */}
          <Card className="mb-6" title="筛选条件" extra={<FilterOutlined />}>
            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>状态筛选：</Text>
                  <Select
                    placeholder="选择状态"
                    style={{ width: '100%', marginTop: 8 }}
                    value={filters.status}
                    onChange={(value) => handleFilterChange('status', value)}
                    allowClear
                  >
                    <Option value="checking">审核中</Option>
                    <Option value="approved">已通过</Option>
                    <Option value="rejected">已拒绝</Option>
                  </Select>
                </div>
              </Col>
            
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>排序字段：</Text>
                  <Select
                    placeholder="选择排序字段"
                    style={{ width: '100%', marginTop: 8 }}
                    value={sortConfig.field}
                    onChange={(value) => handleSortChange(value, sortConfig.order)}
                  >
                    <Option value="id">ID</Option>
                    <Option value="title">标题</Option>
                    <Option value="created_at">创建时间</Option>
                    <Option value="updated_at">更新时间</Option>
                    <Option value="username">作者</Option>
                    <Option value="status">状态</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={12} md={6}>
                <div>
                  <Text strong>排序方向：</Text>
                  <Select
                    placeholder="选择排序方向"
                    style={{ width: '100%', marginTop: 8 }}
                    value={sortConfig.order}
                    onChange={(value) => handleSortChange(sortConfig.field, value)}
                  >
                    <Option value="asc">升序</Option>
                    <Option value="desc">降序</Option>
                  </Select>
                </div>
              </Col>
              <Col xs={24} sm={24} md={24}>
                <div>
                  <Text strong>标题搜索：</Text>
                  <Search
                    placeholder="搜索标题"
                    style={{ marginTop: 8 }}
                    onSearch={handleSearch}
                    onInput={handleSearchInputChange}
                    allowClear
                  />
                </div>
              </Col>
            </Row>
          </Card>
          
          {/* 游记列表 */}
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              暂无游记数据
            </div>
          ) : (
            <>
              <List
                itemLayout="horizontal"
                dataSource={notes}
                renderItem={(note) => (
                  <List.Item
                    actions={[
                      <Space key="actions" size="small">
                        {note.status !== 'approved' && (
                          <Button
                            size="small"
                            type="primary"
                            icon={<CheckOutlined />}
                            onClick={() => handleStatusChange(note.id, 'approved')}
                          >
                            通过
                          </Button>
                        )}
                        {note.status !== 'rejected' && (
                          <Button
                            size="small"
                            type="text"
                            danger
                            icon={<CloseOutlined />}
                            onClick={() => handleReject(note.id)}
                          >
                            拒绝
                          </Button>
                        )}
                        <Button
                          size="small"
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleDelete(note.id)}
                        >
                          删除
                        </Button>
                      </Space>
                    ]}
                  >
                    <List.Item.Meta
                      avatar={
                        <div className="flex items-center space-x-3">
                          {note.attachments && note.attachments.length > 0 && (
                            <div className="relative w-16 h-16 rounded overflow-hidden">
                              <img
                                alt={note.title}
                                src={note.attachments[0].value}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.src = '/placeholder-image.jpg';
                                }}
                              />
                              {note.attachments.length > 1 && (
                                <div className="absolute top-0 right-0 bg-black bg-opacity-50 text-white px-1 py-0.5 rounded text-xs">
                                  +{note.attachments.length - 1}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      }
                      title={
                        <div className="flex items-center space-x-2">
                          <Title 
                            level={4} 
                            className="mb-0 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                            onClick={() => handleViewNote(note.id)}
                          >
                            {note.title}
                          </Title>
                          {getStatusTag(note.status)}
                          <Button
                            size="small"
                            type="text"
                            icon={<EyeOutlined />}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewNote(note.id);
                            }}
                            title="查看详情"
                          />
                        </div>
                      }
                      description={
                        <div className="space-y-2">
                          <Text className="line-clamp-2 text-gray-600">
                            {note.description}
                          </Text>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>创建时间: {formatDate(note.created_at)}</span>
                            <span>更新时间: {formatDate(note.updated_at)}</span>
                            <span>作者: {note.username}</span>
                            <span>邮箱: {note.email}</span>
                          </div>
                        </div>
                      }
                    />
                  </List.Item>
                )}
              />
              
              <div className="mt-6 flex justify-center">
                <Pagination
                  current={pagination.current}
                  pageSize={pagination.pageSize}
                  total={pagination.total}
                  onChange={handlePageChange}
                  showSizeChanger={false}
                  showQuickJumper
                  showTotal={(total, range) => 
                    `第 ${range[0]}-${range[1]} 条，共 ${total} 条`
                  }
                />
              </div>
            </>
          )}
        </div>
      </div>

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

export default AuditPage;
