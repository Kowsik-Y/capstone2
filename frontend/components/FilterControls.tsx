"use client";

import { CheckCircle2, ChevronDown, Filter, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { SearchFilters } from "@/types";

interface FilterControlsProps {
	filters: SearchFilters;
	onFiltersChange: (filters: SearchFilters) => void;
	onApply?: () => void;
	isExpanded?: boolean;
	onToggle?: () => void;
}

export default function FilterControls({
	filters,
	onApply,
	onFiltersChange,
	isExpanded: externalIsExpanded,
	onToggle,
}: FilterControlsProps) {
	const [internalIsExpanded, setInternalIsExpanded] = useState(false);
	const isExpanded =
		externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

	const handleToggle = () => {
		if (onToggle) {
			onToggle();
		} else {
			setInternalIsExpanded(!internalIsExpanded);
		}
	};

	const handleCategoryToggle = (category: string) => {
		const newCategories = filters.categories.includes(category)
			? filters.categories.filter((c) => c !== category)
			: [...filters.categories, category];

		onFiltersChange({ ...filters, categories: newCategories });
	};

	const handleMaterialToggle = (material: string) => {
		const newMaterials = filters.materials.includes(material)
			? filters.materials.filter((m) => m !== material)
			: [...filters.materials, material];

		onFiltersChange({ ...filters, materials: newMaterials });
	};

	const handleStoneToggle = (stone: string) => {
		const newStones = filters.stones.includes(stone)
			? filters.stones.filter((s) => s !== stone)
			: [...filters.stones, stone];

		onFiltersChange({ ...filters, stones: newStones });
	};

	const hasActiveFilters =
		filters.categories.length > 0 ||
		filters.materials.length > 0 ||
		filters.stones.length > 0 ||
		filters.maxDecorationScore !== 0.25 ||
		filters.minPlainScore !== 0.28 ||
		filters.semanticTopK !== 100;

	return (
		<div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
			{/* Header */}
			<button
				onClick={handleToggle}
				className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all group"
			>
				<div className="flex items-center gap-3">
					<div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg group-hover:from-purple-200 group-hover:to-indigo-200 transition-colors">
						<Filter className="w-5 h-5 text-purple-600" />
					</div>
					<div className="text-left">
						<h3 className="font-semibold text-gray-900">Advanced Filters</h3>
						{hasActiveFilters && (
							<p className="text-xs text-purple-600 font-medium">
								{filters.categories.length +
									filters.materials.length +
									filters.stones.length}{" "}
								active filter
								{filters.categories.length +
									filters.materials.length +
									filters.stones.length !==
								1
									? "s"
									: ""}
							</p>
						)}
					</div>
				</div>
				<ChevronDown
					className={`w-5 h-5 text-gray-400 transition-transform duration-300 ${
						isExpanded ? "rotate-180" : ""
					}`}
				/>
			</button>

			{/* Filter Options */}
			{isExpanded && (
				<div className="px-6 pb-6 border-t border-gray-100 pt-6 bg-gradient-to-br from-gray-50 to-white">
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7 gap-6">
						{/* Categories */}
						<div className="space-y-3">
							<label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
								Categories
							</label>
							<div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
								{[
									"ring",
									"necklace",
									"earrings",
									"bracelet",
									"bangle",
									"pendant",
									"chain",
									"anklet",
								].map((category) => (
									<label
										key={category}
										className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-white transition-all"
									>
										<input
											type="checkbox"
											checked={filters.categories.includes(category)}
											onChange={() => handleCategoryToggle(category)}
											className="w-5 h-5 text-purple-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer transition-all"
										/>
										<span className="text-sm text-gray-700 capitalize font-medium group-hover:text-purple-600 transition-colors">
											{category}
										</span>
									</label>
								))}
							</div>
						</div>

						{/* Materials */}
						<div className="space-y-3">
							<label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-4 bg-gradient-to-b from-yellow-500 to-amber-500 rounded-full"></div>
								Materials
							</label>
							<div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
								{["gold", "silver", "platinum", "white gold", "rose gold"].map(
									(material) => (
										<label
											key={material}
											className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-white transition-all"
										>
											<input
												type="checkbox"
												checked={filters.materials.includes(material)}
												onChange={() => handleMaterialToggle(material)}
												className="w-5 h-5 text-yellow-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 cursor-pointer transition-all"
											/>
											<span className="text-sm text-gray-700 capitalize font-medium group-hover:text-yellow-600 transition-colors">
												{material}
											</span>
										</label>
									),
								)}
							</div>
						</div>

						{/* Stones */}
						<div className="space-y-3">
							<label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
								Stones
							</label>
							<div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
								{[
									"diamond",
									"ruby",
									"emerald",
									"sapphire",
									"pearl",
									"gemstone",
								].map((stone) => (
									<label
										key={stone}
										className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-white transition-all"
									>
										<input
											type="checkbox"
											checked={filters.stones.includes(stone)}
											onChange={() => handleStoneToggle(stone)}
											className="w-5 h-5 text-pink-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-pink-500 focus:ring-offset-2 cursor-pointer transition-all"
										/>
										<span className="text-sm text-gray-700 capitalize font-medium group-hover:text-pink-600 transition-colors">
											{stone}
										</span>
									</label>
								))}
							</div>
						</div>

						{/* Semantic Top K */}
						<div className="space-y-3">
							<label className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
								<div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
								Search Pool
							</label>
							<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
								<div className="flex items-center justify-between mb-3">
									<span className="text-2xl font-bold text-purple-600">
										{filters.semanticTopK}
									</span>
									<span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
										results
									</span>
								</div>
								<input
									type="range"
									min="50"
									max="500"
									step="50"
									value={filters.semanticTopK}
									onChange={(e) =>
										onFiltersChange({
											...filters,
											semanticTopK: parseInt(e.target.value),
										})
									}
									className="w-full h-2 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
									style={{
										background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((filters.semanticTopK - 50) / 450) * 100}%, rgb(229 231 235) ${((filters.semanticTopK - 50) / 450) * 100}%, rgb(229 231 235) 100%)`,
									}}
								/>
								<div className="flex justify-between text-xs text-gray-400 mt-2">
									<span>50</span>
									<span>500</span>
								</div>
							</div>
						</div>

						{/* Max Decoration Score */}
						<div className="space-y-3">
							<label
								htmlFor="maxDecoration"
								className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
							>
								<div className="w-1 h-4 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
								Max Decoration
							</label>
							<select
								id="maxDecoration"
								value={filters.maxDecorationScore}
								onChange={(e) =>
									onFiltersChange({
										...filters,
										maxDecorationScore: parseFloat(e.target.value),
									})
								}
								className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-200 transition-all cursor-pointer font-medium text-gray-700"
							>
								<option value="1.0">Any (1.0)</option>
								<option value="0.5">Medium (0.5)</option>
								<option value="0.25">Low (0.25)</option>
								<option value="0.1">Very Low (0.1)</option>
							</select>
							<p className="text-xs text-gray-500 mt-2 leading-relaxed">
								Lower = stricter filtering
							</p>
						</div>

						{/* Min Plain Score */}
						<div className="space-y-3">
							<label
								htmlFor="minPlain"
								className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
							>
								<div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
								Min Plain
							</label>
							<select
								id="minPlain"
								value={filters.minPlainScore}
								onChange={(e) =>
									onFiltersChange({
										...filters,
										minPlainScore: parseFloat(e.target.value),
									})
								}
								className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all cursor-pointer font-medium text-gray-700"
							>
								<option value="0.0">Any (0.0)</option>
								<option value="0.28">Low (0.28)</option>
								<option value="0.5">Medium (0.5)</option>
								<option value="0.7">High (0.7)</option>
								<option value="0.9">Very High (0.9)</option>
							</select>
							<p className="text-xs text-gray-500 mt-2 leading-relaxed">
								Higher = only very plain items
							</p>
						</div>

						{/* Top K Results */}
						<div className="space-y-3">
							<label
								htmlFor="maxResults"
								className="block text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
							>
								<div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
								Max Results
							</label>
							<select
								id="maxResults"
								value={filters.topK}
								onChange={(e) =>
									onFiltersChange({
										...filters,
										topK: parseInt(e.target.value),
									})
								}
								className="w-full px-4 py-3 bg-white border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all cursor-pointer font-medium text-gray-700"
							>
								<option value="10">10 items</option>
								<option value="20">20 items</option>
								<option value="30">30 items</option>
								<option value="50">50 items</option>
								<option value="100">100 items</option>
							</select>
						</div>
					</div>

					{/* Action Buttons */}
					<div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-3">
						{/* Apply Button */}
						{onApply && (
							<button
								onClick={onApply}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl flex items-center justify-center gap-2"
							>
								<CheckCircle2 className="w-5 h-5" />
								Apply Filters
							</button>
						)}

						{/* Reset Button */}
						{hasActiveFilters && (
							<button
								onClick={() =>
									onFiltersChange({
										categories: [],
										materials: [],
										stones: [],
										topK: 100,
										maxDecorationScore: 0.25,
										minPlainScore: 0.28,
										semanticTopK: 100,
									})
								}
								className="flex-1 px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:from-gray-200 hover:to-gray-300 transition-all font-medium shadow-sm hover:shadow flex items-center justify-center gap-2 group"
							>
								<RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
								Reset Filters
							</button>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
