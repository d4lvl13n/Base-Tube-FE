module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'base-orange': '#fa7517',
      },
    },
  },
  plugins: [
    require('@tailwindcss/aspect-ratio'),
  ],
}