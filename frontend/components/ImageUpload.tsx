"use client";

import { Image as ImageIcon, Upload, X } from "lucide-react";
import { useRef, useState } from "react";

interface ImageUploadProps {
	onUpload: (file: File, query?: string) => void;
	loading: boolean;
}

export default function ImageUpload({ onUpload, loading }: ImageUploadProps) {
	const [preview, setPreview] = useState<string | null>(null);
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [textQuery, setTextQuery] = useState("");
	const fileInputRef = useRef<HTMLInputElement>(null);

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

	const handleDrop = (e: React.DragEvent) => {
		e.preventDefault();
		const file = e.dataTransfer.files[0];
		if (file && file.type.startsWith("image/")) {
			setSelectedFile(file);
			const reader = new FileReader();
			reader.onloadend = () => {
				setPreview(reader.result as string);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
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
		<div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl shadow-lg p-6">
			<div className="flex items-center gap-2 mb-4">
				<ImageIcon className="w-5 h-5 text-indigo-600" />
				<h3 className="font-semibold text-gray-800">Image Search</h3>
			</div>

			{/* Upload Area */}
			{!preview ? (
				<div
					onDrop={handleDrop}
					onDragOver={handleDragOver}
					onClick={() => fileInputRef.current?.click()}
					className="border-2 border-dashed border-indigo-300 rounded-lg p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/50 transition-all"
				>
					<Upload className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
					<p className="text-gray-700 font-medium mb-1">
						Drop an image here or click to browse
					</p>
					<p className="text-sm text-gray-500">
						Find similar jewelry items by uploading a photo
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
