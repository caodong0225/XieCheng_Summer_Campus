"use client";
import React, { createContext, useState, useEffect, useContext } from "react";
import useSWR from "swr";
import {
  getUser,
  getUserRoles,
  refreshLoginToken,
  clearLoginToken
} from "@/store/token";
import { useRouter } from "next/navigation";
import {getConstConfig} from "@/store/const_config";
import {message} from "antd";



const MeContext = createContext();

export function MeProvider({ children }) {
  const [messageApi, contextHolder] = message.useMessage()
  // TODO 直接返回完整的 sessionStorage 以便能够通过 meData 访问 userRoles 和 userExtraInfo
  // meData 不包含 userRoles 和 userExtraInfo
  // 因为 getUser 方法仅从sessionStorage中返回了user字段
  // 但是更改可能会造成先前的 meData.id, meData.nickname 等写法的失效
  const {
    data: meData,
    isLoading: isMeLoading,
    mutate,
  } = useSWR("me", getUser);

  const router = useRouter();

  // TODO 添加userRoleLevel属性，用于判断用户角色等级
  // 0 -> 未初始化
  // 1 -> 普通用户
  // 2 -> 管理员
  // 3 -> 超级管理员
  const [userRoleLevel, setUserRoleLevel] = useState(0);
  const [isUserRoleLevelLoading, setIsUserRoleLevelLoading] = useState(true);
  useEffect(() => {
    getUserRoles()
      .then((roleName) => {
        if (!roleName) {
          return;
        }
        if (roleName == getConstConfig()["superAdmin"]) {
          setUserRoleLevel(3);
          setIsUserRoleLevelLoading(false);
        } else if (roleName == getConstConfig()["admin"]) {
          setUserRoleLevel(2);
          setIsUserRoleLevelLoading(false);
        } else if (roleName == getConstConfig()["defaultRole"]) {
          setUserRoleLevel(1);
          setIsUserRoleLevelLoading(false);
        }
         else {
          throw new Error("Unexcepted user role name");
        }
      })
      .catch((err) => {
        console.error(err);
        setIsUserRoleLevelLoading(false);
      });
  }, []);

  // 写一个触发函数
  //
  // 替代在组件中使用下面语句：
  //
  // Case 1:
  // -setIsAdmin(await session.hasAdmin("super-admin"));
  // +import { hasRole } from "@/store/session";
  // +setIsAdmin(await hasRole("admin"));
  //
  // Case 2:
  // const [isAdmin, setIsAdmin] = useState(false);

  const mutateMe = async () => {
    try {
      const newSession = await refreshLoginToken();
      if (newSession == null) {
        clearLoginToken();
      }
      await mutate(newSession); // 手动更新SWR缓存
      return newSession;
      //throw new Error("Failed to refresh login session");
    } catch (error) {
      console.error("mutateMe error:", error);
      clearLoginToken(); // 清除sessionStorage
      await mutate(null); // 手动更新SWR缓存
      return null;
    }
  };

  const [extraState, SetExtraState] = useState(null);


  return (
    <MeContext.Provider
      value={{
        meData,
        isMeLoading,
        mutate,
        mutateMe,
        userRoleLevel,
        isUserRoleLevelLoading,
        extraState,
        SetExtraState,
      }}
    >
      {contextHolder}
      {children}
    </MeContext.Provider>
  );
}

export function useMe() {
  const context = useContext(MeContext);
  if (!context) {
    throw new Error("useMe must be used within a MeProvider");
  }
  return context;
}
