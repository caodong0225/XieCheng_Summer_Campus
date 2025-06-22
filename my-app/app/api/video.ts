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
                message: response.message || '点赞失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '点赞时发生错误'
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
                message: response.message || '收藏失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '收藏时发生错误'
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
                message: response.message || '获取视频详情失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '获取视频详情时发生错误'
        };
    }
}

export async function getVideoList(params: any) {
    try {
        const urlParams = new URLSearchParams(params);
        const response = await get(`video/unread?${urlParams.toString()}`);
        if (response && response.code === 200 && response.data) {
            // 假设只返回视频ID列表，不包含完整详情
            return {
                success: true,
                list: response.data.videos || [], // 这里只包含ID和基本信息
                message: response.message || '获取视频列表成功'
            };
        } else {
            return {
                success: false,
                list: [],
                message: response.message || '获取视频列表失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            list: [],
            message: '获取视频列表时发生错误'
        };
    }
}

// 观看视频
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
                message: response.message || '观看视频失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            message: '观看视频时发生错误'
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
                message: response.message || '获取观看历史失败'
            };
        }
    } catch (error) {
        return {
            success: false,
            list: [],
            message: '获取观看历史时发生错误'
        };
    }
}

// 删除视频观看记录
export async function deleteVideoHistory(id: any) {
    return del(`video/history/views/${id}`);
}