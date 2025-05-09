import { post } from "./request";

export async function createNote(data: any) {
    return post(
        "note/create",
        data
    );
}

