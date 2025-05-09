import { getJwtToken } from "@/store/token";
import config from "./config";

// TODO: Remove this function in the future version
// Deprecation of this function is taken into account 
// for its side effect and nun-fetch useage, to use 
// this function, you must write try-catch block, 
// otherwise, unexpected behavior may occur, which
// may cause confusion and bugs.
// Please use newRequest function instead
export async function request(url: string, options: any, isAuth = true) {
  if (!url.startsWith("http")) {
    url = `${config.API_URL}${url}`;
  }

  const headers = {
    ...options.headers,
  };

  if (isAuth) {
    const token = await getJwtToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      credentials: "include",
      ...options,
      headers,
    });
    const data = await response.json();

    // TODO 在未来版本去除这个side effect，应该由业务逻辑处理
    // 判断data.code是否是4开头
    // if ((response.status === 401 || data.code >= 400 && data.code < 500) && isAuth) {
    //   sessionStorage.removeItem("singularity:session");
    //   window.location.href =
    //     "/login?to=" + encodeURIComponent(window.location.pathname + window.location.search);
    //   return;
    // }

    if (response.status >= 400 || data?.code !== 200) {
      throw data;
    }

    return data;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function newRequest(url: string, options: any, isAuth = true) {
  if (!url.startsWith("http")) {
    url = `${config.API_URL}${url}`;
  }

  const headers = {
    ...options.headers,
  };

  if (isAuth) {
    const token = await getJwtToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return fetch(url, {
    credentials: "include",
    ...options,
    headers,
  })
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response;
    })
    .then(response => response.json())
    .then(data => {
      if (data?.code === 200) {
        return data?.data;
      } else if (data?.code >= 400 && data?.code < 500) {
        // throw new Error(`资源请求失败: ${data?.message}`);
        throw data;
      } else {
        throw new Error(`Server response with code: ${data?.code}, msg: ${data?.message}`);
      }
    })
}

export function get(url: string, isAuth = true) {
  return request(
    url,
    {
      method: "GET",
    },
    isAuth
  );
}

export function newGet(url: string, isAuth = true) {
  return newRequest(
    url,
    {
      method: "GET",
    },
    isAuth
  );
}

export function post(url: string, data: any, isAuth = true) {
  return request(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
    isAuth
  );
}

export function newPost(url: string, data: any, isAuth = true) {
  return newRequest(
    url,
    {
      method: "POST",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
    isAuth
  );
}

export function put(url: string, data: any, isAuth = true) {
  return request(
    url,
    {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
    isAuth
  );
}

export function newPut(url: string, data: any, isAuth = true) {
  return newRequest(
    url,
    {
      method: "PUT",
      body: JSON.stringify(data),
      headers: {
        "Content-Type": "application/json",
      },
    },
    isAuth
  );
}

export function del(url: string, isAuth = true) {
  return request(
    url,
    {
      method: "DELETE",
    },
    isAuth
  );
}

export function newDel(url: string, isAuth = true) {
  return newRequest(
    url,
    {
      method: "DELETE",
    },
    isAuth
  );
}

export function upload(url: string, file: File, additionalData?: Record<string, any>, isAuth = true) {
  const formData = new FormData();
  formData.append('file', file);
  
  if (additionalData) {
    Object.entries(additionalData).forEach(([key, value]) => {
      formData.append(key, value);
    });
  }

  return newRequest(
    url,
    {
      method: "POST",
      body: formData,
      // Don't set Content-Type header manually, let the browser set it with the boundary
      headers: {},
    },
    isAuth
  );
}
