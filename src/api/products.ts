import { Request, Response } from "express";
import pathOfPickedProducts from "../lib/djikstra";
import { getProductsPositions } from "../lib/external_api";

export interface ProductPathBody {
	products: string[];
	workerAt: number[];
}

export async function getProductsPath(req: Request, res: Response) {
	const body = req.body as ProductPathBody;

	if (!body.workerAt || body.workerAt.length !== 3) {
		res.status(400).send("Invalid worker position");
		return;
	}

	if (
		Number.isNaN(body.workerAt[0]) ||
		Number.isNaN(body.workerAt[1]) ||
		Number.isNaN(body.workerAt[2])
	) {
		res.status(400).send("Invalid coordinates");
		return;
	}

	if (!body.products || body.products.length === 0) {
		res.status(400).send("Invalid products");
		return;
	}

	const products = body.products;

	// worker position
	const x = Number(body.workerAt[0]);
	const y = Number(body.workerAt[1]);
	const z = Number(body.workerAt[2]);

	try {
		const productPositions = await getProductsPositions(products);
		const result = pathOfPickedProducts([x, y, z], products, productPositions);

		res.json(result);
	} catch (e) {
		res.status(400).send("Unable to find a path in warehouse");
	}
}

export default {
	getProductsPath,
};
