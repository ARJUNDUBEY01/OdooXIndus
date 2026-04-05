// tailwind.config.ts
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
        "sans": ["Inter", "system-ui", "sans-serif"],
        "display": ["Manrope", "sans-serif"],
        "headline": ["Manrope", "sans-serif"],
        "body": ["Inter", "sans-serif"],
        "label": ["Inter", "sans-serif"]
      },
      colors: {
        "on-tertiary-container": "#47445f",
        "primary": "#005ac2",
        "surface-container-highest": "#dbe4e7",
        "secondary": "#5e5f65",
        "on-background": "#2b3437",
        "surface-bright": "#f8f9fa",
        "on-tertiary-fixed-variant": "#504e69",
        "secondary-fixed-dim": "#d4d4db",
        "on-secondary": "#f9f8ff",
        "on-primary-fixed": "#003c86",
        "surface-tint": "#005ac2",
        "on-secondary-fixed": "#3e3f45",
        "surface": "#f8f9fa",
        "surface-container-high": "#e2e9ec",
        "on-surface-variant": "#586064",
        "tertiary-dim": "#53506b",
        "surface-container-low": "#f1f4f6",
        "secondary-container": "#e2e2e9",
        "error-dim": "#4e0309",
        "tertiary": "#5f5c78",
        "on-primary-fixed-variant": "#0057bd",
        "tertiary-container": "#d3ceef",
        "surface-variant": "#dbe4e7",
        "on-error": "#fff7f6",
        "background": "#f8f9fa",
        "tertiary-fixed-dim": "#c5c0e0",
        "on-surface": "#2b3437",
        "surface-container-lowest": "#ffffff",
        "inverse-on-surface": "#9b9d9e",
        "tertiary-fixed": "#d3ceef",
        "on-tertiary-fixed": "#34314b",
        "primary-dim": "#004fab",
        "on-secondary-container": "#505157",
        "outline": "#737c7f",
        "on-error-container": "#752121",
        "inverse-surface": "#0c0f10",
        "primary-container": "#d8e2ff",
        "primary-fixed-dim": "#c3d4ff",
        "secondary-fixed": "#e2e2e9",
        "on-tertiary": "#fcf7ff",
        "outline-variant": "#abb3b7",
        "surface-dim": "#d1dce0",
        "surface-container": "#eaeff1",
        "inverse-primary": "#4d8eff",
        "on-primary-container": "#004eaa",
        "error-container": "#fe8983",
        "secondary-dim": "#515359",
        "on-secondary-fixed-variant": "#5a5b61",
        "primary-fixed": "#d8e2ff",
        "on-primary": "#f7f7ff",
        "error": "#9f403d"
      },
      borderRadius: {
        "DEFAULT": "0.125rem",
        "lg": "0.25rem",
        "xl": "0.5rem",
        "2xl": "1rem",
        "4xl": '2rem',
        "full": "9999px"
      },
      animation: {
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-left': 'slideLeft 0.4s ease forwards',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          from: { opacity: '0', transform: 'translateY(10px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        slideLeft: {
          from: { opacity: '0', transform: 'translateX(-20px)' },
          to:   { opacity: '1', transform: 'translateX(0)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 10px rgba(108,99,255,0.2)' },
          '50%':      { boxShadow: '0 0 25px rgba(108,99,255,0.5)' },
        },
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #6c63ff 0%, #a78bfa 100%)',
        'gradient-success': 'linear-gradient(135deg, #10b77f 0%, #6c63ff 100%)',
        'gradient-dark': 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
      },
      boxShadow: {
        'glow-sm':  '0 0 10px rgba(108,99,255,0.2)',
        'glow':     '0 0 25px rgba(108,99,255,0.3)',
        'glow-lg':  '0 0 50px rgba(108,99,255,0.35)',
        'card':     '0 4px 24px rgba(0,0,0,0.3)',
        'card-lg':  '0 8px 40px rgba(0,0,0,0.4)',
      },
    },
  },
  plugins: [],
};

export default config;
