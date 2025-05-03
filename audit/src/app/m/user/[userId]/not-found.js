"use client";
import { Empty } from "antd";

export default function UserDetail({ }) {
  return (
    <div className="flex max-w-screen-xl mx-auto flex-wrap">
      <div className="w-full pt-5 pb-0 flex justify-start p-5 lg:pr-0 lg:w-2/3 flex-col gap-5">
        <div className="bg-white p-20 shadow-md rounded w-full">
          <Empty description="用户不存在" />
        </div>
      </div>
    </div>
  );
}
