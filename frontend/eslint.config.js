import tsParser from "@typescript-eslint/parser";

/** @type {import('eslint').Linter.FlatConfig[]} */
export default [
	{
		files: ["**/*.{js,mjs,cjs,ts,jsx,tsx}"],
		languageOptions: {
			parser: tsParser,
			parserOptions: {
				ecmaVersion: "latest",
				sourceType: "module",
				ecmaFeatures: {
					jsx: true,
				},
			},
			globals: {
				// Browser globals
				console: "readonly",
				process: "readonly",
				setTimeout: "readonly",
				clearTimeout: "readonly",
				setInterval: "readonly",
				clearInterval: "readonly",
				alert: "readonly",
				confirm: "readonly",
				prompt: "readonly",
				// DOM globals
				window: "readonly",
				document: "readonly",
				HTMLElement: "readonly",
				HTMLInputElement: "readonly",
				HTMLDivElement: "readonly",
				HTMLImageElement: "readonly",
				File: "readonly",
				FileReader: "readonly",
				FormData: "readonly",
				IntersectionObserver: "readonly",
				// Node globals
				module: "readonly",
				exports: "readonly",
				require: "readonly",
				__dirname: "readonly",
				__filename: "readonly",
				// React globals
				React: "readonly",
				JSX: "readonly",
			},
		},
		rules: {
			"no-unused-vars": [
				"warn",
				{
					argsIgnorePattern: "^_",
					varsIgnorePattern: "^_",
					ignoreRestSiblings: true,
				},
			],
		},
	},
	{
		ignores: [".next/", "node_modules/", "out/", "*.config.js"],
	},
];
