import { get, post } from "./request";

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
