import {Button, Empty} from "antd";
import Link from "next/link";

export default function NotfoundError() {
    return (
        <div className="flex max-w-screen-xl mx-auto flex-wrap">
            <div className="w-full pt-5 pb-0 flex justify-start p-5 lg:pr-0 lg:w-3/4 flex-col gap-5">
                <div className="bg-white p-20 shadow-md rounded w-full flex flex-col items-center">
                    <Empty description="请求的页面不存在" />
                    <Link href="/m/">
                        <Button type="primary" className="mt-4">返回首页</Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}