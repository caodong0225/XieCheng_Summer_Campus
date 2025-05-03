import packageJson from '../../package.json';

export function getSiteConfig() {
    return {
        siteName: '旅游日记平台',
        copyRightFooterName: `${new Date().getFullYear()} 曹东  V${packageJson.version}`,
    }
}
