export interface ProductPosition {
	positionId: string;
	x: number;
	y: number;
	z: number;
	productId: string;
	quantity: number;
}

const API_BASE = process.env["EXPRESS_APP_API_BASE"];
const API_KEY = process.env["EXPRESS_APP_API_KEY"];

/**
 * Fetches all products from the API
 * @param products product id array
 * @returns
 * @throws Error if response is not ok
 */
export async function getProductsPositions(products: string[]) {
	const positionsPromises = products.map(
		(productId) =>
			fetch(`${API_BASE}/${productId}/positions`, {
				headers: {
					"x-api-key": API_KEY,
				},
			}).then((response) => {
				if (!response.ok) throw new Error(response.statusText);
				return response.json();
			}) as Promise<ProductPosition[]>,
	);

	const promResult = await Promise.all(positionsPromises);
	return promResult.flat();
}
