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
