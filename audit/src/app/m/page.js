'use client';

import ReactMarkdown from 'react-markdown';
import { Tag, Select, Input, Button, Form, Skeleton, Table, Pagination, message } from "antd";
import remarkGfm from 'remark-gfm';
import { useState, useEffect, createContext, useContext } from 'react';
import TextArea from 'antd/lib/input/TextArea';

// 创建上下文用于共享刷新函数
const JobsContext = createContext({
  refreshJobs: () => {},
});

const WelcomeContent = () => {
  const [isWelcomeLoading, setIsWelcomeLoading] = useState(true);
  const [welcomeData, setWelcomeData] = useState(null);
  


  useEffect(() => {
    // 模拟加载数据
    setTimeout(() => {
      setIsWelcomeLoading(false);
    }, 500);
  }, []);

  if (isWelcomeLoading) {
      return (
          <div className="bg-white p-4 shadow-md rounded w-full">
              <Skeleton active />
          </div>
      );
  }

  const defaultContent = `
本平台是一个招聘平台，用来整理招聘公司信息。

平台手搓RPC架构，注册中心采用Tomcat+Redis的结构，客户端采用前后端分离的架构，前端使用NextJS+Tailwindcss的架构，后端使用Springboot，通过Feign的方式访问远程服务器的方法，服务端采用Springboot+MybatisPlus的架构，由JWT的方式实现跨平台数据访问。
  `;

  return (
      <div className="bg-white p-4 shadow-md rounded w-full">
          <h2 className="text-2xl font-bold">{welcomeData?.title || "欢迎来到求职网站"}</h2>
          <div className="mt-5 markdown-content">
              <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                      // 自定义链接在新标签页打开
                      a: ({node, ...props}) => (
                          <a target="_blank" rel="noopener noreferrer" {...props} />
                      ),
                      // 保持段落的样式
                      p: ({node, ...props}) => (
                          <p className="mb-4" {...props} />
                      ),
                      // 保持标题的样式
                      h1: ({node, ...props}) => (
                          <h1 className="text-2xl font-bold mb-4" {...props} />
                      ),
                      h2: ({node, ...props}) => (
                          <h2 className="text-xl font-bold mb-3" {...props} />
                      ),
                      h3: ({node, ...props}) => (
                          <h3 className="text-lg font-bold mb-2" {...props} />
                      ),
                      // 保持列表的样式
                      ul: ({node, ...props}) => (
                          <ul className="list-disc list-inside mb-4" {...props} />
                      ),
                      ol: ({node, ...props}) => (
                          <ol className="list-decimal list-inside mb-4" {...props} />
                      ),
                      // 保持代码块的样式
                      code: ({node, inline, ...props}) => (
                          inline ? 
                          <code className="bg-gray-100 px-1 rounded" {...props} /> :
                          <code className="block bg-gray-100 p-4 rounded mb-4" {...props} />
                      )
                  }}
              >
                  {welcomeData?.contentExt?.contentMarkdown || defaultContent}
              </ReactMarkdown>
          </div>
      </div>
  );
};


export default function Home() {
  // 创建一个ref用于存储刷新函数
  const refreshJobsRef = { current: () => {} };

  return (
    <JobsContext.Provider value={{ refreshJobs: refreshJobsRef }}>
      <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg.jpg')" }}>
        <div className="flex max-w-screen-xl mx-auto flex-wrap pb-5">
          <div className="w-full md:w-1/2 p-5 lg:w-1/3 gap-5 flex flex-col">
            <WelcomeContent />
          </div>
        </div>
      </div>
    </JobsContext.Provider>
  );
}
  