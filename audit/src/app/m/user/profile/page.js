"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Spin, message, Switch, Tooltip } from "antd";
import { ProForm, ProFormField, ProFormText } from "@ant-design/pro-components";
import MarkdownEditor from "@/components/common/md_editor";
import { user } from "@/api/index";
import { useMe } from "@/context/usercontext";


export default function UserProfile() {
  const router = useRouter();
  const { meData, isMeLoading, mutateMe } = useMe();
  const [messageApi, contextHolder] = message.useMessage();
  const [form] = ProForm.useForm();
  const [extform] = ProForm.useForm();
  const [description, setDescription] = useState("");
  const [basicInfoSyncMode, setBasicInfoSyncMode] = useState(false);

  const defaultOAPush = (uri) => {
    const redirectUrl = encodeURIComponent(
      window.location.pathname + window.location.search
    );
    router.push(`/${uri}?to=${redirectUrl}`);
  };

  useEffect(() => {
    if (!isMeLoading && !meData) {
      defaultOAPush("login");
    }
  }, [meData, isMeLoading]);

  useEffect(() => {
    if (!meData) {
      return;
    }
    // 获取用户信息
    user.getUserById(meData.id).then((res) => {
      console.log(res);
      extform.setFieldsValue(res?.userExtraInfo);
      setDescription(res?.userExtraInfo?.description);
    })

  }, [meData, extform]);

  const onFinish = async (values) => {
    console.log(values);
    if (values?.password) {
      if (values.password !== values.confirm_password) {
        messageApi.error("两次密码不一致");
        return;
      }
    }
    const passwordRegex = /^(?![a-zA-Z]+$)(?!\d+$)(?![^\da-zA-Z\s]+$).{6,32}$/;
    if (values?.password && !passwordRegex.test(values.password)) {
      messageApi.error("密码格式错误");
      return;
    }

    messageApi.open({
      key: "update_user",
      type: "loading",
      content: "正在更新...",
    });

    try {
      await user.updateMeUser(values);
      messageApi.open({
        key: "update_user",
        type: "success",
        content: "更新成功",
      });
    } catch (error) {
      messageApi.open({
        key: "update_user",
        type: "error",
        content: error?.message || "更新失败",
      });
    }
  };

  const onExtFinish = async (values) => {
    messageApi.open({
      key: "update_user",
      type: "loading",
      content: "正在更新...",
    });

    try {
      await user.updateMeUserExt(values);
      messageApi.open({
        key: "update_user",
        type: "success",
        content: "更新成功",
      });
    } catch (error) {
      messageApi.open({
        key: "update_user",
        type: "error",
        content: error?.message || "更新失败",
      });
    }
  };

  return (
    <div className="relative min-h-screen">
      <div className="fixed inset-0 bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg.jpg')", zIndex: -1 }}></div>
      <div className="relative flex max-w-screen-xl mx-auto flex-wrap pb-10">
        {contextHolder}
        <div className="grid w-full gap-5 grid-cols-1 px-5 md:grid-cols-2">
          <div className="mt-5 p-5 bg-white rounded-md w-full shadow-md">
            <div className="flex items-center mb-2">
              <h2 className="text-xl font-bold text-gray-700 mr-2">基本信息</h2>
            </div>
            {(!meData) ? (
              <div className="text-center py-10">加载中...</div>
            ) : (
              <ProForm
                form={form}
                onReset={() => {
                  form.setFieldsValue(meData);
                }}
                onFinish={onFinish}
                initialValues={meData}
              >
                <ProFormText
                  label="用户名"
                  name="username"
                  initialValue={meData.userName}
                  disabled
                />
                <ProFormText
                  label="邮箱"
                  name="email"
                  initialValue={meData.email}
                  disabled
                  tooltip={<span>邮箱将与你的头像绑定</span>}
                />
                <ProFormText
                  label="新密码"
                  name="password"
                  fieldProps={{
                    type: "password",
                  }}
                />
                <ProFormText
                  label="确认密码"
                  name="confirm_password"
                  fieldProps={{
                    type: "password",
                  }}
                />
              </ProForm>
            )}
          </div>
          <div className="mt-5 p-5 bg-white rounded-md w-full shadow-md">
            <h2 className="text-xl font-bold mb-2 text-gray-700">附加信息</h2>
            <ProForm
              form={extform}
              onReset={() => {
                extform.setFieldsValue(meData?.userExtraInfo);
              }}
              onFinish={onExtFinish}
              initialValues={meData?.userExtraInfo}
            >
              <ProFormField
                label="个人简介"
                name="description"
                rules={[{ required: true }]}
              >
                <div className="border border-gray-200 rounded-md">
                  <MarkdownEditor
                    value={description}
                    onChange={(e) => {
                      setDescription(e);
                      extform.setFieldsValue({ description: e });
                    }}
                  />
                </div>
              </ProFormField>
            </ProForm>
          </div>
        </div>
      </div>
    </div>
  );
}

