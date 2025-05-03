"use client"

import { getAvatar } from '@/util/string';
import { Avatar, Tooltip } from 'antd';
import { useEffect, useState } from 'react';

const COLOR_SET = [
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
    '#f56a00',
    '#7265e6',
    '#ffbf00',
    '#00a2ae',
    '#00a854',
];


export function getColor(text) {
    const sum = text.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
    return COLOR_SET[sum % COLOR_SET.length];
}

export default function UserAvatar({ user, size }) {
    const [avatar, setAvatar] = useState(null);
    const [color, setColor] = useState(COLOR_SET[0]);
    useEffect(() => {
        if (user?.id === undefined) {
            return;
        }
        setAvatar(getAvatar(user));
        setColor(COLOR_SET[user?.id % COLOR_SET.length]);
    }, [user]);


    return (
        <Tooltip title={`${user?.username}`}>
            <Avatar size={size} style={{ backgroundColor: color }} src={avatar} >
                {user?.username}
            </Avatar>
        </Tooltip>

    )
} 