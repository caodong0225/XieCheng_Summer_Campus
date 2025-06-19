import { upload } from "./request";

export async function newUpload(file: File) {

    const response = upload(
        "file",
        "file/upload",
        file,
    )
    
    return response;
}

export async function videoUpload(file: File) {

    const response = upload(
        "video",
        "video/upload",
        file,
    )
    
    return response;
}