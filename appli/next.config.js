const isDev = false

module.exports = {
  dev: isDev,
  poweredByHeader: false,
  compress: true,
  generateEtags: false,
  reactStrictMode: false,

  onDemandEntries: {
    maxInactiveAge: 1000 * 60,
    pagesBufferLength: 1,
  },

  quiet: true,
}