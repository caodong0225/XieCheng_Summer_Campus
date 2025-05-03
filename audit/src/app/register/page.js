"use client";
import Link from "next/link";
import { message, theme, Form, Tabs } from "antd";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {HomeTwoTone, IdcardTwoTone, LockOutlined, UserOutlined, MailOutlined} from "@ant-design/icons";
import {
  LoginForm,
  ProConfigProvider,
  ProFormText,
} from "@ant-design/pro-components";
import { user } from "@/api/index";
import { getSiteConfig } from "@/store/site_config";
import { useMe, MeProvider } from "@/context/usercontext";
const { TabPane } = Tabs;
const usernamePattern = /^[a-zA-Z0-9_]+$/;
const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[^]{8,32}$/;
const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const Page = ({ data = null, router, to }) => {
  const [form] = Form.useForm();
  const { meData, mutateMe } = useMe();
  const { token } = theme.useToken();
  const [siteConfig, setSiteConfig] = useState({});
  const [messageApi, contextHolder] = message.useMessage();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    (async () => {
      const _me = await mutateMe();
      if (_me) {
        router.push(to || "/");
      }
    })();
  }, [router, to]);

  useEffect(() => {
    (async () => {
      setSiteConfig(await getSiteConfig());
    })();
  }, []);

  const handleRegister = async (values) => {
    if (loading) return;
    
    try {
      setLoading(true);
      messageApi.open({
        key: "register",
        type: "loading",
        content: "注册中...",
        duration: 0,
      });

      await user.register(values.username, values.password, values.email);
      
      messageApi.open({
        key: "register",
        type: "success",
        content: "注册成功，请登录",
        duration: 2,
        onClose: () => {
          router.push("/login?to=" + (to || "/") + "&first=1");
        },
      });
    } catch (error) {
      messageApi.open({
        key: "register",
        type: "error",
        content: error?.message || "注册失败",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundImage: "url(/background.jpg)",
      }}
      className={"flex items-center justify-center flex-col h-[100vh]"}
    >
      {contextHolder}
      <div className={"p-6 rounded-lg shadow-lg shadow-md backdrop-blur-md"}>
        <LoginForm
          form={form}
          logo={<img className="h-[44px]" src="/logo.jpg" />}
          title="注册"
          subTitle={siteConfig["siteName"] ?? "Singularity"}
          onFinish={handleRegister}
          submitter={{
            searchConfig: {
              submitText: '注册',
            },
            submitButtonProps: {
              type: 'primary',
              loading: loading,
            },
          }}
        >
          <ProFormText
            name="username"
            fieldProps={{
              size: "large",
              prefix: <UserOutlined />,
            }}
            placeholder={"用户名"}
            rules={[
              {
                required: true,
                message: "请输入用户名!",
              },
              {
                pattern: usernamePattern,
                message: "用户名只能包含字母、数字和下划线",
              },
            ]}
          />
        
          <ProFormText.Password
            name="password"
            fieldProps={{
              size: "large",
              prefix: <LockOutlined />,
            }}
            placeholder={"密码"}
            rules={[
              {
                required: true,
                message: "请输入密码！",
              },
              {
                pattern: passwordPattern,
                message: "密码长度为8-32位，必须包含大小写字母和数字",
              },
            ]}
          />
          <ProFormText.Password
            name="repassword"
            fieldProps={{
              size: "large",
              prefix: <LockOutlined />,
            }}
            placeholder={"确认密码"}
            dependencies={["password"]}
            rules={[
              {
                required: true,
                message: "请输入密码！",
              },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue("password") === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error("两次输入的密码不一致!"));
                },
              }),
            ]}
          />
          {/* 邮箱 */}
          <ProFormText
            name="email"
            fieldProps={{
              size: "large",
              prefix: <MailOutlined />,
            }}
            placeholder={"邮箱"}
            rules={[
              {
                required: true,
                message: "请输入邮箱！",
              },
              {
                pattern: emailPattern,
                message: "请输入正确的邮箱格式",
              },
            ]}
          />  
        </LoginForm>
        <div className="flex gap-4 -mt-3 justify-center">
          <Link href="/m" className="flex items-center gap-1">
            <HomeTwoTone className="text-blue-500 text-sm" />
            <span className="text-blue-500 text-sm hover:text-blue-600 transition-colors">返回首页</span>
          </Link>
          <Link href={"/login" + (to ? "?to=" + to : "")} className="flex items-center gap-1">
            <IdcardTwoTone className="text-blue-500 text-sm" />
            <span className="text-blue-500 text-sm hover:text-blue-600 transition-colors">已有账号，点击登录</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default function Register({ searchParams }) {
  const router = useRouter();
  let { to, data } = searchParams;
  if (data) {
    console.log("data", data);
  }

  return (
    <MeProvider>
      <ProConfigProvider light>
        <Page router={router} to={to} data={data} />
      </ProConfigProvider>
    </MeProvider>
  );
}
