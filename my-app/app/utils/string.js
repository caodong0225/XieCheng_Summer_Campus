import { SHA256 } from "crypto-js";

export function calcTimeDelta(time) {
  const delta = Math.floor(
    (new Date().getTime() - new Date(time).getTime()) / 1000
  );
  if (delta < 0) {
    return "刚刚";
  }
  if (delta < 60) {
    return `${delta}秒前`;
  }
  if (delta < 3600) {
    return `${Math.floor(delta / 60)}分钟前`;
  }
  if (delta < 86400) {
    return `${Math.floor(delta / 3600)}小时前`;
  }
  if (delta < 86400 * 3) {
    return `${Math.floor(delta / 86400)}天前`;
  }
  return timestampToDateTime(time, true);
}

export function timestampToDateTime(timestamp, short) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();
  const hour = date.getHours() < 10 ? `0${date.getHours()}` : date.getHours();
  const minute =
    date.getMinutes() < 10 ? `0${date.getMinutes()}` : date.getMinutes();
  const second =
    date.getSeconds() < 10 ? `0${date.getSeconds()}` : date.getSeconds();

  if (short) {
    return `${month}/${day}`;
  }

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`;
}

export function timestampToYearMonth(timestamp) {
  const date = new Date(timestamp);
  const year = date.getFullYear();
  const month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;

  return `${year}-${month}`;
}

export function timestampToDay(timestamp) {
  const date = new Date(timestamp);
  const day = date.getDate() < 10 ? `0${date.getDate()}` : date.getDate();

  return `${day}`;
}

export function timestampToTimeSpan(timestamp, options = {}) {
  // 默认选项
  const {
    maxUnits = 1,        // 最大显示的单位数
    language = 'zh',     // 语言（zh: 中文, en: 英文）
    precision = 'floor', // 精度处理（floor, ceil, round）
  } = options;

  // 输入验证
  if (typeof timestamp !== 'number' || isNaN(timestamp)) {
    return '无效时间';
  }

  // 处理负值
  const isNegative = timestamp < 0;
  const absTimestamp = Math.abs(timestamp); // 取绝对值
  let seconds = absTimestamp / 1000;

  // 定义单位和转换规则
  const units = [
    { name: language === 'zh' ? '天' : 'days', seconds: 86400 },
    { name: language === 'zh' ? '小时' : 'hours', seconds: 3600 },
    { name: language === 'zh' ? '分钟' : 'minutes', seconds: 60 },
    { name: language === 'zh' ? '秒' : 'seconds', seconds: 1 },
  ];

  // 计算每个单位的值
  let remainingSeconds = seconds;
  const result = [];
  for (const unit of units) {
    if (result.length >= maxUnits) break; // 限制单位数
    const value = Math[precision](remainingSeconds / unit.seconds);
    if (value > 0) {
      result.push(`${value} ${unit.name}`);
      remainingSeconds %= unit.seconds; // 更新剩余秒数
    }
  }

  // 无有效单位时返回最小单位
  if (result.length === 0) {
    return language === 'zh' ? '0 秒' : '0 seconds';
  }

  // 添加负号（如果适用）
  return isNegative ? `-${result.join(' ')}` : result.join(' ');
}

export function sha256(str) {
  return SHA256(str).toString();
}

export function getAvatar(user) {
  if (user?.avatar) {
    return user.avatar;
  }
  const hash = sha256(user?.email);
  return `https://gravatar.bzpl.tech/${hash}?d=identicon`;
}

export function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function parseJson(string) {
  // this function must return a json object, otherwise it will alert an error
  try {
    return JSON.parse(string);
  } catch (error) {
    alert(`参数错误，请联系管理员 ${error.message}`);
  }
}
