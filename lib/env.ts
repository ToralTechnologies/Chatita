export const env = process.env.VERCEL_ENV ?? 'development';
export const isProd = env === 'production';
export const isBeta = env === 'preview';
export const isDev = env === 'development';
