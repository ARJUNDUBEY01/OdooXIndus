/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#0a0a0f',
        secondary: '#16161f',
        accent: {
          DEFAULT: '#6c63ff',
          light: '#8b84ff',
          dark: '#5249e0',
        },
        success: '#10d98a',
        warning: '#f59e0b',
        danger: '#ef4444',
        info: '#38bdf8',
        'text-primary': '#f0f0f8',
        'text-secondary': '#a0a0b8',
        'text-muted': '#555568',
        border: 'rgba(255, 255, 255, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        glass: '0 8px 32px 0 rgba(0, 0, 0, 0.36)',
      },
    },
  },
  plugins: [],
}
