/** @type {import('next').NextConfig} */
// NOTE: PWA implemented manually (public/manifest.json + public/sw.js + /offline page)
// instead of next-pwa, which is incompatible with Next 15. Offline support is a
// cache-first shell only; background sync is out of scope for the MVP.
// Standalone output is required by docker/Dockerfile.web but its traced-file
// symlink copy fails without admin rights on Windows — so it is enabled only
// on non-Windows (i.e. Docker/Linux) builds.
const isWindows = process.platform === 'win32';
const nextConfig = {
  output: isWindows ? undefined : 'standalone',
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }],
      },
      {
        source: '/manifest.json',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=3600' }],
      },
    ];
  },
};
export default nextConfig;
