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
          DEFAULT: '#4A90E2',
          dark: '#3A7BC8',
        },
        success: '#7ED321',
        warning: '#F5A623',
        danger: '#D0021B',
        gray: {
          background: '#F5F5F7',
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
    },
  },
  plugins: [],
};
export default config;
