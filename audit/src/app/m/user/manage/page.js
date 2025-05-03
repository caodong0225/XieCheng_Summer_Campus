"use client";
import { Button, Popconfirm, Select, message, Modal, Form, Input } from "antd";
import { useEffect, useState, useMemo } from "react";
import { ProTable } from "@ant-design/pro-components";
import { useRouter } from '@bprogress/next';
import { user } from "@/api/index";
import { PlusOutlined, SendOutlined } from "@ant-design/icons";
import Link from "next/link";
import { notFound } from "next/navigation";
import { useMe } from "@/context/usercontext";

const { TextArea } = Input;

export default function UserList() {
  const router = useRouter();
  const { meData, userRoleLevel, isUserRoleLevelLoading } = useMe();
  const [messageApi, contextHolder] = message.useMessage();
  const [toolBarRender, setToolBarRender] = useState(() => () => []);
  const [roleValues, setRoleValues] = useState({});
  const [selectedRowKeys, setSelectedRowKeys] = useState([]); // 用于存储选中的行 key
  const [form] = Form.useForm(); // 用于管理表单数据

  const BasicColumns = [
    {
      title: "搜索用户",
      dataIndex: "username",
      hideInTable: true,
      search: {
        transform: (value) => {
          return {
            username: value,
          };
        },
      },
    },
    {
      title: "用户ID",
      dataIndex: "id",
      ellipsis: true,
      disable: true,
      sorter: true,
      hideInSearch: true,
      width: 80,
    },
    {
      title: "用户名",
      dataIndex: "username",
      ellipsis: true,
      hideInSearch: true,
      width: 120,
      render: (text, record) => <Link href={`/m/user/${record.id}`}>{record.username}</Link>,
    },
    {
      title: "邮箱地址",
      dataIndex: "email",
      ellipsis: true,
      hideInSearch: true,
      width: 200,
    },
    {
      title: "角色",
      dataIndex: "role",
      ellipsis: true,
      width: 120,
      valueEnum: {
        'super-admin': { text: '管理员' },
        'admin': { text: '审批员' },
        'guest': { text: '普通用户' }
      },
      search: {
        transform: (value) => {
          return {
            role: value,
          };
        },
      },
      render: (text, record, _, action) => {
        const roleMap = {
          'super-admin': '管理员',
          'admin': '审批员',
          'guest': '普通用户'
        };
        
        return (
          <Select
            style={{ width: 120 }}
            value={record.role || 'guest'}
            onChange={(value) => updateUserRole(record.id, value, action)}
            disabled={record.role === 'super-admin'}
          >
            <Select.Option value="guest">普通用户</Select.Option>
            <Select.Option value="admin">审批员</Select.Option>
            <Select.Option value="super-admin" disabled>管理员</Select.Option>
          </Select>
        );
      },
      hideInSearch: false,
    }
  ];

  const updateUserRole = (id, role, action) => {
    let promise;
    if (role === "") {
      promise = user.delUserRole(id);
    } else {
      promise = user.updateUserRole(id, role);
    }
    promise
        .then(() => setRoleValues((previous) => ({ ...previous, [id]: role }))) // 更新 roleValues[record.key]
        .then(() => action.reload())
        .then(() => messageApi.success("更新成功"))
        .catch((err) => messageApi.error(err.message) || "更新失败");
  };

  const userColumns = useMemo(() => {
    let _userColumns = [...BasicColumns];
    if (isUserRoleLevelLoading) {
      return _userColumns;
    }

    if (userRoleLevel === 1) {
      notFound();
    } else if (userRoleLevel >= 3) {
      _userColumns.push({
        title: "操作",
        valueType: "option",
        key: "option",
        width: 100,
        render: (text, record, _, action) => {
          return [
            <a
                key="editable"
                onClick={() => {
                  router.push(`/m/user/edit?userId=${record.id}`);
                }}
            >
              编辑
            </a>,
            <Popconfirm
                key="actionGroup"
                title="删除用户"
                description="用户的所有信息将被删除，且无法恢复，确定删除吗？"
                onConfirm={() => {
                  user.deleteUserById(record.id)
                      .then(() => action.reload())
                      .then(() => messageApi.success("删除成功"))
                      .catch((err) => messageApi.error(err.message) || "删除失败");
                }}
                okText="确定"
                cancelText="取消"
            >
              <Button type="link" danger size="small">
                删除
              </Button>
            </Popconfirm>,
          ];
        },
      });
      setToolBarRender(() => () => [
        <Button key="button" icon={<PlusOutlined />} onClick={() => { router.push("/m/user/edit"); }} type="primary">
          新建
        </Button>
      ]);
    }
    return _userColumns;
  }, [isUserRoleLevelLoading, roleValues, meData?.userId, selectedRowKeys]);

  // 处理选中行的逻辑
  const handleRowSelectionChange = (selectedKeys) => {
    setSelectedRowKeys(selectedKeys);
  };


  return (
    <div className="min-h-screen bg-cover bg-center bg-no-repeat" style={{ backgroundImage: "url('/bg.jpg')" }}>
        <div className={"max-w-6xl mx-auto p-5 relative"}>
        <h1 className={"text-2xl font-bold mt-2"}>用户管理</h1>

        <ProTable
            className="mt-5"
            columns={userColumns}
            cardBordered
            loading={isUserRoleLevelLoading}
            request={async (params, sort, filter) => {
              const result = await user.getUserList(params, sort, filter);
              return {
                success: true,
                data: result?.list,
                total: result?.total,
              };
            }}
            editable={false}
            columnsState={{
              persistenceKey: "scs:manage:user-list-table",
              persistenceType: "localStorage",
              defaultValue: {
                option: { fixed: "right", disable: true },
              },
              onChange(value) {
                // console.log("value: ", value);
              },
            }}
            rowKey="id"
            search={{
              labelWidth: "auto",
            }}
            options={{
              setting: {
                listsHeight: 400,
              },
            }}
            dateFormatter="string"
            toolBarRender={toolBarRender}
            rowSelection={{
              selectedRowKeys,
              onChange: handleRowSelectionChange,
            }}
        />

        {contextHolder}
      </div>
    </div>
      
  );
}
