"use client";

import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { getProduct, getRecommendations } from "@/lib/api";
import type { SearchResponse, SearchResult } from "@/types";

export default function ProductPage() {
	const params = useParams();
	const router = useRouter();
	const productId = parseInt(params.id as string);

	const [product, setProduct] = useState<SearchResult | null>(null);
	const [recommendations, setRecommendations] = useState<SearchResponse | null>(
		null,
	);
	const [loading, setLoading] = useState(true);
	const [loadingDescription, setLoadingDescription] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const loadProduct = async () => {
			try {
				setLoading(true);
				setError(null);

				// Load recommendations first (faster, no AI generation)
				const recsData = await getRecommendations(productId, 12);
				setRecommendations(recsData);

				// Set basic product info from recommendations
				if (recsData.results.length > 0) {
					const basicProduct = {
						id: productId,
						category: recsData.results[0]?.category || "jewellery",
						similarity_score: 1.0,
					};
					setProduct(basicProduct);
				}

				setLoading(false);

				// Load full product details with description in background
				setLoadingDescription(true);
				const productData = await getProduct(productId);
				setProduct(productData);
				setLoadingDescription(false);
			} catch (err) {
				console.error("Failed to load product:", err);
				setError("Failed to load product. Please try again.");
				setLoading(false);
				setLoadingDescription(false);
			}
		};

		if (!isNaN(productId)) {
			loadProduct();
		}
	}, [productId]);

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-12">
					<div className="flex items-center justify-center h-96">
						<div className="text-center">
							<Sparkles className="w-16 h-16 text-purple-600 animate-pulse mx-auto mb-4" />
							<p className="text-gray-600">Loading product...</p>
						</div>
					</div>
				</div>
			</div>
		);
	}

	if (error || !product) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
				<Navbar />
				<div className="max-w-7xl mx-auto px-4 py-12">
					<div className="text-center py-20">
						<h2 className="text-2xl font-bold text-gray-800 mb-4">
							Product Not Found
						</h2>
						<p className="text-gray-600 mb-8">
							{error || "The product you're looking for doesn't exist."}
						</p>
						<Link
							href="/"
							className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-lg hover:from-purple-700 hover:to-indigo-700 transition-all"
						>
							<ArrowLeft className="w-5 h-5" />
							Back to Home
						</Link>
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Breadcrumb */}
				<div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
					<Link href="/" className="hover:text-purple-600 transition-colors">
						Home
					</Link>
					<span>→</span>
					<Link
						href="/search"
						className="hover:text-purple-600 transition-colors"
					>
						Browse
					</Link>
					<span>→</span>
					<span className="text-gray-900 font-medium capitalize">
						{product.category}
					</span>
				</div>

				{/* Product Details */}
				<div className="bg-white rounded-3xl shadow-xl overflow-hidden mb-16">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
						{/* Product Image */}
						<div className="relative aspect-square bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden">
							<img
								src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/image/${product.id}`}
								alt={`${product.category} ${product.id}`}
								className="w-full h-full object-contain p-12 hover:scale-105 transition-transform duration-500"
								onError={(e) => {
									const target = e.target as HTMLImageElement;
									target.style.display = "none";
									const parent = target.parentElement;
									if (parent) {
										parent.innerHTML = `
											<div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
												<svg class="w-32 h-32 mb-4" fill="currentColor" viewBox="0 0 20 20">
													<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
												</svg>
												<span class="text-lg">${product.category} ${product.id}</span>
											</div>
										`;
									}
								}}
							/>
						</div>

						{/* Product Info */}
						<div className="p-8 lg:p-12 flex flex-col">
							<div className="flex-1">
								<div className="mb-8">
									<h1 className="text-5xl font-bold text-gray-900 capitalize mb-3">
										{product.category}
									</h1>
									<div className="flex items-center gap-3">
										<span className="px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
											Premium Collection
										</span>
										<span className="text-gray-500 text-sm">
											ID: {product.id}
										</span>
									</div>
								</div>

								{/* AI-Generated Description */}
								<div className="mb-8">
									<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
										Description
									</h2>
									{loadingDescription ? (
										<div className="space-y-3 animate-pulse">
											<div className="h-4 bg-gray-200 rounded w-full"></div>
											<div className="h-4 bg-gray-200 rounded w-5/6"></div>
											<div className="h-4 bg-gray-200 rounded w-4/6"></div>
										</div>
									) : product.description ? (
										<p className="text-gray-700 text-lg leading-relaxed">
											{product.description}
										</p>
									) : (
										<p className="text-gray-500 text-lg leading-relaxed italic">
											Description not available
										</p>
									)}
								</div>

								{/* Features */}
								<div className="mb-8">
									<h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
										Features
									</h2>
									<div className="space-y-3">
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-purple-600 rounded-full"></div>
											<span className="text-gray-700">
												AI-verified similarity matching
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-purple-600 rounded-full"></div>
											<span className="text-gray-700">
												High-quality imagery
											</span>
										</div>
										<div className="flex items-center gap-3">
											<div className="w-2 h-2 bg-purple-600 rounded-full"></div>
											<span className="text-gray-700">Curated collection</span>
										</div>
									</div>
								</div>
							</div>

							{/* Actions */}
							<div className="flex gap-4 mt-8 pt-8 border-t border-gray-200">
								<button
									onClick={() => router.back()}
									className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
								>
									<ArrowLeft className="w-5 h-5" />
									Back
								</button>
								<Link
									href="/search"
									className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-medium shadow-lg shadow-purple-500/30"
								>
									<Sparkles className="w-5 h-5" />
									Explore More
								</Link>
							</div>
						</div>
					</div>
				</div>

				{/* Similar Items Section */}
				{recommendations && recommendations.results.length > 0 && (
					<div>
						<div className="flex items-center justify-between mb-8">
							<h2 className="text-3xl font-bold text-gray-900">
								You May Also Like
							</h2>
							<Link
								href="/search"
								className="text-purple-600 hover:text-purple-700 font-medium flex items-center gap-2 group"
							>
								View All
								<svg
									className="w-5 h-5 group-hover:translate-x-1 transition-transform"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M9 5l7 7-7 7"
									/>
								</svg>
							</Link>
						</div>
						<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
							{recommendations.results.map((item) => (
								<Link
									key={item.id}
									href={`/product/${item.id}`}
									className="bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden group"
								>
									<div className="relative aspect-square bg-gray-50">
										<img
											src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/image/${item.id}`}
											alt={`${item.category} ${item.id}`}
											className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-300"
											onError={(e) => {
												const target = e.target as HTMLImageElement;
												target.style.display = "none";
												const parent = target.parentElement;
												if (parent) {
													parent.innerHTML = `
														<div class="w-full h-full flex flex-col items-center justify-center text-gray-400">
															<svg class="w-12 h-12 mb-1" fill="currentColor" viewBox="0 0 20 20">
																<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd" />
															</svg>
															<span class="text-xs">${item.category}</span>
														</div>
													`;
												}
											}}
										/>
										{item.similarity_score !== undefined &&
											!isNaN(item.similarity_score) && (
												<div className="absolute top-2 right-2 px-2 py-1 bg-purple-600 text-white rounded-lg text-xs font-bold shadow-lg">
													{(item.similarity_score * 100).toFixed(0)}%
												</div>
											)}
									</div>
									<div className="p-3">
										<h3 className="font-semibold text-gray-800 capitalize text-sm truncate">
											{item.category}
										</h3>
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
