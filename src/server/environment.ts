declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VERCEL_URL?: string;
    }
  }
}

export const isBetaMode =
  process.env.NODE_ENV === 'development' ||
  process.env.VERCEL_URL === 'beta.jun.codes';
