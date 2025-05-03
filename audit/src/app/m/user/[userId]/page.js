"use client";
import { useEffect, use } from "react";
import { notFound, useRouter } from "next/navigation";
import { user } from "@/api/index";
import { Tabs, Tag } from "antd";
import useSWR from "swr";
import { getAvatar, timestampToDateTime } from "@/util/string";
import UserAvatar from "@/components/common/user_avatar";
import MarkdownRenderer from "@/components/common/markdown/md_renderer";

export default function UserHomePage({ params }) {
  const resolvedParams = use(params);
  const { userId } = resolvedParams;
  const router = useRouter();
  const { data: userData, error } = useSWR(["user", userId], async () => {
    return await user.getUserById(userId);
  });

  useEffect(() => {
    if (error) {
      notFound();
    }
  }, [error]); // eslint-disable-line

  return (
    <div className="flex max-w-screen-lg mx-auto flex-wrap pb-10">
      <div className="flex flex-col w-full gap-5 px-5">
        <div className={"mt-5 bg-white rounded-md w-full shadow-md"}>
          <div className="bg-gray-100 rounded-md relative flex items-center flex-wrap ">
            <div className="w-full h-full bg-[rgba(100,100,100,0.5)] p-10 pb-15 z-10 flex items-center flex-wrap backdrop-blur-lg">
              <div className="pb-5 px-10 md:pb-0 md:px-0 flex items-center">
                <UserAvatar user={userData} size={80} />
              </div>
              <div className="ml-10">
                <div className="text-2xl font-bold flex items-center gap-2 text-white">
                  {userData?.username}{" "}
                  {userData?.role != null && (
                    userData?.role === "super-admin" ? (
                      <Tag color="red" key={'super-admin'}>管理员</Tag>
                    ) : userData?.role === "admin" ? (
                      <Tag color="orange" key={'admin'}>审核人员</Tag>
                    ) : <Tag color="blue" key={'guest'}>普通用户</Tag>
                  )}
                </div>
                <div className="text-gray-200">{userData?.email}</div>
                <div className="text-gray-300 mt-1.5">
                  <span>注册于 </span>
                  <span>{timestampToDateTime(userData?.created_at)}</span>
                </div>
              </div>
            </div>
            {/* eslint-disable-next-line */}
            <img
              src="/bg.jpg"
              alt="background"
              className="fixed top-0 left-0 z-0 object-cover absolute right-0 bottom-0 w-full h-full"
            />
          </div>

          <div>
            <Tabs
              defaultActiveKey="1"
              className="bg-white"
              style={{ padding: "0 10px", minHeight: "500px" }}
              tabBarStyle={{
                paddingLeft: "20px",
                paddingRight: "20px",
              }}
            >
              <Tabs.TabPane tab="个人简介" key="1">
                <div className="px-5">
                  <MarkdownRenderer>
                    {userData?.userExtraInfo?.description ||
                      "这个人很懒，什么都没留下"}
                  </MarkdownRenderer>
                </div>
              </Tabs.TabPane>
            </Tabs>
          </div>    
        </div>
      </div>
    </div>
  );
}
