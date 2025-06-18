"use client";

import {getConstConfig} from "@/store/const_config";

// 缓存角色配置
const defaultRole = getConstConfig()["defaultRole"] || "guest";

export const PUBLIC_MENU = [
  {
    key: "home",
    label: "主页",
    href: "/m",
    icon: "",
  },
  {
    key: "audit",
    label: "审批",
    href: "/m/audit",
    children: [
      {
        key: "audit",
        label: "审批游记",
        href: "/m/audit/*",
        hidden: true,
      },
    ],
  },
];

// 通用递归查找
function findMenuItem(menu, predicate) {
  for (const item of menu) {
    if (predicate(item)) return item;
    if (item.children) {
      const found = findMenuItem(item.children, predicate);
      if (found) return found;
    }
  }
  return null;
}


export function getMenuItems(me, menu) {
  const menuItems = [];
  for (const item of menu) {
    if (item.hidden || (item.roles && !item.roles.includes(defaultRole))) continue;

    let subItem = {
      key: item.key,
      label: item.label,
      icon: item.icon,
      href: item.href,
    };
    if (item.children) {
      subItem.children = getMenuItems(me, item.children);
      if (!subItem?.children?.length) {
        subItem.children = undefined;
      }
    }
    menuItems.push(subItem);
  }
  return menuItems;
}

function replaceUrl(url, id) {
  // 如果 id 为数字，替换掉 pattern 中的 {id}
  if (id > 0 && (typeof id === "number" || typeof id === "string")) {
    url = url.replaceAll("{id}", id);
  }
  // 如果 id 为字典，替换掉 pattern 中字典中的 key
  if (id && typeof id === "object") {
    for (const key in id) {
      url = url.replaceAll(`{${key}}`, id[key]);
    }
  }
  return url;
}

// 路由匹配
function match(pattern, text, id) {
  if (!pattern || !text) return false;
  pattern = replaceUrl(pattern, id);
  return pattern.includes("*") ? text.startsWith(pattern.replace("*", "")) : pattern === text;
}

// 获取选中菜单的 key
export function getSelectedKeys(route, menu, id) {
  const item = findMenuItem(menu, (item) => match(item.href, route, id));
  return item ? [item.key] : [];
}

export function getRedirectPath(me, menu, key, id) {
  const item = findMenuItem(menu, (item) => item.key === key);
  return item ? replaceUrl(item.href, id) : null;
}

export function getOpenKeys(route, menu, id) {
  for (const item of menu) {
    if (item.children) {
      const keys = getOpenKeys(route, item.children, id);
      if (keys.length > 0) {
        return [item.key];
      }
    }
    if (match(item.href, route, id)) {
      return [item.key];
    }
  }
  return [];
}

export function hasAccess(me, href, menu, id) {
  for (const item of menu) {
    if (match(item.href, href, id)) {
      if (item.roles && !item.roles.includes(me?.user_type)) {
        return false;
      }
      return true;
    }
    if (item.children) {
      if (hasAccess(me, href, item.children, id)) {
        return true;
      }
    }
  }
  return true;
}

export function getBreadcrumb(route, menu, id) {
  const item = findMenuItem(menu, (item) => match(item.href, route, id));
  return item ? [item] : [];
}

export function getBreadcrumbItems(route, menu, router, id) {
  const l = getBreadcrumb(route, menu, id);
  return l.map((item, index) => {
    return {
      key: item.key,
      title: item.label,
      href: index < l.length - 1 ? "#" : undefined,
      onClick: () => {
        let href = index < l.length - 1 ? item.href : undefined;
        if (!href) return;
        if (id) {
          href = replaceUrl(href, id);
        }
        router.push(href);
      },
    };
  });
}
