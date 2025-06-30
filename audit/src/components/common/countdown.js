"use client";

import {useEffect, useState} from "react";
import {ClockCircleFilled} from "@ant-design/icons";
import {timestampToTimeSpan} from "@/util/string";

export default function CountDown({expirationTime}) {
    const [time, setTime] = useState(0);
    const parseExpirationTime = (expirationTime) => {
        if (expirationTime instanceof Date) {
            return expirationTime;
        }

        if (typeof expirationTime === "string") {
            const date = new Date(expirationTime);
            if (!isNaN(date.getTime())) {
                return date;
            }

            const numericTest = /^\d+$/;
            if (numericTest.test(expirationTime)) {
                expirationTime = Number(expirationTime);
            }
        }

        if (typeof expirationTime === "number") {
            if (expirationTime.toString().length === 10) {
                return new Date(expirationTime * 1000);
            } else if (expirationTime.toString().length === 13) {
                return new Date(expirationTime);
            }
        }

        throw new Error("Invalid container expirationTime format");
    };

    useEffect(() => {
        const checked = parseExpirationTime(expirationTime);
        setTime(checked - Date.now());
        const interval = setInterval(() => {
            setTime(checked - Date.now());
        }, 1000);
        return () => clearInterval(interval);
    }, [expirationTime]);

    return (
        <div className="flex items-center gap-1">
            <div>
                <ClockCircleFilled/>
            </div>
            <span>{timestampToTimeSpan(time)}</span>
        </div>
    );
};
