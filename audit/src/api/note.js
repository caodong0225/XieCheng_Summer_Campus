import { get, post, put, del, request } from "./request";

export async function createNote(data) {
    return post("note/create", data);
}

export async function reviewNote(noteId, data) {
    return put(`note/${noteId}/review`, data);
}

export async function deleteNote(noteId) {
    return del(`note/${noteId}`);
}

export async function updateNote(noteId, data) {
    return put(`note/${noteId}`, data);
}

export async function deleteAttachment(attachmentId) {
    return del(`note/attachment/${attachmentId}`);
}

export async function auditNote(noteId, data) {
    return put(`note/${noteId}/audit`, data);
}

export async function getNoteList(params, sort, filter) {

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
    const data = await get(`note/list?${urlParams.toString()}`);

    data.success = true;
    data.list = data?.data?.list;
    return data;
}

export async function getNoteById(noteId) {
    const note = await get(`note/${noteId}`);
    return note?.data;
}

export async function toggleCollection(noteId) {
    return put(`note/${noteId}/collection`);
}

export async function toggleFavorite(noteId) {
    return put(`note/${noteId}/favorite`);
}

export async function getNoteThreads(noteId) {
    const threads = await get(`note/${noteId}/threads`);
    return threads?.data;
}