import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  darkMode: 'class',
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
        card: '22px',
        'card-sm': '15px',
        button: '999px',
        'button-sm': '12px',
        modal: '26px',
        chip: '99px',
      },
      boxShadow: {
        card: '0 12px 28px -10px rgba(1,35,116,0.22)',
        'card-sm': '0 10px 24px -8px rgba(1,35,116,0.22)',
        'card-navy': '0 12px 28px -10px rgba(1,35,116,0.28)',
        btn: '0 10px 22px -10px rgba(1,35,116,0.5)',
        'btn-fab': '0 6px 16px -4px rgba(1,35,116,0.5)',
        modal: '0 40px 90px -30px rgba(0,26,77,0.6)',
        float: '0 6px 16px -4px rgba(0,0,0,0.4)',
      },
      fontFamily: {
        serif: ['var(--font-serif)', 'Georgia', 'serif'],
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-xl': ['88px', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-lg': ['64px', { lineHeight: '1.0', letterSpacing: '-0.02em' }],
        'display-md': ['44px', { lineHeight: '1.05' }],
        'heading-xl': ['34px', { lineHeight: '1.1' }],
        'heading-lg': ['30px', { lineHeight: '1.1' }],
        'heading-md': ['24px', { lineHeight: '1.15' }],
        'heading-sm': ['22px', { lineHeight: '1.2' }],
      },
    },
  },
  plugins: [],
};
export default config;
