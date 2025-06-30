"use client";
import {Avatar, Badge, Button, Menu, message} from "antd";
import {useEffect, useState} from "react";
import {
    IdcardOutlined,
    LogoutOutlined,
    UsergroupAddOutlined,
    HomeOutlined,
    BellOutlined,
    FileTextOutlined,
} from "@ant-design/icons";
import {getAvatar} from "@/util/string";
import {logout} from "@/util/logout";
import {useRouter} from '@bprogress/next';
import {useMe} from "@/context/usercontext";
import Link from "next/link";
import {getUnreadNotificationCount} from "@/api/notification";
import useSWR from "swr";

export default function UserTopbar({}) {
    const {meData, mutateMe, userRoleLevel, extraState} = useMe();
    const router = useRouter();
    const [avatar, setAvatar] = useState();
    const [menuItem, setMenuItem] = useState();
    const {data: notificationCount} = useSWR(
        ["notificationCount", meData, extraState],
        async () => {
            if (!meData || !meData?.id) return 0;
            try {
                const response = await getUnreadNotificationCount();
                console.log('未读通知数量响应:', response);
                return response?.count || 0;
            } catch (error) {
                console.error('获取未读通知数量失败:', error);
                return 0;
            }
        },
        {
            refreshInterval: 60000,
            onError: (error) => {
                console.error('SWR获取未读通知数量错误:', error);
            }
        }
    );

    const [messageApi, contextHolder] = message.useMessage();

    useEffect(() => {
        console.log(meData);
        (async () => {
            if (!meData || !meData?.id) return;
            let avatar = getAvatar(meData);
            setAvatar(avatar);
        })();
    }, [meData]);

    /**
     * 默认跳转行为
     * @param {'login' | 'register'} uri
     */
    const defaultOAPush = (uri) => {
        if (uri === '') {
            logout()
                .then(() => mutateMe())
                .catch((error) => {
                    console.error('Error:', error);
                });
        } else {
            //const redirectUrl = encodeURIComponent(window.location.pathname + window.location.search);
            const redirectUrl = encodeURIComponent(
                window.location.pathname?.startsWith("/")
                    ? window.location.pathname + (window.location.search || "")
                    : "/m"
            );
            router.push(`/${uri}?to=${redirectUrl}`);
        }
    }

    const handleLogout = () => {
        logout()
            .then(() => mutateMe())
            .then(() => defaultOAPush('m'))
            .catch((error) => {
                console.error('Error:', error);
            });
    };

    
    const extraDropdown = [
        {
            type: "divider",
        },
        {
            label: "用户管理",
            key: "user_manage",
            icon: <UsergroupAddOutlined/>,
            onClick: () => {
                router.push("/m/user/manage");
            },
        },
    ];

    let userDropdown = [
        {
            label: "个人主页",
            key: "home",
            icon: <HomeOutlined/>,
            onClick: () => {
                router.push(`/m/user/${meData?.id}`);
            },
        },
        {
            label: "信息维护",
            key: "profile",
            icon: <IdcardOutlined/>,
            onClick: () => {
                router.push("/m/user/profile");
            },
        },
        {
            type: "divider",
        },

        {
            label: "退出登录",
            key: "logout",
            icon: <LogoutOutlined/>,
            onClick: handleLogout,
            danger: true,
        },
    ];

    // 这里修改Menu权限
    useEffect(() => {
        if (meData) {
            const renderDropdown = userRoleLevel >= 2
                ? [
                    userDropdown[0],
                    userDropdown[1],
                    ...extraDropdown,
                    userDropdown[2],
                    userDropdown[3],
                ]
                : userDropdown;

            setMenuItem([
                {
                    label: (
                        <div className="flex items-center">
                            <Avatar size="small" src={avatar}/>
                            <span style={{marginLeft: 8}}>{meData?.userName}</span>
                        </div>
                    ),
                    key: "user",
                    children: renderDropdown.map((item) => {
                        if (item.type === "divider") {
                            return {type: "divider"};
                        }

                        return {
                            ...item,
                            onClick: () => {
                                item.onClick();
                            },
                        };
                    }),
                },
            ]);
        }
    }, [avatar, meData, userRoleLevel]); // eslint-disable-line

    return (
        <>
            {contextHolder}
            {meData && (
                <div className="flex gap-0 items-center">
                    <div className={"flex gap-2 items-center"}>
                        {console.log('当前未读通知数量:', notificationCount)}
                        <Badge
                            overflowCount={99}
                            count={notificationCount || 0}
                            size="small"
                            offset={[-5, 5]}
                        >
                            <Link href="/m/notification">
                                <Button type="text" icon={<BellOutlined/>} title={"消息中心"}/>
                            </Link>
                        </Badge>
                    </div>
                    <Menu
                        mode="horizontal"
                        items={menuItem}
                        className="w-40 mr-10"
                        selectedKeys={[]}
                    />
                </div>
            )}
            {!meData && (
                <Menu
                    mode="horizontal"
                    items={[
                        {label: "登录", key: "login"},
                        {label: "注册", key: "register"}
                    ]}
                    className="w-60"
                    onClick={({key}) => defaultOAPush(key)}
                    selectedKeys={[]}
                />
            )}
        </>
    );
}
