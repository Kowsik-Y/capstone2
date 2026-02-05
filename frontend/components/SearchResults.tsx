"use client";

import { Award, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cn, formatScore, getScoreBgColor, getScoreColor } from "@/lib/utils";
import type { SearchResult } from "@/types";

interface SearchResultsProps {
	results: SearchResult[];
}

function LazyImage({ result, index }: { result: SearchResult; index: number }) {
	const [loaded, setLoaded] = useState(false);
	const [isVisible, setIsVisible] = useState(false);
	const imgRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (!imgRef.current) return;

		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting) {
						setIsVisible(true);
						observer.disconnect();
					}
				});
			},
			{
				rootMargin: "50px",
			},
		);

		observer.observe(imgRef.current);

		return () => {
			observer.disconnect();
		};
	}, []);

	return (
		<div
			ref={imgRef}
			className="relative aspect-square bg-gray-100 overflow-hidden"
		>
			{!loaded && isVisible && (
				<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200 animate-pulse">
					<Sparkles className="w-8 h-8 text-gray-400 animate-spin" />
				</div>
			)}
			{!isVisible && (
				<div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-purple-50 to-indigo-50">
					<Sparkles className="w-8 h-8 text-purple-300" />
				</div>
			)}
			{isVisible && (
				<img
					src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/image/${result.id}`}
					alt={`${result.category} ${result.id}`}
					onLoad={() => setLoaded(true)}
					onError={(e) => {
						setLoaded(true);
						const target = e.target as HTMLImageElement;
						target.style.display = "none";
					}}
					className={`w-full h-full object-contain p-4 group-hover:scale-105 transition-all duration-300 ${
						loaded ? "opacity-100" : "opacity-0"
					}`}
				/>
			)}
			{index < 3 && (
				<div className="absolute top-3 left-3 bg-gradient-to-br from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full font-bold text-sm shadow-lg flex items-center gap-1 z-10">
					<Award className="w-4 h-4" />#{index + 1}
				</div>
			)}

			{/* Similarity Score Badge */}
			{result.similarity_score !== undefined && (
				<div
					className={cn(
						"absolute top-3 right-3 px-3 py-1 rounded-full font-semibold text-sm shadow-lg z-10",
						getScoreBgColor(result.similarity_score),
						getScoreColor(result.similarity_score),
					)}
				>
					{formatScore(result.similarity_score)}
				</div>
			)}
		</div>
	);
}

export default function SearchResults({ results }: SearchResultsProps) {
	if (results.length === 0) {
		return (
			<div className="text-center py-12 bg-white rounded-lg shadow-md">
				<p className="text-gray-500 text-lg">
					No results found. Try adjusting your filters.
				</p>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
			{results.map((result, index) => (
				<Link
					key={result.id}
					href={`/product/${result.id}`}
					className="bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden group block"
				>
					{/* Image with Lazy Loading */}
					<LazyImage result={result} index={index} />

					{/* Details */}
					<div className="p-4">
						<div className="flex items-center justify-between mb-3">
							<h3 className="text-lg font-bold text-gray-800 capitalize">
								{result.category}
							</h3>
							<span className="text-xs text-gray-500">ID: {result.id}</span>
						</div>

						{/* Scores */}
						<div className="space-y-2 mb-4">
							<div className="flex items-center justify-between text-sm">
								<span className="text-gray-600 flex items-center gap-1">
									<Sparkles className="w-3 h-3" />
									Similarity
								</span>
								<span
									className={cn(
										"font-semibold",
										getScoreColor(result.similarity_score),
									)}
								>
									{formatScore(result.similarity_score)}
								</span>
							</div>

							{result.plain_score !== null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Plain Score</span>
									<span
										className={cn(
											"font-semibold",
											getScoreColor(result.plain_score),
										)}
									>
										{formatScore(result.plain_score)}
									</span>
								</div>
							)}

							{result.decoration_score !== null && (
								<div className="flex items-center justify-between text-sm">
									<span className="text-gray-600">Decoration</span>
									<span
										className={cn(
											"font-semibold",
											getScoreColor(1 - result.decoration_score),
										)}
									>
										{formatScore(result.decoration_score)}
									</span>
								</div>
							)}
						</div>

						{/* Progress Bar */}
						<div className="w-full bg-gray-200 rounded-full h-2">
							<div
								className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full transition-all duration-500"
								style={{ width: `${result.similarity_score * 100}%` }}
							/>
						</div>
					</div>
				</Link>
			))}
		</div>
	);
}
