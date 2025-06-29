'use client';

import ReactMarkdown from 'react-markdown';
import { Tag, List, Avatar, Skeleton, message, Pagination, Space, Typography, Button, Spin } from "antd";
import remarkGfm from 'remark-gfm';
import { useState, useEffect } from 'react';
import { getNoteAll } from '@/api/note';
import { useRouter } from 'next/navigation';
import { useMe } from "@/context/usercontext";

const { Text, Title } = Typography;

const ArchitectureSection = () => {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setIsLoading(false);
        }, 500);
    }, []);

    if (isLoading) {
        return (
            <div className="bg-white p-6 shadow-lg rounded-lg mb-8">
                <Skeleton active />
            </div>
        );
    }

    const architectureContent = `
# 技术架构说明

## 平台概述
携程集团前端大作业
  `;

    return (
        <div className="bg-white p-6 shadow-lg rounded-lg mb-8">
            <h1 className="text-3xl font-bold mb-6 text-center text-blue-600">技术架构说明</h1>
            <div className="markdown-content">
                <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                        h1: ({node, ...props}) => (
                            <h1 className="text-2xl font-bold mb-4 text-blue-600" {...props} />
                        ),
                        h2: ({node, ...props}) => (
                            <h2 className="text-xl font-bold mb-3 text-gray-800" {...props} />
                        ),
                        h3: ({node, ...props}) => (
                            <h3 className="text-lg font-bold mb-2 text-gray-700" {...props} />
                        ),
                        p: ({node, ...props}) => (
                            <p className="mb-4 text-gray-600 leading-relaxed" {...props} />
                        ),
                        ul: ({node, ...props}) => (
                            <ul className="list-disc list-inside mb-4 text-gray-600" {...props} />
                        ),
                        li: ({node, ...props}) => (
                            <li className="mb-1" {...props} />
                        ),
                        strong: ({node, ...props}) => (
                            <strong className="font-semibold text-gray-800" {...props} />
                        )
                    }}
                >
                    {architectureContent}
                </ReactMarkdown>
            </div>
        </div>
    );
};

const NotesSection = () => {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0
    });
    const router = useRouter();

    const fetchNotes = async (page = 1, pageSize = 10) => {
        try {
            setLoading(true);
            const params = {
                pageNum: page,
                pageSize: pageSize
            };

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

                // 检查未登录错误
                if (response.code === 401 || response.code === 403) {
                    const redirectUrl = encodeURIComponent(window.location.pathname);
                    router.push(`/login?to=${redirectUrl}`);
                }
            }
        } catch (error) {
            console.error('获取游记列表错误:', error);
            message.error('获取游记列表失败');

            // 捕获未登录错误
            if (error.code === 401 || error.code === 403) {
                const redirectUrl = encodeURIComponent(window.location.pathname);
                router.push(`/login?to=${redirectUrl}`);
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotes();
    }, []);

    const handlePageChange = (page, pageSize) => {
        fetchNotes(page, pageSize);
    };

    // 计算分页显示范围
    const getPaginationRange = () => {
        const { current, pageSize, total } = pagination;
        const start = (current - 1) * pageSize + 1;
        const end = Math.min(current * pageSize, total);
        return { start, end };
    };

    // 处理点击游记跳转
    const handleNoteClick = (noteId) => {
        router.push(`/m/audit/${noteId}`);
    };

    const getStatusTag = (status) => {
        const statusMap = {
            'checking': { color: 'orange', text: '审核中' },
            'approved': { color: 'green', text: '已通过' },
            'rejected': { color: 'red', text: '已拒绝' },
            'draft': { color: 'default', text: '草稿' }
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

    if (loading) {
        return (
            <div className="bg-white p-6 shadow-lg rounded-lg">
                <h2 className="text-2xl font-bold mb-6 text-center text-green-600">游记列表</h2>
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
        );
    }

    return (
        <div className="bg-white p-6 shadow-lg rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-center text-green-600">游记列表</h2>

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
                                className="cursor-pointer hover:bg-gray-50 transition-colors duration-200 rounded-lg p-2"
                                onClick={() => handleNoteClick(note.id)}
                                actions={[
                                    getStatusTag(note.status),
                                    <Text key="author" type="secondary" className="text-sm">
                                        {note.username}
                                    </Text>
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
                                            <Title level={4} className="mb-0 line-clamp-1 hover:text-blue-600 transition-colors">
                                                {note.title}
                                            </Title>
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
                            showTotal={(total, range) => {
                                const { start, end } = getPaginationRange();
                                return `第 ${pagination.current} 页，显示 ${start}-${end} 条，共 ${total} 条游记`;
                            }}
                        />
                    </div>
                </>
            )}
        </div>
    );
};

export default function Home() {
    const { meData, isLoading: isUserLoading } = useMe(); // 假设useMe提供isLoading状态
    const router = useRouter();

    // 添加加载状态
    const [isCheckingAuth, setIsCheckingAuth] = useState(true);

    // 检查用户是否已登录
    const isAuthenticated = !!meData;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            <div className="container mx-auto px-4 py-8">
                {/* 上部分：技术架构说明 */}
                <ArchitectureSection />

                {/* 下部分：游记列表 - 传递认证状态 */}
                <NotesSection />
            </div>
        </div>
    );
}