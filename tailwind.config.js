/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          500: "#4F46E5", // your app’s main blue
        },
        success: { 50: '#ECFDF5', 500: '#10B981' },
        error: { 50: '#FEF2F2', 500: '#EF4444' },
        warning: { 50: '#FFFBEB', 500: '#F59E0B' },
        'blue-light': { 50: '#EFF6FF', 500: '#3B82F6' },
      },
    },
  },
  plugins: [],
};
