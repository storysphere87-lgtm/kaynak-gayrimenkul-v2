/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.sahibinden.com' },
      { protocol: 'https', hostname: '**.supabase.co' }, // Kendi storage'ımız için
    ],
  },
};

export default nextConfig;
