"use client";

import {
	CheckCircle2,
	ChevronDown,
	Filter,
	Image as ImageIcon,
	Loader2,
	Paperclip,
	RotateCcw,
	Search,
	X,
} from "lucide-react";
import {
	type FormEvent,
	useCallback,
	useEffect,
	useRef,
	useState,
} from "react";
import { getCategories } from "@/lib/api";
import type { SearchFilters } from "@/types";

interface SearchBarProps {
	onSearch: (query: string) => void;
	onImageUpload?: (file: File, query?: string) => void;
	loading: boolean;
	query?: string;
	onQueryChange?: (query: string) => void;
	filters?: SearchFilters;
	onFiltersChange?: (filters: SearchFilters) => void;
	onApply?: (query: string) => void;
	isExpanded?: boolean;
	onToggle?: () => void;
}

export default function SearchBar({
	onSearch,
	onImageUpload,
	loading,
	query: controlledQuery = "",
	onQueryChange,
	filters,
	onApply,
	onFiltersChange,
	isExpanded: externalIsExpanded,
	onToggle,
}: SearchBarProps) {
	const [showImageModal, setShowImageModal] = useState(false);
	const [internalIsExpanded, setInternalIsExpanded] = useState(false);
	const [categories, setCategories] = useState<string[]>([]);
	const [loadingCategories, setLoadingCategories] = useState(true);
	const isExpanded =
		externalIsExpanded !== undefined ? externalIsExpanded : internalIsExpanded;

	// Use controlled query from parent
	const query = controlledQuery;

	// Default filters if not provided
	const activeFilters: SearchFilters = filters || {
		categories: [],
		materials: [],
		stones: [],
		topK: 100,
		maxDecorationScore: 0.25,
		minPlainScore: 0.28,
		semanticTopK: 100,
	};

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const data = await getCategories();
				setCategories(data.categories);
			} catch (error) {
				console.error("Failed to fetch categories:", error);
				// Fallback to default categories if API fails
				setCategories(["ring", "necklace", "earrings", "bracelet"]);
			} finally {
				setLoadingCategories(false);
			}
		};
		fetchCategories();
	}, []);

	const handleToggle = () => {
		if (onToggle) {
			onToggle();
		} else {
			setInternalIsExpanded(!internalIsExpanded);
		}
	};

	const handleCategoryToggle = (category: string) => {
		if (!onFiltersChange) return;
		const newCategories = activeFilters.categories.includes(category)
			? activeFilters.categories.filter((c) => c !== category)
			: [...activeFilters.categories, category];

		onFiltersChange({ ...activeFilters, categories: newCategories });
	};

	const handleMaterialToggle = (material: string) => {
		if (!onFiltersChange) return;
		const newMaterials = activeFilters.materials.includes(material)
			? activeFilters.materials.filter((m) => m !== material)
			: [...activeFilters.materials, material];

		onFiltersChange({ ...activeFilters, materials: newMaterials });
	};

	const handleStoneToggle = (stone: string) => {
		if (!onFiltersChange) return;
		const newStones = activeFilters.stones.includes(stone)
			? activeFilters.stones.filter((s) => s !== stone)
			: [...activeFilters.stones, stone];

		onFiltersChange({ ...activeFilters, stones: newStones });
	};

	const hasActiveFilters =
		activeFilters.categories.length > 0 ||
		activeFilters.materials.length > 0 ||
		activeFilters.stones.length > 0 ||
		activeFilters.maxDecorationScore !== 0.25 ||
		activeFilters.minPlainScore !== 0.28 ||
		activeFilters.semanticTopK !== 100;

	const handleQueryChange = (newQuery: string) => {
		if (onQueryChange) {
			onQueryChange(newQuery);
		}
	};
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imageQuery, setImageQuery] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);

	const processFile = useCallback((file: File) => {
		if (file?.type?.startsWith("image/")) {
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	}, []);

	const handlePaste = useCallback(
		(e: ClipboardEvent) => {
			if (!showImageModal) return;

			const items = e.clipboardData?.items;
			if (!items) return;

			for (let i = 0; i < items.length; i++) {
				const item = items[i];
				if (item.type.startsWith("image/")) {
					const file = item.getAsFile();
					if (file) {
						processFile(file);
						e.preventDefault();
					}
				}
			}
		},
		[showImageModal, processFile],
	);

	useEffect(() => {
		window.addEventListener("paste", handlePaste);
		return () => {
			window.removeEventListener("paste", handlePaste);
		};
	}, [handlePaste]);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			// Use onApply if available to apply filters, otherwise use onSearch
			if (onApply) {
				onApply(query.trim());
			} else {
				onSearch(query.trim());
			}
		}
	};
	const handleApply = () => {
		if (onApply) {
			// Always sync the current query to parent first
			if (onQueryChange) {
				onQueryChange(query);
			}
			// Pass the current input box query to apply with filters
			onApply(query);
		}
	};
	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			processFile(file);
		}
	};

	const handleDrop = async (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);

		// Try to get file from drop
		const file = e.dataTransfer.files[0];
		if (file) {
			processFile(file);
			return;
		}

		// If no file, try to get image URL (when dragging from websites)
		const imageUrl = e.dataTransfer.getData("text/html");
		const urlMatch = imageUrl.match(/src="([^"]+)"/);
		const imageUrlToFetch = urlMatch
			? urlMatch[1]
			: e.dataTransfer.getData("text/plain");

		if (!imageUrlToFetch) return;

		// Skip file:// URLs as they can't be fetched due to security restrictions
		if (imageUrlToFetch.startsWith("file://")) {
			alert(
				"Cannot load local files. Please use the file picker or copy/paste the image instead.",
			);
			return;
		}

		// Only try to fetch if it looks like an image URL
		if (
			imageUrlToFetch.match(/\.(jpeg|jpg|gif|png|webp)$/i) ||
			imageUrlToFetch.startsWith("data:image") ||
			imageUrlToFetch.startsWith("http")
		) {
			try {
				const res = await fetch(imageUrlToFetch, { mode: "cors" });
				const blob = await res.blob();
				const file = new File([blob], "dragged-image.jpg", {
					type: blob.type || "image/jpeg",
				});
				processFile(file);
			} catch (err) {
				console.error("Failed to fetch dragged image:", err);
				alert(
					"Cannot load this image due to security restrictions. Please download it first or use copy/paste instead.",
				);
			}
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(true);
	};

	const handleDragLeave = (e: React.DragEvent) => {
		e.preventDefault();
		setIsDragging(false);
	};

	const handleImageSearch = () => {
		if (selectedFile && onImageUpload) {
			onImageUpload(selectedFile, imageQuery.trim() || undefined);
			setShowImageModal(false);
			setPreview(null);
			setSelectedFile(null);
			setImageQuery("");
		}
	};

	const handleCloseModal = () => {
		setShowImageModal(false);
		setPreview(null);
		setSelectedFile(null);
		setImageQuery("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const exampleQueries = [
		"Gold Ring",
		"simple gold necklace",
		"plain wedding band",
	];

	return (
		<div className="w-full mx-auto">
			<form onSubmit={handleSubmit} className="relative space-y-4">
				<div className="relative">
					<input
						type="text"
						value={query}
						onChange={(e) => handleQueryChange(e.target.value)}
						placeholder="Search for jewelry... "
						className="w-full pl-12 pr-40 py-4 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg"
						disabled={loading}
					/>
					{/* Search Icon on the left */}
					<div className="absolute left-4 top-1/2 -translate-y-1/2">
						<Search className="w-5 h-5 text-gray-400" />
					</div>
					{/* Action buttons on the right */}
					<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
						{onImageUpload && (
							<button
								type="button"
								onClick={() => setShowImageModal(true)}
								disabled={loading}
								className="p-3 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors border border-gray-300"
								title="Attach image to search"
							>
								<Paperclip className="w-5 h-5" />
							</button>
						)}
						<button
							type="submit"
							disabled={loading || !query.trim()}
							className="px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								"Search"
							)}
						</button>
					</div>
				</div>

				{/* Advanced Filters Section */}
				<div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
					{/* Header */}
					<button
						type="button"
						onClick={handleToggle}
						className="w-full px-6 py-4 flex items-center justify-between hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 transition-all group"
					>
						<div className="flex items-center gap-3">
							<div className="p-2 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg group-hover:from-purple-200 group-hover:to-indigo-200 transition-colors">
								<Filter className="w-5 h-5 text-purple-600" />
							</div>
							<div className="text-left">
								<h3 className="font-semibold text-gray-900">
									Advanced Filters
								</h3>
								{hasActiveFilters && (
									<p className="text-xs text-purple-600 font-medium">
										{activeFilters.categories.length +
											activeFilters.materials.length +
											activeFilters.stones.length}{" "}
										active filter
										{activeFilters.categories.length +
											activeFilters.materials.length +
											activeFilters.stones.length !==
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
									<div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
										<div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
										Categories
									</div>
									<div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
										{loadingCategories ? (
											<div className="text-sm text-gray-500 p-2">
												Loading...
											</div>
										) : (
											categories.map((category) => (
												<label
													key={category}
													className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-white transition-all"
												>
													<input
														type="checkbox"
														checked={activeFilters.categories.includes(
															category,
														)}
														onChange={() => handleCategoryToggle(category)}
														className="w-5 h-5 text-purple-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 cursor-pointer transition-all"
													/>
													<span className="text-sm text-gray-700 capitalize font-medium group-hover:text-purple-600 transition-colors">
														{category}
													</span>
												</label>
											))
										)}
									</div>
								</div>
								{/* Materials */}
								<div className="space-y-3">
									<div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
										<div className="w-1 h-4 bg-gradient-to-b from-yellow-500 to-amber-500 rounded-full"></div>
										Materials
									</div>
									<div className="space-y-2.5 max-h-48 overflow-y-auto pr-2">
										{[
											"gold",
											"silver",
											"platinum",
											"white gold",
											"rose gold",
										].map((material) => (
											<label
												key={material}
												className="flex items-center gap-3 cursor-pointer group p-2.5 rounded-lg hover:bg-white transition-all"
											>
												<input
													type="checkbox"
													checked={activeFilters.materials.includes(material)}
													onChange={() => handleMaterialToggle(material)}
													className="w-5 h-5 text-yellow-600 rounded border-2 border-gray-300 focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 cursor-pointer transition-all"
												/>
												<span className="text-sm text-gray-700 capitalize font-medium group-hover:text-yellow-600 transition-colors">
													{material}
												</span>
											</label>
										))}
									</div>
								</div>

								{/* Stones */}
								<div className="space-y-3">
									<div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
										<div className="w-1 h-4 bg-gradient-to-b from-pink-500 to-rose-500 rounded-full"></div>
										Stones
									</div>
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
													checked={activeFilters.stones.includes(stone)}
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
									<div className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
										<div className="w-1 h-4 bg-gradient-to-b from-purple-500 to-indigo-500 rounded-full"></div>
										Search Pool
									</div>
									<div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
										<div className="flex items-center justify-between mb-3">
											<span className="text-2xl font-bold text-purple-600">
												{activeFilters.semanticTopK}
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
											value={activeFilters.semanticTopK}
											onChange={(e) =>
												onFiltersChange?.({
													...activeFilters,
													semanticTopK: parseInt(e.target.value),
												})
											}
											className="w-full h-2 bg-gradient-to-r from-purple-200 to-indigo-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
											style={{
												background: `linear-gradient(to right, rgb(147 51 234) 0%, rgb(147 51 234) ${((activeFilters.semanticTopK - 50) / 450) * 100}%, rgb(229 231 235) ${((activeFilters.semanticTopK - 50) / 450) * 100}%, rgb(229 231 235) 100%)`,
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
										className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
									>
										<div className="w-1 h-4 bg-gradient-to-b from-red-500 to-pink-500 rounded-full"></div>
										Max Decoration
									</label>
									<select
										id="maxDecoration"
										value={activeFilters.maxDecorationScore}
										onChange={(e) =>
											onFiltersChange?.({
												...activeFilters,
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
										className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
									>
										<div className="w-1 h-4 bg-gradient-to-b from-green-500 to-emerald-500 rounded-full"></div>
										Min Plain
									</label>
									<select
										id="minPlain"
										value={activeFilters.minPlainScore}
										onChange={(e) =>
											onFiltersChange?.({
												...activeFilters,
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
										className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2"
									>
										<div className="w-1 h-4 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-full"></div>
										Max Results
									</label>
									<select
										id="maxResults"
										value={activeFilters.topK}
										onChange={(e) =>
											onFiltersChange?.({
												...activeFilters,
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
										type="button"
										onClick={handleApply}
										className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-xl hover:from-purple-700 hover:to-indigo-700 transition-all font-semibold shadow-lg shadow-purple-500/30 hover:shadow-xl flex items-center justify-center gap-2"
									>
										<CheckCircle2 className="w-5 h-5" />
										Apply Filters
									</button>
								)}

								{/* Reset Button */}
								{hasActiveFilters && (
									<button
										type="button"
										onClick={() =>
											onFiltersChange?.({
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
			</form>

			{/* Example Queries */}
			<div className="mt-4 text-center">
				<p className="text-sm text-gray-600 mb-2">Try these examples:</p>
				<div className="flex flex-wrap justify-center gap-2">
					{exampleQueries.map((example) => (
						<button
							type="button"
							key={example}
							onClick={() => {
								if (onQueryChange) {
									onQueryChange(example);
								}
								// Use onApply if available to respect active filters
								if (onApply) {
									onApply(example);
								} else {
									onSearch(example);
								}
							}}
							className="px-3 py-1 text-sm bg-white border border-gray-300 rounded-full hover:border-indigo-500 hover:text-indigo-600 transition-colors"
							disabled={loading}
						>
							{example}
						</button>
					))}
				</div>
			</div>

			{/* Image Upload Modal */}
			{showImageModal && (
				<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
					<div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
						<div className="flex items-center justify-between mb-4">
							<h3 className="text-xl font-bold text-gray-800 flex items-center gap-2">
								<Paperclip className="w-6 h-6 text-indigo-600" />
								Search by Image
							</h3>
							<button
								type="button"
								onClick={handleCloseModal}
								className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
								disabled={loading}
							>
								<X className="w-5 h-5" />
							</button>
						</div>

						{!preview ? (
							<div className="space-y-4">
								<div
									onDrop={handleDrop}
									onDragOver={handleDragOver}
									onDragLeave={handleDragLeave}
									onClick={() => fileInputRef.current?.click()}
									onKeyDown={(e) =>
										e.key === "Enter" && fileInputRef.current?.click()
									}
									role="button"
									tabIndex={0}
									className={`w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
										isDragging
											? "border-indigo-600 bg-indigo-100 scale-105"
											: "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50"
									}`}
								>
									<ImageIcon className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
									<p className="text-gray-700 font-medium mb-1">
										Drop an image or click to select
									</p>
									<p className="text-sm text-gray-500">
										Find similar jewelry items
									</p>
									<p className="text-xs text-indigo-600 mt-2 font-medium">
										💡 You can also paste with Ctrl+V (Cmd+V on Mac)
									</p>
								</div>
								<input
									ref={fileInputRef}
									type="file"
									accept="image/*"
									onChange={handleFileSelect}
									className="hidden"
								/>
							</div>
						) : (
							<div className="space-y-4">
								{/* biome-ignore lint/performance/noImgElement: using img for preview */}
								<img
									src={preview}
									alt="Preview"
									className="w-full h-48 object-contain bg-gray-50 rounded-lg"
								/>
								<div>
									<label
										htmlFor="image-query"
										className="block text-sm font-medium text-gray-700 mb-2"
									>
										Optional: Add text to refine
									</label>
									<input
										id="image-query"
										type="text"
										value={imageQuery}
										onChange={(e) => setImageQuery(e.target.value)}
										placeholder="e.g., 'with diamonds'"
										className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
										disabled={loading}
									/>
								</div>

								{loading && (
									<div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
										<div className="flex items-center gap-3">
											<Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
											<div className="flex-1">
												<p className="text-sm font-medium text-indigo-900">
													Uploading and searching...
												</p>
												<p className="text-xs text-indigo-600 mt-1">
													Processing your image with AI
												</p>
											</div>
										</div>
									</div>
								)}

								<div className="flex gap-2">
									<button
										type="button"
										onClick={handleCloseModal}
										className="flex-1 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
										disabled={loading}
									>
										Cancel
									</button>
									<button
										type="button"
										onClick={handleImageSearch}
										disabled={loading || !selectedFile}
										className="flex-1 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
									>
										{loading ? (
											<>
												<Loader2 className="w-4 h-4 animate-spin" />
												Searching...
											</>
										) : (
											"Search"
										)}
									</button>
								</div>
							</div>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
