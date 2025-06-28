// api/video.ts
import { del, get, post } from "./request";

export async function likeVideo(id: any) {
    try {
        const response = await post(`video/like/${id}`, {});
        if (response && response.code === 200) {
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } else {
            return {
                success: false,
                message: response.message || '����ʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '����ʱ��������'
        };
    }
}

export async function collectVideo(id: any) {
    try {
        const response = await post(`video/collect/${id}`, {});
        if (response && response.code === 200) {
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } else {
            return {
                success: false,
                message: response.message || '�ղ�ʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '�ղ�ʱ��������'
        };
    }
}

export async function getMyVideos(params: any) {
    const urlParams = new URLSearchParams(params);
    const data = await get(`video/list/me?${urlParams.toString()}`);
  
    data.success = true;
    data.list = data?.data?.videos;
    return data;
}

export async function getVideoById(id: any) {
    try {
        const response = await get(`video/${id}`);
        if (response && response.code === 200 && response.data) {
            return {
                success: true,
                data: response.data
            };
        } else {
            return {
                success: false,
                message: response.message || '��ȡ��Ƶ����ʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '��ȡ��Ƶ����ʱ��������'
        };
    }
}

export async function getVideoList(params: any) {
    try {
        const urlParams = new URLSearchParams(params);
        const response = await get(`video/unread?${urlParams.toString()}`);
        if (response && response.code === 200 && response.data) {
            // ����ֻ������ƵID�б�����������������
            return {
                success: true,
                list: response.data.videos || [], // ����ֻ����ID�ͻ�����Ϣ
                message: response.message || '��ȡ��Ƶ�б��ɹ�'
            };
        } else {
            return {
                success: false,
                list: [],
                message: response.message || '��ȡ��Ƶ�б�ʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            list: [],
            message: '��ȡ��Ƶ�б�ʱ��������'
        };
    }
}

// �ۿ���Ƶ
export async function watchVideo(id: any) {
    try {
        const response = await post(`video/watch/${id}`, {});
        if (response && response.code === 200) {
            return {
                success: true,
                data: response.data,
                message: response.message
            };
        } else {
            return {
                success: false,
                message: response.message || '�ۿ���Ƶʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '�ۿ���Ƶʱ��������'
        };
    }
}

export async function getVideoHistory(params: any) {
    try {
        const urlParams = new URLSearchParams(params);
        const response = await get(`video/history/views?${urlParams.toString()}`);
        
        if (response && response.code === 200) {
            return {
                success: true,
                list: response.data?.videos || [],
                message: response.message
            };
        } else {
            return {
                success: false,
                list: [],
                message: response.message || '��ȡ�ۿ���ʷʧ��'
            };
        }
    } catch (error) {
        return {
            success: false,
            list: [],
            message: '��ȡ�ۿ���ʷʱ��������'
        };
    }
}

// ɾ����Ƶ�ۿ���¼
export async function deleteVideoHistory(id: any) {
    return del(`video/history/views/${id}`);
}

export async function deleteVideo(id: any) {
    return del(`video/cancel/${id}`);
}
