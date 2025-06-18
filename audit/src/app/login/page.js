"use client";
import { LockTwoTone, SmileTwoTone,HomeTwoTone,IdcardTwoTone } from "@ant-design/icons";
import {
  LoginForm,
  ProConfigProvider,
  ProFormText,
} from "@ant-design/pro-components";
import Link from "next/link";
import { useEffect, useState, useRef, use } from "react";
import { message, theme, Tabs, App } from "antd";
import { user } from "@/api/index";
import { getSiteConfig } from "@/store/site_config";
import { getUser, setJwtToken, getJwtToken } from "@/store/token";
import { useRouter } from "next/navigation";
import { useConfetti } from "@/components/common/confetti";
import { useMe, MeProvider } from "@/context/usercontext";


const Page = ({ router, to, first }) => {
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { meData, mutateMe } = useMe();
  const { setShowConfetti } = useConfetti();
  const [siteConfig, setSiteConfig] = useState({});
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

  const handleFormLogin = async (values) => {
    if (loading) {
      return;
    }
    setLoading(true);
    try {
      const loginResult = await user.login(values.username, values.password);
      if (loginResult && loginResult.code === 200) {
        console.log(loginResult.data);
        await setJwtToken(loginResult.data.token);
        //await mutateMe();
        setShowConfetti(true);
        message.success("登录成功");
        router.push(to || "/");
      } else {
        throw new Error(loginResult?.message || '登录失败');
      }
    } catch (error) {
      message.error(error.message || "登录失败");
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
        <div className={"p-5 rounded-lg shadow-lg shadow-md backdrop-blur-md"}>
          <div>
            <LoginForm
                logo={<img className="h-[44px]" src="/logo.jpg"/>}
                title="登录"
                subTitle={siteConfig["siteName"] }
                onFinish={handleFormLogin}
            >
              <ProFormText
                  name="username"
                  fieldProps={{
                    size: "middle",
                    prefix: (
                        <SmileTwoTone
                            style={{
                              color: token.colorText,
                            }}
                            className={"prefixIcon"}
                        />
                    ),
                  }}
                  placeholder={"用户名"}
                  rules={[
                    {
                      required: true,
                      message: "请输入用户名!",
                    },
                  ]}
              />
              <ProFormText.Password
                  name="password"
                  fieldProps={{
                    size: "middle",
                    prefix: (
                        <LockTwoTone
                            style={{
                              color: token.colorText,
                            }}
                            className={"prefixIcon"}
                        />
                    ),
                  }}
                  placeholder={"密码"}
                  rules={[
                    {
                      required: true,
                      message: "请输入密码！",
                    },
                  ]}
              />
            </LoginForm>


            {/* 添加登录按钮下方的导航区域，仅显示文字 */}
            <div className="flex gap-6 mt-2 justify-center">
              {/* 返回首页链接 */}
              <Link href="/m" className="flex items-center gap-1">
                <HomeTwoTone className="text-blue-500 text-sm" />
                <span className="text-blue-500 text-sm hover:text-blue-600 transition-colors">返回首页</span>
              </Link>
              {/* 注册链接 */}
              <Link href={"/register" + (to ? `?to=${to}` : "")} className="flex items-center gap-1">
                <IdcardTwoTone className="text-blue-500 text-sm" />
                <span className="text-blue-500 text-sm hover:text-blue-600 transition-colors">点击注册</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
  );
};

export default function Login({ searchParams }) {
  const router = useRouter();
  const unwrappedSearchParams = use(searchParams);
  const to = unwrappedSearchParams?.to;
  const first = unwrappedSearchParams?.first;

  return (
    <App>
      <MeProvider>
        <ProConfigProvider light>
          <Page router={router} to={to} first={first} />
        </ProConfigProvider>
      </MeProvider>
    </App>
  );
}
