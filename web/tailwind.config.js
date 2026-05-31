/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        sidebar: '#1f2937', // gray-800
        primary: '#3b82f6', // blue-500
      },
    },
  },
  plugins: [],
};
