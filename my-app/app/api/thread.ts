// api/thread.ts
import { del, get, post, put } from "./request";

export async function createThread(data: any) {
  return post("thread/", data);
}

export async function getThreadDetail(id: any) {
  return get(`thread/${id}`);
}

export async function updateThread(id: any, data: any) {
  return put(`thread/${id}`, data);
}

export async function deleteThread(id: any) {
  return del(`thread/${id}`);
}

export async function undoThread(id: any) {
  return del(`thread/undo/${id}`);
}