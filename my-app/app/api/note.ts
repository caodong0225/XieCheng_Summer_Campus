import { del, get, post } from "./request";

export async function createNote(data: any) {
    return post(
        "note/create",
        data
    );
}

export async function getNoteList(params: any, sort: any, filter: any) {
    params.page = params.pageNum;

    delete params.pageNum;
  
    if (sort) {
      Object.keys(sort).forEach((key) => {
        params["sort"] = key;
        params["order"] = sort[key] === "ascend" ? "asc" : "desc";
      });
    }
  
    if (!params["sort"]) {
      params["sort"] = "created_at";
      params["order"] = "desc";
    }
  
    const urlParams = new URLSearchParams(params);
    const data = await get(`note/list?${urlParams.toString()}`);
  
    data.success = true;
    data.list = data?.data?.list;
    return data;
}

export async function getNoteDetail(id: any) {
    return get(`note/${id}`);
}

export async function collectionNote(id: any) {
    return post(`note/${id}/collection`,{});
}

export async function likeNote(id: any) {
    return post(`note/${id}/like`,{});
}

export async function getNoteReplyByNoteId(id: any) {
  return get(`note/detail/${id}`);
}

/**
 * 评论游记
 * @param noteId 游记ID
 * @param data 评论数据
 */
export async function commentNote(data: any) {
    return post(`thread`, data);
}

/**
 * 删除评论
 * @param commentId 评论ID
 */
export async function deleteComment(commentId: any) {
    return del(`thread/${commentId}`);
}


export async function getNoteAll(params: any, sort: any, filter: any) {
  params.page = params.pageNum;

  delete params.pageNum;

  if (sort) {
    Object.keys(sort).forEach((key) => {
      params["sort"] = key;
      params["order"] = sort[key] === "ascend" ? "asc" : "desc";
    });
  }

  if (!params["sort"]) {
    params["sort"] = "created_at";
    params["order"] = "desc";
  }

  const urlParams = new URLSearchParams(params);
  const data = await get(`note/all?${urlParams.toString()}`);

  data.success = true;
  data.list = data?.data?.list;
  return data;
}

// 获取所有审批通过的游记
export async function getNoteApproved(params: any) {

  const urlParams = new URLSearchParams(params);
  const data = await get(`note/approved?${urlParams.toString()}`);

  data.success = true;
  data.list = data?.data?.list;
  return data;
}

export async function getMyFavouriteNote(params: any){
  try {
    const urlParams = new URLSearchParams(params);
    const response = await get(`user/favorites?${urlParams.toString()}`);
    if (response && response.code === 200 && response.data) {
      // 假设只返回视频ID列表，不包含完整详情
      return {
          success: true,
          list: response.data.list || [], // 这里只包含ID和基本信息
          message: response.message || '获取游记列表成功'
      };
  } else {
      return {
          success: false,
          list: [],
          message: response.message || '获取游记列表失败'
      };
  }
} catch (error) {
  return {
      success: false,
      list: [],
      message: '获取游记列表时发生错误'
  };
}
}

export async function getMyColllectedNote(params: any){
  try {
    const urlParams = new URLSearchParams(params);
    const response = await get(`user/collections?${urlParams.toString()}`);
    if (response && response.code === 200 && response.data) {
      // 假设只返回视频ID列表，不包含完整详情
      return {
          success: true,
          list: response.data.list || [], // 这里只包含ID和基本信息
          message: response.message || '获取游记列表成功'
      };
  } else {
      return {
          success: false,
          list: [],
          message: response.message || '获取游记列表失败'
      };
  }
} catch (error) {
  return {
      success: false,
      list: [],
      message: '获取游记列表时发生错误'
  };
}
}