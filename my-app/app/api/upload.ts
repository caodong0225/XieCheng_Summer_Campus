import { upload } from "./request";

export async function newUpload(file: File) {
    const response = upload(
        "file/upload",
        "file",
        file,
    )
    
    return response;
}

export async function videoUpload(file: File, description: string = '��������') {
    const response = upload(
        "video/upload",
        "video",
        file,
        { description }
    )
    
    return response;
}

// ֧�ֽ��Ȼص�����Ƶ�ϴ�
export async function videoUploadWithProgress(
    file: File, 
    description: string = '��������',
    onProgress?: (progress: number) => void
) {
    // ���û�н��Ȼص���ֱ��ʹ����ͨ��upload����
    if (!onProgress) {
        return videoUpload(file, description);
    }

    // �н��Ȼص�ʱ��ʹ��XMLHttpRequest
    const formData = new FormData();
    formData.append('video', file);
    formData.append('description', description);

    const xhr = new XMLHttpRequest();
    
    return new Promise(async (resolve, reject) => {
        // ��ȡ��֤token
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
                        reject(new Error(response.message || '�ϴ�ʧ��'));
                    }
                } catch (error) {
                    reject(new Error('������Ӧʧ��'));
                }
            } else {
                reject(new Error(`�ϴ�ʧ��: ${xhr.status}`));
            }
        });

        xhr.addEventListener('error', () => {
            reject(new Error('�������'));
        });

        // ��ȡ���ò�����������API��ַ
        const { default: config } = await import("./config");
        const url = `${config.API_URL}video/upload`;
        xhr.open('POST', url);
        
        // ������֤ͷ
        if (token) {
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }
        
        xhr.send(formData);
    });
}