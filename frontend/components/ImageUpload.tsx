"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

interface ImageUploadProps {
	onUpload: (file: File, query?: string) => void;
	loading: boolean;
}

export default function ImageUpload({ onUpload, loading }: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [textQuery, setTextQuery] = useState("");
	const [isDragging, setIsDragging] = useState(false);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file && file.type.startsWith("image/")) {
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const processFile = useCallback((file: File) => {
		if (file && file.type.startsWith("image/")) {
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
		[processFile],
	);

	useEffect(() => {
		// Add paste event listener to window
		window.addEventListener("paste", handlePaste);

		return () => {
			window.removeEventListener("paste", handlePaste);
		};
	}, [handlePaste]);

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

	const handleClear = () => {
		setPreview(null);
		setSelectedFile(null);
		setTextQuery("");
		if (fileInputRef.current) {
			fileInputRef.current.value = "";
		}
	};

	const handleSubmit = () => {
		if (selectedFile) {
			onUpload(selectedFile, textQuery.trim() || undefined);
		}
	};

	return (
		<div
			ref={containerRef}
			className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6"
		>
			<div className="flex items-center gap-2 mb-4">
				<ImageIcon className="w-5 h-5 text-indigo-600" />
				<h3 className="font-semibold text-gray-800">Image Search</h3>
			</div>

			{/* Upload Area */}
			{!preview ? (
				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onDragLeave={handleDragLeave}
					onClick={() => fileInputRef.current?.click()}
					className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
						isDragging
							? "border-indigo-600 bg-indigo-100 scale-105"
							: "border-indigo-300 hover:border-indigo-500 hover:bg-indigo-50/50"
					}`}
				>
					<Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
					<p className="text-gray-700 font-medium mb-1">
						Drop an image here or click to browse
					</p>
					<p className="text-sm text-gray-500">
						Find similar jewelry items by uploading a photo
					</p>
					<p className="text-xs text-indigo-600 mt-2 font-medium">
						💡 You can also paste images with Ctrl+V (Cmd+V on Mac)
					</p>
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
					{/* Preview */}
					<div className="relative">
						<img
							src={preview}
							alt="Upload preview"
							className="w-full h-64 object-contain bg-white rounded-lg"
						/>
						<button
							onClick={handleClear}
							className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
						>
							<X className="w-4 h-4" />
						</button>
					</div>

					{/* Optional Text Query */}
					<div>
						<label className="block text-sm font-medium text-gray-700 mb-2">
							Optional: Add text to refine search
						</label>
						<input
							type="text"
							value={textQuery}
							onChange={(e) => setTextQuery(e.target.value)}
							placeholder="e.g., 'gold ring' or 'with diamonds'"
							className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
						/>
						<p className="text-xs text-gray-500 mt-1">
							Combine image similarity with text search for better results
						</p>
					</div>

					{/* Search Button */}
					<button
						onClick={handleSubmit}
						disabled={loading}
						className="w-full py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
					>
						{loading ? (
							<>
								<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
								Searching...
							</>
						) : (
							<>
								<Upload className="w-5 h-5" />
								Search by Image
							</>
						)}
					</button>
				</div>
			)}
		</div>
	);
}
