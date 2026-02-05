"use client";

import { Sparkles } from "lucide-react";
import { cn, formatScore, getScoreColor } from "@/lib/utils";
import { SearchResult } from "@/types";

interface RecommendationsPanelProps {
	results: SearchResult[];
}

export default function RecommendationsPanel({
	results,
}: RecommendationsPanelProps) {
	if (results.length === 0) {
		return null;
	}

	return (
		<div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6">
			<div className="overflow-x-auto">
				<div className="flex gap-4 pb-4" style={{ minWidth: "min-content" }}>
					{results.map((result) => (
						<div
							key={result.id}
							className="flex-shrink-0 w-64 bg-white rounded-lg shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden"
						>
							{/* Image */}
							<div className="relative aspect-square bg-gray-100">
								<img
									src={`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"}/api/image/${result.id}`}
									alt={`${result.category} ${result.id}`}
									className="w-full h-full object-cover"
									onError={(e) => {
										// Fallback to placeholder if image fails to load
										e.currentTarget.src = `data:image/svg+xml,${encodeURIComponent(`
											<svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
												<rect width="256" height="256" fill="#f1f5f9"/>
												<text x="50%" y="50%" font-family="Arial" font-size="14" fill="#94a3b8" text-anchor="middle" dy=".3em">
													${result.category} ${result.id}
												</text>
											</svg>
										`)}`;
									}}
								/>

								{/* Score Badge */}
								<div
									className={cn(
										"absolute top-2 right-2 px-2 py-1 rounded-full font-semibold text-xs shadow-lg bg-purple-100 text-purple-700",
									)}
								>
									{formatScore(result.similarity_score)}
								</div>
							</div>

							{/* Details */}
							<div className="p-3">
								<div className="flex items-center justify-between mb-2">
									<h4 className="font-semibold text-gray-800 capitalize text-sm">
										{result.category}
									</h4>
									<span className="text-xs text-gray-500">ID: {result.id}</span>
								</div>

								<div className="flex items-center justify-between text-xs">
									<span className="text-gray-600 flex items-center gap-1">
										<Sparkles className="w-3 h-3" />
										Match
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

								{/* Progress Bar */}
								<div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
									<div
										className="bg-gradient-to-r from-purple-500 to-indigo-500 h-1.5 rounded-full"
										style={{ width: `${result.similarity_score * 100}%` }}
									/>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>

			{/* Scroll Hint */}
			{results.length > 3 && (
				<div className="text-center text-sm text-gray-500 mt-2">
					← Scroll to see more →
				</div>
			)}
		</div>
	);
}
