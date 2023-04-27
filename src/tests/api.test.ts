import * as dotenv from "dotenv";
dotenv.config();

import { describe, expect, test } from "@jest/globals";
import app from "../server";
import { ProductPickOrder, calcDistance } from "../lib/djikstra";

describe("sum module", () => {
	test("api test", async () => {
		const server = app.listen(3333, () => {});

		const reqPath = "/api/products/path";
		const payload = {
			products: ["product-1", "product-2"],
			workerAt: [0, 0, 0],
		};

		const r = (await fetch(`http://localhost:3333${reqPath}`, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(payload),
		}).then(async (r) => {
			expect(r.status).toBe(200);
			return r.json();
		})) as ProductPickOrder;

		const expected =
			calcDistance(0, 0, 0, 3, 1, 0) + calcDistance(3, 1, 0, 3, 12, 0);
		expect(r.distance).toBeCloseTo(expected);

		server.closeAllConnections();
		server.close();
	});
});
