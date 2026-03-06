// frontend/next.config.ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_ADMIN_TOKEN: process.env.NEXT_PUBLIC_ADMIN_TOKEN,
  }
}

export default nextConfig
