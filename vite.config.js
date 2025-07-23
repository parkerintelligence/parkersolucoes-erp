export default {
  plugins: [],
  server: {
    port: 8080,
  },
  esbuild: {
    loader: 'jsx',
    include: /\.(jsx|js)$/,
  }
}