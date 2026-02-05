export interface SearchResult {
	id: number;
	image_path: string;
	category: string;
	description?: string;
	similarity_score: number;
	plain_score: number | null;
	decoration_score: number | null;
}

export interface SearchResponse {
	query: string;
	enhanced_query: string;
	categories: string[];
	negations: string[];
	results: SearchResult[];
	total_results: number;
	filter_stats: {
		semantic_matches: number;
		category_filtered?: number;
		negation_filtered?: number;
		final_results?: number;
	};
}

export interface SearchFilters {
	categories: string[];
	materials: string[];
	stones: string[];
	topK: number;
	maxDecorationScore: number;
	minPlainScore: number;
	semanticTopK: number;
}

export interface SearchRequest {
	query: string;
	categories?: string[];
	top_k?: number;
	max_decoration_score?: number;
	min_plain_score?: number;
	semantic_top_k?: number;
}

export interface HealthResponse {
	status: string;
	model_loaded: boolean;
	total_images: number;
}

export interface CategoryInfo {
	categories: string[];
	total_images: number;
	images_per_category: Record<string, number>;
}
