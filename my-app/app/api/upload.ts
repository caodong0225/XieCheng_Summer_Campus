import { upload } from "./request";

export async function newUpload(file: File) {

    const response = upload(
        "file/upload",
        file,
    )
    
    return response;
}