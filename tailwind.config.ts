import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        inter: ['var(--font-inter)', 'sans-serif'],
        outfit: ['var(--font-outfit)', 'sans-serif'],
      },
      colors: {
        kraal: {
          bg:    '#0f1a0f',
          card:  '#111a11',
          green: {
            400: '#4ade80',
            500: '#22c55e',
            600: '#16a34a',
            900: '#14532d',
          },
        },
      },
    },
  },
  plugins: [],
};

export default config;
