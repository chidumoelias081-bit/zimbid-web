/** The browser talks to /api/*, and Next.js forwards it to the API, so no CORS setup is needed. */
const API_URL = process.env.API_URL || 'http://localhost:3000';

module.exports = {
  reactStrictMode: true,
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${API_URL}/:path*` }];
  },
};
