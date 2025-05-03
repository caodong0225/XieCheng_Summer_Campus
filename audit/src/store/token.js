import { user } from "@/api/index";
const JWT_TOKEN_KEY = "jobs:jwt_token";

// 检查是否在浏览器环境中
const isBrowser = typeof window !== 'undefined';

export async function setJwtToken(token) {
  if (token && isBrowser) {
    sessionStorage.setItem(JWT_TOKEN_KEY, token);
  }
}

export async function getJwtToken() {
  if (!isBrowser) return null;
  return sessionStorage.getItem(JWT_TOKEN_KEY);
}

export async function clearJwtToken() {
  if (!isBrowser) return;
  sessionStorage.removeItem(JWT_TOKEN_KEY);
}

export async function getLoginToken() {
  const token = await getJwtToken();
  if (!token) return null;

  try {
    const payload = parseJwtToken(token);
    if (payload) {
      return {
        id: payload.id || payload.userId,
        userRoles: payload.roles || payload.role || ''
      };
    }
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
  }

  try {
    const result = await user.checkMeUser();
    setJwtToken(result);
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function isLoggedIn() {
  const token = await getJwtToken();
  return !!token;
}

export async function getUser() {
  const token = await getJwtToken();
  if (!token) return null;

  try {
    const payload = parseJwtToken(token);
    if (!payload) return null;

    return {
      id: payload.userId,
      userRole: payload.role || 'guest',
      userName: payload.username,
      email: payload.email,
    };
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
}


export async function getUserRoles() {
  const token = await getJwtToken();
  if (!token) return null;

  try {
    const payload = parseJwtToken(token);
    return [payload?.role] || [];
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return [];
  }
}

export async function hasRole(role) {
  const roles = await getUserRoles();
  switch (role) {
    case "admin":
      return roles === "admin";
    case "super-admin":
      return roles === "super-admin";
    default:
      return roles === 'guest';
  }
}

export function parseJwtToken(token) {
  if (!token) return null;
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT token:', error);
    return null;
  }
}

export async function getJwtUserInfo() {
  const token = await getJwtToken();
  if (!token) return null;
  
  const payload = parseJwtToken(token);
  if (!payload) return null;
  
  return {
    userId: payload.id || payload.userId,
    roles: payload.role || [],
    userName: payload.userName,
    email: payload.email,
    // 可以根据需要添加其他 JWT 中的字段
  };
}

export async function clearLoginToken() {
  await clearJwtToken();
}

export async function refreshLoginToken() {
  // TODO 根据实际需求实现刷新JWT
  // 根据JWT的过期时间和当前时间比较，如果过期就清除storge
  const token = await getJwtToken();
  if (!token) return null;

  const payload = parseJwtToken(token);
  if (!payload) return null;

  if(payload.exp < Date.now() / 1000) {
    await clearJwtToken();
  }
}
