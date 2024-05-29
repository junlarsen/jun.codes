import * as colors from '@radix-ui/colors';
import type { Config } from 'tailwindcss';

function createScale(color: Record<string, string>) {
  return Object.entries(color).reduce<Record<string, string>>(
    (acc, [key, value]) => {
      // biome-ignore lint/style/noNonNullAssertion: safe, as regex always matches here
      const [_, colorIndex] = key.match(/[A-Za-z]+(\d+)/)!;
      acc[colorIndex] = value;
      return acc;
    },
    {},
  );
}

export default {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        fraunces: ['var(--font-fraunces)', 'ui-serif'],
        lato: ['var(--font-lato)', 'ui-sans-serif'],
      },
      colors: {
        brand: createScale(colors.red),
        gray: createScale(colors.mauve),
      },
    },
  },
  plugins: [],
} satisfies Config;
