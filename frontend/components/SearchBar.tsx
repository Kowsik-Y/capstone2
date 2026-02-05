"use client";

import { ImageIcon, Loader2, Search, X } from "lucide-react";
import { type FormEvent, useRef, useState } from "react";

interface SearchBarProps {
	onSearch: (query: string) => void;
	onImageUpload?: (file: File, query?: string) => void;
	loading: boolean;
	initialQuery?: string;
	onFilterToggle?: () => void;
	isFilterOpen?: boolean;
}

export default function SearchBar({
	onSearch,
	onImageUpload,
	loading,
	initialQuery = "",
	onFilterToggle,
	isFilterOpen,
}: SearchBarProps) {
	const [query, setQuery] = useState(initialQuery);
	const [showImageModal, setShowImageModal] = useState(false);
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [imageQuery, setImageQuery] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

	const handleSubmit = (e: FormEvent) => {
		e.preventDefault();
		if (query.trim()) {
			onSearch(query.trim());
		}
	};

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file?.type?.startsWith("image/")) {
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
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
		"ring with no diamonds",
		"simple gold necklace",
		"plain wedding band",
		"necklace without pendant",
	];

	return (
		<div className="w-full max-w-4xl mx-auto">
			<form onSubmit={handleSubmit} className="relative">
				<div className="relative">
					<input
						type="text"
						value={query}
						onChange={(e) => setQuery(e.target.value)}
						placeholder="Search for jewelry... "
						className="w-full px-6 py-4 pr-28 text-lg border-2 border-gray-300 rounded-2xl focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all shadow-lg"
						disabled={loading}
					/>
					<div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
						{onImageUpload && (
							<button
								type="button"
								onClick={() => setShowImageModal(true)}
								disabled={loading}
								className="p-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
								title="Search by image"
							>
								<ImageIcon className="w-5 h-5" />
							</button>
						)}
						<button
							type="submit"
							disabled={loading || !query.trim()}
							className="p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
						>
							{loading ? (
								<Loader2 className="w-5 h-5 animate-spin" />
							) : (
								<Search className="w-5 h-5" />
							)}
						</button>
					</div>
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
								setQuery(example);
								onSearch(example);
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
								<ImageIcon className="w-6 h-6 text-indigo-600" />
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
									onClick={() => fileInputRef.current?.click()}
									className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
								>
									<ImageIcon className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
									<p className="text-gray-700 font-medium mb-1">
										Click to select an image
									</p>
									<p className="text-sm text-gray-500">
										Find similar jewelry items
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
								{/** biome-ignore lint/performance/noImgElement: <explanation> */}
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
										disabled={loading}
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
