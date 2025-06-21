// 步骤 1: 明确定义环境类型
type Environment = 'development' | 'production' | 'test';

// 步骤 2: 增强配置类型
interface Config {
  API_URL: string;
}

// 步骤 3: 使用类型安全的方式定义配置
const config: Record<Environment, Config> = {
  development: {
    API_URL: 'http://localhost:3000/',
  },
  production: {
    API_URL: '/',
  },
  test: { // 新增 test 环境配置
    API_URL: 'http://test-api.example.com/',
  }
};

// 步骤 4: 类型安全的获取环境变量
const getEnvironment = (): Environment => {
  const env = process.env.NODE_ENV;
  return (['development', 'production', 'test'].includes(env))
    ? env as Environment
    : 'development'; // 默认值
};

// 步骤 5: 导出配置
export default config[getEnvironment()];