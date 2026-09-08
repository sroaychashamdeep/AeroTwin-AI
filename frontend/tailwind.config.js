/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        aeroblack: '#070a0e',
        aerodark: '#0c1117',
        aerocard: '#131b26',
        aerocardhover: '#1a2433',
        aeroborder: '#1e2d40',
        aeroprimary: '#0ea5e9',
        aerocyan: '#06b6d4',
        aeroemerald: '#10b981',
        aeroamber: '#f59e0b',
        aerored: '#ef4444',
        aeromuted: '#8b9bb4'
      },
      fontFamily: {
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif']
      }
    },
  },
  plugins: [],
}
