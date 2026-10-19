/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        xero: {
          navy: "#001e4d",
          "navy-hover": "#002b66",
          blue: "#006fe6",
          "blue-hover": "#0056b3",
          green: "#137333",
          "green-hover": "#0e5927",
          border: "#e5e7eb",
          bg: "#f8f9fa",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
