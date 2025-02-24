/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "background-blue": "#9ACBD0",
        "primary-blue": "#22658B",
        "button-text": "#F2EFE7",
        "hover-blue": "#0B364E",
      },
      fontFamily: {
        sans: ["Tilt Warp", "sans-serif"],
      },
    },
  },
  plugins: [],
};
