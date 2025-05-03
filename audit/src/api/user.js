import { get, post, put, del, request } from "./request";

export async function login(username,password) {
    return post(
        "user/login",
        {
          username: username,
          password: password,
        },
        false
      );
}

export async function register(username,password,email) {
    return post(
        "user/register",
        {
          username: username,
          password: password,
          email: email
        },
        false
      );
}

export async function getUserById(id) {
    const user = await get(`user/${id}`);
    return user?.data;
}

export async function updateMeUser(data) {
  const user = await put("user/update", {
    password: data?.password,
  });
  return user?.data;
}

export async function updateMeUserExt(data) {
  console.log(data)
  // 把data里面的字段都传过去，按照key，value的形式
  await put(`user/update/extra`, 
    data
  );

  return true;
}

export async function getUserList(params, sort, filter) {
  params.size = params.pageSize;

  delete params.pageSize;

  if (sort) {
    Object.keys(sort).forEach((key) => {
      params["sort"] = key;
      params["order"] = sort[key] === "ascend" ? "asc" : "desc";
    });
  }

  if (!params["sort"]) {
    params["sort"] = "id";
    params["order"] = "desc";
  }

  const urlParams = new URLSearchParams(params);
  const data = await get(`user/list?${urlParams.toString()}`);

  data.success = true;
  data.list = data?.data?.list;
  return data;
}

export async function deleteUser(id) {
  await del(`user/${id}`);
  return true;
}

export async function updateUserRole(id, role) {
  await put(`user/update/${id}/role`, {
    role: role,
  });
  return true;
  
}

export async function createUser(data) {
  return this.register(data?.username, data?.password, data?.email);
}

export async function updateUser(id, data) {
  await put(`user/update/${id}/password`, data);
}