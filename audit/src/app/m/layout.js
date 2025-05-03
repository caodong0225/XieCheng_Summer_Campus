"use client";

import {Layout, Menu} from "antd";
import {useEffect, useState} from "react";
import {useRouter} from '@bprogress/next';
import {
  getSelectedKeys,
  getMenuItems,
  getRedirectPath,
  PUBLIC_MENU,
} from "@/util/menu";
import SiteFooter from "@/components/common/footer";
import HeaderLogo from "@/components/common/header_logo";
import {useMe, MeProvider} from "@/context/usercontext";
import UserTopbar from "@/components/common/user_topbar";

const {Header, Content} = Layout;
const window = globalThis;

const LayoutContent = ({children}) => {
  const router = useRouter();
  const {meData, mutateMe} = useMe();
  const [route, setRoute] = useState(
    globalThis?.__incrementalCache?.requestHeaders?.["x-invoke-path"]
  );

  const [menuItem, setMenuItem] = useState(getMenuItems(meData, PUBLIC_MENU));
  const [selectedKeys, setSelectedKeys] = useState(
    getSelectedKeys(route, PUBLIC_MENU)
  );

  useEffect(() => {
    setRoute(window.location.pathname);
  }, [router]);

  useEffect(() => {
    setMenuItem(getMenuItems(meData, PUBLIC_MENU));
    setSelectedKeys(getSelectedKeys(route, PUBLIC_MENU));
  }, [meData, route]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (route != window.location.pathname) {
        setRoute(window.location.pathname);
        clearInterval(interval);
      }
    }, 1000);
  }, [route]);

  return (
    <Layout
      style={{
        minHeight: "100vh",
        backgroundColor: "transparent",
      }}
    >
      <Header
        style={{
          boxShadow: "0 1px 4px rgba(0, 21, 41, 0.08)",
          backgroundColor: "white",
        }}
        className="flex items-center w-full overflow-x-auto overflow-y-hidden"
      >
        <div className={"hidden sm:block"}>
          <HeaderLogo/>
        </div>
        <Menu
          items={menuItem}
          selectedKeys={selectedKeys}
          onClick={({key}) => {
            router.push(getRedirectPath(meData, PUBLIC_MENU, key));
          }}
          mode="horizontal"
          style={{flex: 1, flexShrink: 1}}
          className="w-full"
        ></Menu>
        <UserTopbar/>
      </Header>
      <Content>{children}</Content>
      <SiteFooter/>
    </Layout>
  );
};

const RootLayout = ({children}) => {
  return (
    <MeProvider>
      <LayoutContent>
        {children}
      </LayoutContent>
    </MeProvider>
  )
}


export default RootLayout;
