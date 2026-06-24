import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#012374',
          dark: '#001A4D',
        },
        accent: '#E3171A',
        gold: '#C8932B',
        paper: '#F7EFE1',
        canvas: '#FFFDF9',
        ink: '#16182A',
        success: '#7ED321',
        warning: '#F5A623',
        danger: '#D0021B',
        gray: {
          background: '#F7EFE1',
          secondary: '#8E8E93',
        },
      },
      borderRadius: {
        card: '12px',
        button: '24px',
      },
      boxShadow: {
        card: '0px 2px 8px rgba(0,0,0,0.08)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
export default config;
