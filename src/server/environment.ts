declare global {
  namespace NodeJS {
    interface ProcessEnv {
      VERCEL_URL?: string;
    }
  }
}

export const isBetaMode =
  process.env.VERCEL_URL === undefined ||
  process.env.VERCEL_URL === 'beta.jun.codes';
