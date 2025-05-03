"use client";

import { EditOutlined, EyeOutlined } from "@ant-design/icons";
import MonacoEditor from "@monaco-editor/react";
import { loader } from '@monaco-editor/react';
import MarkdownRenderer from "@/components/common/markdown/md_renderer";
import { Tabs } from "antd";


export default function MarkdownEditor({ value, onChange }) {
  return (
    <Tabs
      defaultActiveKey="1"
      type="card"
      tabBarGutter={0}
      tabBarStyle={{
        padding: 0,
        margin: 0,
      }}
      items={[
        {
          label: "编辑",
          key: "1",
          icon: <EditOutlined />,
          children: (
            <div className="py-4">
              <MonacoEditor
                language="markdown"
                theme="vs-light"
                value={value}
                height={300}
                width={"100%"}
                options={{
                  selectOnLineNumbers: true,
                }}
                onChange={onChange}
              />
            </div>
          ),
        },
        {
          label: "预览",
          key: "2",
          icon: <EyeOutlined />,
          children: (
            <div
              className="h-[300px] overflow-y-auto m-4"
              style={{ maxHeight: "300px" }}
            >
              <MarkdownRenderer>{value}</MarkdownRenderer>
            </div>
          ),
        },
      ]}
    ></Tabs>
  );
}
