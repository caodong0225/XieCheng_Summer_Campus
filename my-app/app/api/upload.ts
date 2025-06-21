import { upload } from "./request";

export async function newUpload(file: File) {
    const response = upload(
        "file/upload",
        "file",
        file,
    )
    
    return response;
}

export async function videoUpload(file: File, description: string = '暂无描述') {
    const response = upload(
        "video/upload",
        "video",
        file,
        { description }
    )
    
    return response;
}

// 支持进度回调的视频上传
export async function videoUploadWithProgress(
    file: File, 
    description: string = '暂无描述',
    onProgress?: (progress: number) => void
) {
    // 如果没有进度回调，直接使用普通的upload函数
    if (!onProgress) {
        return videoUpload(file, description);
    }

    // 有进度回调时，使用XMLHttpRequest
    const formData = new FormData();
    formData.append('video', file);
    formData.append('description', description);

    const xhr = new XMLHttpRequest();
    
    return new Promise(async (resolve, reject) => {
        // 获取认证token
        const { getJwtToken } = await import("@/store/token");
        const token = await getJwtToken();
        
        xhr.upload.addEventListener('progress', (event) => {
            if (event.lengthComputable && onProgress) {
                const progress = (event.loaded / event.total) * 100;
                onProgress(progress);
            }
        });

        xhr.addEventListener('load', () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const response = JSON.parse(xhr.responseText);
                    if (response.code === 200) {
                        resolve(response);
                    } else {
                        reject(new Error(response.message || '上传失败'));
                    }
                } catch (error) {
                    reject(new Error('解析响应失败'));
                }
            } else {
                reject(new Error(`上传失败: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('网络错误'));
        });

        // 获取配置并构建完整的API地址
        const { default: config } = await import("./config");
        const url = `${config.API_URL}video/upload`;
        xhr.open('POST', url);
        
        // 设置认证头
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
    });
}