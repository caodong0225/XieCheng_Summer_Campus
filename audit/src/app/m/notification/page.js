"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { Empty, Badge, Button, message, Skeleton, Spin, Popconfirm } from "antd";
import { DeleteOutlined } from "@ant-design/icons";
import DOMPurify from "dompurify";
import { getNotificationList, readNotification, readAllNotification, deleteNotification } from "@/api/notification";
import { calcTimeDelta } from "@/util/string";
import { useMe } from "@/context/usercontext";
import { useRouter } from 'next/navigation';

export default function UserNotificationPage() {
  const [filterMode, setFilterMode] = useState("all");
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [pagination, setPagination] = useState({
    pageNum: 1,
    pageSize: 10,
    total: 0,
    pages: 0
  });
  const { SetExtraState } = useMe();
  const observerRef = useRef();
  const loadingRef = useRef();

  const fetchNotifications = async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const params = new URLSearchParams();
      params.append("pageNum", page.toString());
      params.append("pageSize", "10");
      if (filterMode === "unread") {
        params.append("unread", "true");
      }
      
      const response = await getNotificationList(params.toString());
      console.log('通知列表API响应:', response);
      
      if (response && response.list) {
        const { list, pageNum, pageSize, total, pages } = response;
        
        if (append) {
          setNotifications(prev => [...prev, ...(list || [])]);
        } else {
          setNotifications(list || []);
        }
        
        setPagination({
          pageNum,
          pageSize,
          total,
          pages
        });
        
        setHasMore(pageNum < pages);
        SetExtraState(Date.now());
      } else {
        throw new Error('获取通知列表失败');
      }
    } catch (error) {
      console.error('获取通知列表失败:', error);
      message.error('获取通知列表失败');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    fetchNotifications(1, false);
  }, [filterMode]);

  const handleReadAll = async () => {
    try {
      await readAllNotification();
      message.success('全部标记为已读');
      fetchNotifications(1, false);
    } catch (error) {
      console.error('标记全部已读失败:', error);
      message.error('标记全部已读失败');
    }
  };

  const handleRefresh = () => {
    fetchNotifications(1, false);
  };

  // 无限滚动加载
  const lastElementRef = useCallback(node => {
    if (loading || loadingMore) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        const nextPage = pagination.pageNum + 1;
        fetchNotifications(nextPage, true);
      }
    });
    
    if (node) observerRef.current.observe(node);
  }, [loading, loadingMore, hasMore, pagination.pageNum]);

  return (
    <>
      <main className={"min-h-[100vh] bg-gray-50"}>
        <div className={"flex items-center justify-center"}>
          <div
            className={
              "w-full lg:w-[768px] bg-white m-5 rounded-md shadow-xl overflow-hidden"
            }
          >
            <h1
              className={
                "p-5 text-center font-bold text-gray-900 text-2xl pb-2"
              }
            >
              通知中心
            </h1>
            <div
              className={
                "flex items-center gap-3 pr-5 justify-end p-3 text-blue-500 pt-0"
              }
            >
              <div
                className={
                  "hover:text-blue-400 active:text-blue-200 cursor-pointer select-none"
                }
                onClick={() =>
                  setFilterMode(filterMode === "unread" ? "all" : "unread")
                }
              >
                {filterMode === "unread" ? "仅看未读" : "全部"}
              </div>
              <div
                className={
                  "hover:text-blue-400 active:text-blue-200 cursor-pointer select-none"
                }
                onClick={handleReadAll}
              >
                全部标为已读
              </div>
            </div>
            <div className={"flex flex-col divide-y min-h-[500px]"}>
              {loading ? (
                <div className="p-5">
                  {[1, 2, 3, 4, 5].map(item => (
                    <div key={item} className="mb-4">
                      <Skeleton active paragraph={{ rows: 2 }} />
                    </div>
                  ))}
                </div>
              ) : notifications.length === 0 ? (
                <Empty className={"p-5"} description={"没有通知"} />
              ) : (
                <>
                  {notifications.map((notification, index) => {
                    const isLast = index === notifications.length - 1;
                    return (
                      <div key={notification.id || index} ref={isLast ? lastElementRef : null}>
                        <Notification 
                          data={notification} 
                          onRefresh={handleRefresh} 
                        />
                      </div>
                    );
                  })}
                  
                  {/* 加载更多指示器 */}
                  {loadingMore && (
                    <div className="p-5 text-center">
                      <Spin size="small" />
                      <span className="ml-2 text-gray-500">加载更多...</span>
                    </div>
                  )}
                  
                  {/* 没有更多数据提示 */}
                  {!hasMore && notifications.length > 0 && (
                    <div className="p-5 text-center text-gray-500 text-sm">
                      没有更多通知了
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function Notification({ data, onRefresh }) {
  const [isRead, setIsRead] = useState(data?.is_read === 1);
  const [deleting, setDeleting] = useState(false);
  const router = useRouter();
  const userRegex = /<user id="(\d+)">(.*?)<\/user>/g;
  const threadRegex = /<note id="(\d+)">(.*?)<\/note>/g;
  
  // 测试正则表达式
  console.log('测试用户正则:', userRegex.test(data?.content));
  console.log('测试游记正则:', threadRegex.test(data?.content));
  
  // 手动测试匹配
  const userMatches = data?.content.match(userRegex);
  const threadMatches = data?.content.match(threadRegex);
  console.log('用户匹配结果:', userMatches);
  console.log('游记匹配结果:', threadMatches);
  
  const linkClass =
    "text-blue-600 hover:text-blue-800 active:text-blue-900 cursor-pointer select-none ml-1 mr-1 hover:underline transition-all font-medium bg-blue-50 hover:bg-blue-100 px-1 py-0.5 rounded";

  // 修改正则替换逻辑 - 使用CSS类代替内联样式
  const parsedContent = data?.content
    .replaceAll(userRegex, (match, userId, username) => {
      console.log('匹配到用户:', { match, userId, username });
      return `<a href="/m/user/${userId}" class="notification-link">${username}</a>`;
    })
    .replaceAll(threadRegex, (match, threadId, title) => {
      console.log('匹配到游记:', { match, threadId, title });
      return `<a href="/m/audit/${threadId}" class="notification-link">${title}</a>`;
    });

  console.log('原始内容:', data?.content);
  console.log('解析后内容:', parsedContent);

  const sanitizedContent = DOMPurify.sanitize(parsedContent);

  const handleDotClick = async () => {
    if (isRead) return;
    
    setIsRead(true);
    try {
      await readNotification(data?.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("无法同步已读状态", error);
      message.error('标记已读失败');
      setIsRead(false); // 恢复状态
    }
  };

  const handleDelete = async () => {
    if (deleting) return;
    
    setDeleting(true);
    try {
      await deleteNotification(data?.id);
      message.success('删除成功');
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error("删除通知失败", error);
      message.error('删除失败');
    } finally {
      setDeleting(false);
    }
  };

  const handleNotificationClick = async (e) => {
    // 如果点击的是链接或删除按钮，不处理
    if (e.target.tagName === 'A' || e.target.closest('.delete-btn')) {
      return;
    }
    
    // 如果通知未读，先标记为已读
    if (!isRead) {
      setIsRead(true);
      try {
        await readNotification(data?.id);
        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error("标记已读失败", error);
        message.error('标记已读失败');
        setIsRead(false); // 恢复状态
        return; // 如果标记已读失败，不执行后续操作
      }
    }
    
    // 处理通知点击逻辑
    if (data?.link) {
      router.push(data.link);
    }
  };

  return (
    <div 
      className="border-t border-gray-100 hover:bg-green-50 transition-background cursor-pointer"
      onClick={handleNotificationClick}
    >
      <div className={"flex flex-col p-5 gap-1.5"}>
        <div className="flex flex-wrap gap-2 text-gray-750 text-medium">
          <NotificationDot isRead={isRead} onClick={handleDotClick} />
          <span className="flex-1">
            <div className="font-medium mb-1">{data?.title}</div>
            <span dangerouslySetInnerHTML={{ __html: sanitizedContent }} />
          </span>
          <div className="delete-btn">
            <Popconfirm
              title="确定要删除这条通知吗？"
              onConfirm={handleDelete}
              okText="确定"
              cancelText="取消"
              placement="left"
            >
              <Button
                type="text"
                icon={<DeleteOutlined />}
                size="small"
                loading={deleting}
                className="text-gray-400 hover:text-red-500 transition-colors"
                onClick={(e) => e.stopPropagation()}
              />
            </Popconfirm>
          </div>
        </div>
        <div className={"flex justify-between items-center text-gray-500 text-sm"}>
          <span className="text-xs rounded">
          </span>
          <span className={"flex items-center"}>
            {calcTimeDelta(data?.created_at)}
          </span>
        </div>
      </div>
    </div>
  );
}

function NotificationDot({ isRead, onClick }) {
  return (
    <div className="flex flex-col">
      <Badge
        className=""
        count={
          <span
            className={`notification-dot ${isRead ? 'read' : ''} rounded-full w-2.5 h-2.5 min-w-2.5 min-h-2.5 mt-1.5 ${
              !isRead ? 'cursor-pointer hover:bg-blue-400' : ''
            }`}
            onClick={!isRead ? onClick : undefined}
            style={{
              backgroundColor: isRead ? '#d1d5db' : '#3b82f6'
            }}
          />
        }
        size="small"
      />
    </div>
  );
}

