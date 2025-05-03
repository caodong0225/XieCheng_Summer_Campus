import {clearJwtToken} from "@/store/token";

/**
 * 退出登录一梭子操作
 */
export async function logout() {
    try {
        clearJwtToken();
    } catch (error) {
        console.error("Logout API failed:", error);
        throw error; // 抛出错误让调用方处理
    }
    // try {
    //     await session.clearLoginSession();
    // } catch (error) {
    //     console.error("Clear session failed:", error);
    //     throw error;
    // }
}