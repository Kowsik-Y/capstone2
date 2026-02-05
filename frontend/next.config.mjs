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
		const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
		return [
			{
				source: "/api/backend/:path*",
				destination: `${apiUrl}/:path*`,
			},
		];
	},
};

export default nextConfig;
