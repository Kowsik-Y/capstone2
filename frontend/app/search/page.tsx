"use client";

import { Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import SearchBar from "@/components/SearchBar";
import SearchResults from "@/components/SearchResults";
import {
	getFeaturedItems,
	searchJewelry,
	uploadImageWithText,
} from "@/lib/api";
import type { SearchFilters, SearchResponse } from "@/types";

function SearchPageContent() {
	const searchParams = useSearchParams();
	const initialQuery = searchParams.get("q") || "";

	const [filteredResults, setFilteredResults] = useState<SearchResponse | null>(
		null,
	);
	const [displayedResults, setDisplayedResults] =
		useState<SearchResponse | null>(null);
	const [loading, setLoading] = useState(false);
	const [loadingMore, setLoadingMore] = useState(false);
	const [displayCount, setDisplayCount] = useState(20);
	const [filters, setFilters] = useState<SearchFilters>({
		categories: [],
		materials: [],
		stones: [],
		topK: 100,
		maxDecorationScore: 0.25,
		minPlainScore: 0.28,
		semanticTopK: 100,
	});
	const [tempFilters, setTempFilters] = useState<SearchFilters>({
		categories: [],
		materials: [],
		stones: [],
		topK: 100,
		maxDecorationScore: 0.25,
		minPlainScore: 0.28,
		semanticTopK: 100,
	});
	const [isFilterOpen, setIsFilterOpen] = useState(false);
	const [currentQuery, setCurrentQuery] = useState<string>(initialQuery);

	const loadMoreRef = useRef<HTMLDivElement>(null);

	const handleSearch = useCallback(
		async (query: string, useFilters?: SearchFilters) => {
			setLoading(true);
			// Update current query when search happens
			setCurrentQuery(query);
			try {
				const activeFilters = useFilters || filters;
				let enhancedQuery = query;
				if (
					activeFilters.materials.length > 0 ||
					activeFilters.stones.length > 0
				) {
					const filterTerms = [
						...activeFilters.materials,
						...activeFilters.stones,
					];
					enhancedQuery = `${query} with ${filterTerms.join(" ")}`.trim();
				}

				const response = await searchJewelry({
					query: enhancedQuery,
					categories:
						activeFilters.categories.length > 0
							? activeFilters.categories
							: undefined,
					top_k: 50, // Maximum allowed by backend
					max_decoration_score: activeFilters.maxDecorationScore,
					min_plain_score: activeFilters.minPlainScore,
					semantic_top_k: activeFilters.semanticTopK,
				});

				setFilteredResults(response);
				setDisplayCount(20); // Reset to show first 20
			} catch (error) {
				console.error("Search error:", error);
				alert("Search failed. Please try again.");
			} finally {
				setLoading(false);
			}
		},
		[filters],
	);

	const applyFilters = useCallback(
		async (queryFromSearchBar: string) => {
			// Use the query from search bar, it's always current since it's controlled
			const searchQuery = queryFromSearchBar.trim();
			
			// If no query, don't proceed
			if (!searchQuery) {
				return;
			}
			
			// Sync tempFilters to filters before searching
			setFilters(tempFilters);
			// Use the tempFilters directly to ensure we search with current state
			await handleSearch(searchQuery, tempFilters);
		},
		[tempFilters, handleSearch],
	);

	// Load all featured items on mount
	useEffect(() => {
		const loadAllItems = async () => {
			setLoading(true);
			try {
				const response = await getFeaturedItems(100);
				setFilteredResults(response);
			} catch (error) {
				console.error("Featured items error:", error);
				alert("Failed to load items. Please try again.");
			} finally {
				setLoading(false);
			}
		};

		if (initialQuery) {
			// Use setTimeout to ensure handleSearch is defined
			setTimeout(() => handleSearch(initialQuery), 0);
		} else {
			loadAllItems();
		}
	}, [initialQuery, handleSearch]);

	// Update displayed results based on display count (pagination)
	// All filtering is done on backend, not client-side
	useEffect(() => {
		if (!filteredResults) return;

		const toDisplay = filteredResults.results.slice(0, displayCount);
		setDisplayedResults({
			...filteredResults,
			results: toDisplay,
		});
	}, [filteredResults, displayCount]);

	// Infinite scroll observer
	useEffect(() => {
		if (!loadMoreRef.current || !filteredResults) return;

		const observer = new IntersectionObserver(
			(entries) => {
				const target = entries[0];
				if (
					target.isIntersecting &&
					!loadingMore &&
					displayCount < filteredResults.results.length
				) {
					setLoadingMore(true);
					// Simulate loading delay for better UX
					setTimeout(() => {
						setDisplayCount((prev) => prev + 20);
						setLoadingMore(false);
					}, 300);
				}
			},
			{
				rootMargin: "100px",
			},
		);

		observer.observe(loadMoreRef.current);

		return () => {
			observer.disconnect();
		};
	}, [displayCount, filteredResults, loadingMore]);

	const handleImageUpload = async (file: File, query?: string) => {
		setLoading(true);

		try {
			// Sync tempFilters to filters before searching
			setFilters(tempFilters);
			
			// Build enhanced query: preserve original intent, add filter terms as modifiers
			let enhancedQuery = query || "";
			if (tempFilters.materials.length > 0 || tempFilters.stones.length > 0) {
				const filterTerms = [...tempFilters.materials, ...tempFilters.stones];
				// Add filter terms to refine the query (not replace it)
				if (enhancedQuery) {
					enhancedQuery =
						`${enhancedQuery} with ${filterTerms.join(" ")}`.trim();
				} else {
					enhancedQuery = filterTerms.join(" ");
				}
			}

			const response = await uploadImageWithText(
				file,
				enhancedQuery || undefined,
				50, // Maximum allowed by backend
				tempFilters.categories.length > 0 ? tempFilters.categories : undefined,
			);
			setFilteredResults(response);
			setDisplayCount(20); // Reset to show first 20
		} catch (error) {
			console.error("Image upload error:", error);
			alert("Image search failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
			<Navbar />

			<div className="max-w-7xl mx-auto px-4 py-8">
				{/* Search Header */}
				<div className="text-center mb-12">
					<h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent mb-3">
						Search Jewellery
					</h1>
					<p className="text-lg text-gray-600">
						Find your perfect piece using AI-powered search
					</p>
				</div>

				{/* Search Box with Integrated Filters */}
				<div className="max-w-4xl mx-auto mb-8">
					{/* Search Bar */}
					<SearchBar
						onSearch={handleSearch}
						onImageUpload={handleImageUpload}
						loading={loading}
						query={currentQuery}
						onQueryChange={setCurrentQuery}
						filters={tempFilters}
						onFiltersChange={setTempFilters}
						onApply={applyFilters}
						isExpanded={isFilterOpen}
						onToggle={() => setIsFilterOpen(!isFilterOpen)}
					/>
				</div>

				{/* Search Results */}
				{!loading && displayedResults && (
					<div>
						{/* Results Header */}
						<div className="flex items-center justify-between mb-6">
							<h2 className="text-2xl font-bold text-gray-900">
								{displayedResults.results.length}{" "}
								{displayedResults.results.length === 1 ? "Result" : "Results"}
								{filteredResults &&
									filteredResults.results.length !==
										displayedResults.results.length && (
										<span className="text-sm text-gray-500 font-normal ml-2">
											(showing {displayedResults.results.length} of{" "}
											{filteredResults.results.length})
										</span>
									)}
							</h2>
							{(displayedResults.enhanced_query !== displayedResults.query ||
								displayedResults.categories.length > 0 ||
								displayedResults.negations.length > 0) && (
								<button
									type="button"
									onClick={() => {
										setFilteredResults(null);
										setDisplayedResults(null);
										setDisplayCount(20);
									}}
									className="text-sm text-purple-600 hover:text-purple-700 font-medium"
								>
									Clear Search
								</button>
							)}
						</div>

						{/* Query Info - Compact Version */}
						{(displayedResults.enhanced_query !== displayedResults.query ||
							displayedResults.categories.length > 0 ||
							displayedResults.negations.length > 0) && (
							<div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl shadow-sm p-5 mb-8 border border-purple-100">
								<div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
									{displayedResults.enhanced_query !==
										displayedResults.query && (
										<div className="flex items-center gap-2">
											<span className="font-semibold text-purple-700">
												Enhanced:
											</span>
											<span className="text-gray-700">
												{displayedResults.enhanced_query}
											</span>
										</div>
									)}
									{displayedResults.categories.length > 0 && (
										<div className="flex items-center gap-2">
											<span className="font-semibold text-purple-700">
												Categories:
											</span>
											<span className="text-gray-700">
												{displayedResults.categories.join(", ")}
											</span>
										</div>
									)}
									{displayedResults.negations.length > 0 && (
										<div className="flex items-center gap-2">
											<span className="font-semibold text-purple-700">
												Excluding:
											</span>
											<span className="text-red-600">
												{displayedResults.negations.join(", ")}
											</span>
										</div>
									)}
								</div>
							</div>
						)}

						<SearchResults results={displayedResults.results} />

						{/* Load More Trigger */}
						{filteredResults &&
							displayCount < filteredResults.results.length && (
								<div
									ref={loadMoreRef}
									className="flex items-center justify-center py-8"
								>
									{loadingMore && (
										<div className="flex items-center gap-3">
											<Sparkles className="w-6 h-6 text-purple-600 animate-spin" />
											<span className="text-gray-600">Loading more...</span>
										</div>
									)}
								</div>
							)}

						{/* End of Results */}
						{filteredResults &&
							displayCount >= filteredResults.results.length &&
							displayedResults.results.length > 0 && (
								<div className="text-center py-8 text-gray-500">
									<p className="text-sm">You've reached the end</p>
								</div>
							)}
					</div>
				)}

				{/* Empty State */}
				{!filteredResults && !loading && (
					<div className="bg-white rounded-3xl shadow-lg p-16 text-center">
						<div className="max-w-md mx-auto">
							<div className="w-20 h-20 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
								<Sparkles className="w-10 h-10 text-purple-600" />
							</div>
							<h3 className="text-2xl font-bold text-gray-800 mb-3">
								Start Your Search
							</h3>
							<p className="text-gray-600 mb-6">
								Search by description or upload an image to find similar
								jewellery
							</p>
						</div>
					</div>
				)}
			</div>
		</div>
	);
}

export default function SearchPage() {
	return (
		<Suspense fallback={<div>Loading...</div>}>
			<SearchPageContent />
		</Suspense>
	);
}
