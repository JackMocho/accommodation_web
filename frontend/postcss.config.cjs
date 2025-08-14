// postcss.config.js
module.exports = {
  plugins: {
    tailwindcss: {}, // Required for Tailwind to work
    autoprefixer: {}, // Auto-adds vendor prefixes (e.g., -webkit-)
    cssnano: {} // Optional: Minifies CSS in production builds
  },
};