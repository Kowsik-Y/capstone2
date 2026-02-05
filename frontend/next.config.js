/** @type {import('next').NextConfig} */
const nextConfig = {
	images: {
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/**",
			},
		],
		unoptimized: true, // For local images from backend
	},
	async rewrites() {
		return [
			{
				source: "/api/backend/:path*",
				destination: process.env.NEXT_PUBLIC_API_URL + "/:path*",
			},
		];
	},
};

module.exports = nextConfig;
