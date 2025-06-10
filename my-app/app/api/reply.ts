// api/reply.ts
import { post } from "./request";

export async function likeReply(id: any) {
    return post(`reply/like/${id}`, {})
  }