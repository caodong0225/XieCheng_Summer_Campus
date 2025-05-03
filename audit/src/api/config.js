const ENVIRONMENT = process.env.NODE_ENV || 'development';

const config = {
    development: {
        API_URL: 'http://localhost:3000/',
    },
    production: {
        API_URL: '/api/',
    },
}

export default config[ENVIRONMENT];
