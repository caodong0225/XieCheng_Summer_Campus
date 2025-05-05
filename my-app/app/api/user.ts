import { del, get, post, put } from "./request";

export async function login(username: string,password: string) {
    return post(
        "user/login",
        {
          username: username,
          password: password,
        },
        false
      );
}

export async function register(username: string,password: string,email: string) {
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

export async function getUserById(id: any) {
    const user = await get(`user/${id}`);
    return user?.data;
}

export async function updateMeUser(data: any) {
  const user = await put("user/update", {
    password: data?.password,
  });
  return user?.data;
}

export async function updateMeUserExt(data: any) {
  console.log(data)
  // 把data里面的字段都传过去，按照key，value的形式
  await put(`user/update/extra`, 
    data
  );

  return true;
}

export async function getUserList(params: any, sort: any, filter: any) {
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

export async function deleteUser(id: any) {
  await del(`user/${id}`);
  return true;
}

export async function updateUserRole(id: any, role: string) {
  await put(`user/update/${id}/role`, {
    role: role,
  });
  return true;
  
}

export async function updateUser(id: any, data: any) {
  await put(`user/update/${id}/password`, data);
}