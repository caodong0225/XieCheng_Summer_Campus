import { get, post, put, del, request } from "./request";

export async function getVideoAll(params) {
    const urlParams = new URLSearchParams(params);
    const data = await get(`video/all?${urlParams.toString()}`);

    data.success = true;
    data.list = data?.data?.videos;
    return data;
}

export async function deleteVideoById(videoId) {
    return del(`video/${videoId}`);
}

// 通过id获取视频详情
export async function getVideoById(videoId) {
    const response = await get(`video/${videoId}`);
    
    // 适配响应格式
    if (response.code === 200 && response.data) {
        return response.data;
    } else {
        throw new Error(response.message || '获取视频详情失败');
    }
}