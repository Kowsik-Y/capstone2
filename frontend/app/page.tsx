"use client";

import { ArrowRight, Search, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getFeaturedItems } from "@/lib/api";
import type { SearchResponse } from "@/types";

export default function Home() {
	const router = useRouter();
	const [featured, setFeatured] = useState<SearchResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [searchQuery, setSearchQuery] = useState("");

	// Load featured items on mount
	useEffect(() => {
		const loadFeatured = async () => {
			try {
				const items = await getFeaturedItems(24);
				setFeatured(items);
			} catch (error) {
				console.error("Failed to load featured items:", error);
			} finally {
				setLoading(false);
			}
		};
		loadFeatured();
	}, []);

	const handleSearch = (e: React.FormEvent) => {
		e.preventDefault();
		if (searchQuery.trim()) {
			router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
			<Navbar />

			{/* Hero Section */}
			<div className="max-w-7xl mx-auto px-4 py-16">
				<div className="text-center mb-12">
					

					{/* Search Bar */}
					<form onSubmit={handleSearch} className="max-w-3xl mx-auto mb-6">
						<div className="relative">
							<input
								type="text"
								value={searchQuery}
								onChange={(e) => setSearchQuery(e.target.value)}
								placeholder='Try "gold ring without diamonds" or "simple necklace"'
								className="w-full px-6 py-4 pl-14 pr-32 text-lg border-2 border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent shadow-lg"
							/>
							<Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" />
							<button
								type="submit"
								className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full hover:from-purple-700 hover:to-indigo-700 transition-all font-medium"
							>
								Search
							</button>
						</div>
					</form>

					<div className="flex items-center justify-center gap-4">
						<Link
							href="/search"
							className="inline-flex items-center gap-2 px-6 py-3 bg-white border-2 border-purple-600 text-purple-600 rounded-full hover:bg-purple-50 transition-all font-medium shadow-md"
						>
							Advanced Search
							<ArrowRight className="w-5 h-5" />
						</Link>
					</div>
				</div>

				{/* Featured Items */}
				{loading && (
					<div className="text-center py-20">
						<Sparkles className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
						<p className="text-gray-600">Loading featured items...</p>
					</div>
				)}

				{!loading && featured && (
					<div>
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold text-gray-900">
								Featured Collection
							</h2>
							<Link
								href="/search"
								className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2"
							>
								View All
								<ArrowRight className="w-5 h-5" />
							</Link>
						</div>

						<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
							{featured.results.map((item) => (
								<Link
									key={item.id}
									href={`/product/${item.id}`}
									className="bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group"
								>
									<div className="relative aspect-square bg-gray-100">
										<img
											src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/image/${item.id}`}
											alt={`${item.category} ${item.id}`}
											className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
												const parent = target.parentElement;
												if (parent) {
													parent.innerHTML = `
														<div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
															<svg class="w-16 h-16 mb-2" fill="currentColor" viewBox="0 0 20 20">
																<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
															</svg>
															<span class="text-sm">${item.category} ${item.id}</span>
														</div>
													`;
												}
											}}
										/>
									</div>
									<div className="p-4">
										<h3 className="font-semibold text-gray-800 capitalize">
											{item.category}
										</h3>
										<p className="text-sm text-gray-600">ID: {item.id}</p>
									</div>
								</Link>
							))}
						</div>
					</div>
				)}
			</div>
		</div>
	);
}
