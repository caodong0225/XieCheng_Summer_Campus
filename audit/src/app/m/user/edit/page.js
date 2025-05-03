"use client";
import { Button, Spin } from "antd";
import { useEffect, useState } from "react";
import { ProForm, ProFormText } from "@ant-design/pro-components";
import { useRouter } from '@bprogress/next';
import { user } from "@/api/index";
import { message } from "antd";
import useSWR from "swr";
import { LeftOutlined } from "@ant-design/icons";

const passwordRegex =
  /^[a-zA-Z0-9~!@#$%^&*()_+`\-={}|\[\]\\:\";'<>?,./]{6,20}$/;
const userRegex = /^[a-zA-Z0-9_]{4,20}$/;

export default function UserEdit({ searchParams }) {
  const router = useRouter();
  const [refreshKey, setRefreshKey] = useState(Date.now());
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = ProForm.useForm();
  const [updating, setUpdating] = useState(false);
  const { userId } = searchParams;
  const { data, error, isLoading } = useSWR(refreshKey, (key) => {
    if (!userId) {
      return {};
    }
    return user.getUserById(userId);
  });

  useEffect(() => {
    if (!data) {
      return;
    }
    form.setFieldsValue(data);
  }, [data, form]);

  const onFinish = async (values) => {
    if (updating) {
      return;
    }
    if (values?.password) {
      if (values.password !== values.confirm_password) {
        messageApi.error("两次密码不一致");
        return;
      }
    }
    if (values?.password && !passwordRegex.test(values.password)) {
      messageApi.error("密码格式错误");
      return;
    }
    if (!userRegex.test(values.username)) {
      messageApi.error("用户名格式错误");
      return;
    }

    messageApi.open({
      key: "update_user",
      type: "loading",
      content: "正在更新...",
    });
    setUpdating(true);

    try {
      delete values.confirm_password;
      if (!userId) {
        await user.createUser(values);
      } else {
        delete values.username;
        delete values.email;
        await user.updateUser(userId, values);
      }
      setRefreshKey(refreshKey + 1);
      messageApi.open({
        key: "update_user",
        type: "success",
        content: "更新成功",
      });

      if (!userId) {
        router.push("/m/user/manage");
      }
    } catch (e) {
      messageApi.open({
        key: "update_user",
        type: "error",
        content: e?.message || "更新失败",
      });
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg.jpg')" }}>
      <div className="flex max-w-screen-md mx-auto flex-wrap pb-10">
        {contextHolder}
        <div className="w-full flex justify-between items-center px-5 mt-10">
          <Button
            onClick={() => {
              router.push("/m/user/manage");
            }}
            icon={<LeftOutlined />}
          >
            返回
          </Button>
        </div>
        <div className="grid w-full gap-5 grid-cols-1 px-5">
          <div className={"mt-5 p-5 bg-white rounded-md w-full shadow-md"}>
            <h1 className={"text-2xl font-bold mb-2"}>
              {!userId ? "新建" : "编辑"}用户
            </h1>
            <Spin spinning={isLoading}>
              <ProForm
                form={form}
                onReset={() => {
                  if (!userId) {
                    form.resetFields();
                  } else {
                    form.setFieldsValue(data);
                  }
                }}
                onFinish={onFinish}
              >
                <ProFormText
                  label="用户名"
                  name="username"
                  required
                  tooltip="用户名用于登录，不可重复"
                  placeholder="用户名长度为4-20位，支持数字、字母"
                  disabled={!!userId}
                  rules={[
                    { required: true },
                    {
                      pattern: userRegex,
                      message: "用户名长度为4-20位，支持数字、字母",
                    },
                  ]}
                />
                <ProFormText
                  label="新密码"
                  name="password"
                  fieldProps={{
                    type: "password",
                  }}
                  required={!userId}
                  tooltip={
                    "密码长度为6-20位，支持数字、字母和特殊字符" +
                    (!userId ? "" : "，留空则不修改")
                  }
                  placeholder="密码长度为6-20位，支持数字、字母和特殊字符"
                  rules={
                    !userId
                      ? [
                          { required: true },
                          {
                            pattern: passwordRegex,
                            message: "密码长度为6-20位，支持数字、字母和特殊字符",
                          },
                        ]
                      : []
                  }
                />
                <ProFormText
                  label="确认密码"
                  name="confirm_password"
                  fieldProps={{
                    type: "password",
                  }}
                  required={!userId}
                  placeholder="确认密码需要与新密码一致"
                  rules={
                    !userId
                      ? [
                          { required: true },
                          {
                            pattern: passwordRegex,
                            message: "密码长度为6-20位，支持数字、字母和特殊字符",
                          },
                        ]
                      : []
                  }
                />
                <ProFormText
                  label="邮箱"
                  name="email"
                  disabled={!!userId}
                  rules={[{ required: true }]}
                  required
                  placeholder={"请填写邮箱，邮箱和用户头像关联"}
                  tooltip="用于显示头像，不可重复。"
                />
              </ProForm>
            </Spin>
          </div>
        </div>
      </div>
    </div>

  );
}
