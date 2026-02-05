import axios from "axios";
import type {
	CategoryInfo,
	HealthResponse,
	SearchRequest,
	SearchResponse,
} from "@/types";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const apiClient = axios.create({
	baseURL: API_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

export async function searchJewelry(
	request: SearchRequest,
): Promise<SearchResponse> {
	const response = await apiClient.post<SearchResponse>("/api/search", {
		query: request.query,
		categories: request.categories || undefined,
		top_k: request.top_k,
		max_decoration_score: request.max_decoration_score,
		min_plain_score: request.min_plain_score,
		semantic_top_k: request.semantic_top_k,
	});
	return response.data;
}

export async function getRecommendations(
	imageId: number,
	topK: number = 5,
): Promise<SearchResponse> {
	const response = await apiClient.post<SearchResponse>("/api/recommend", {
		image_id: imageId,
		top_k: topK,
	});
	return response.data;
}

export async function uploadImage(file: File): Promise<SearchResponse> {
	const formData = new FormData();
	formData.append("file", file);

	const response = await apiClient.post<SearchResponse>(
		"/api/upload",
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		},
	);
	return response.data;
}

export async function uploadImageWithText(
	file: File,
	query?: string,
	topK?: number,
	categories?: string[],
): Promise<SearchResponse> {
	const formData = new FormData();
	formData.append("file", file);
	if (query) {
		formData.append("query", query);
	}
	if (topK) {
		formData.append("top_k", topK.toString());
	}
	if (categories && categories.length > 0) {
		formData.append("categories", categories.join(","));
	}

	const response = await apiClient.post<SearchResponse>(
		"/api/upload-with-text",
		formData,
		{
			headers: {
				"Content-Type": "multipart/form-data",
			},
		},
	);
	return response.data;
}

export async function checkHealth(): Promise<HealthResponse> {
	const response = await apiClient.get<HealthResponse>("/health");
	return response.data;
}

export async function getCategories(): Promise<CategoryInfo> {
	const response = await apiClient.get<CategoryInfo>("/api/categories");
	return response.data;
}

export async function getFeaturedItems(
	limit: number = 12,
): Promise<SearchResponse> {
	const response = await apiClient.get<SearchResponse>(
		`/api/featured?limit=${limit}`,
	);
	return response.data;
}

export async function getProduct(productId: number): Promise<SearchResult> {
	const response = await apiClient.get<SearchResult>(
		`/api/product/${productId}`,
	);
	return response.data;
}

export function getImageUrl(imagePath: string): string {
	// Convert backend image path to accessible URL
	// This assumes backend serves static files or you need to implement image serving
	const filename = imagePath.split("/").pop();
	return `${API_BASE_URL}/static/images/${filename}`;
}
