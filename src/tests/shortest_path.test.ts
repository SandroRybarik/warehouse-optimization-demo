import { describe, expect, test } from "@jest/globals";
import {
	makeEdges,
	makeGraph,
	makeDjikstra,
	makePath,
	getDistance,
	getNodePositionIds,
} from "../lib/djikstra";
import { ProductPosition } from "../lib/external_api";

const pos: ProductPosition[] = [
	{
		positionId: "position-1",
		x: 0,
		y: 0,
		z: 0,
		productId: "A",
		quantity: 1,
	},
	{
		positionId: "position-2",
		x: 3,
		y: 3,
		z: 0,
		productId: "C",
		quantity: 1,
	},
	{
		positionId: "position-3",
		x: 4,
		y: 4,
		z: 0,
		productId: "B",
		quantity: 1,
	},
	{
		positionId: "position-4",
		x: 5,
		y: 5,
		z: 0,
		productId: "C",
		quantity: 1,
	},
	{
		positionId: "position-5",
		x: 4,
		y: 4,
		z: 0,
		productId: "B",
		quantity: 1,
	},
];

describe("sum module", () => {
	test("shortest path", () => {
		const nodes = getNodePositionIds(pos);
		const edges = makeEdges(pos);
		const g = makeGraph(nodes, edges);
		const startNode = "position-1";
		const x = makeDjikstra(g, startNode, ["A", "B", "C"]);

		if (x.lastNode) {
			const result = {
				pickingOrder: makePath(x.prev, startNode, x.lastNode).map((p) => {
					return {
						positionId: p,
						productId: pos.find((product) => product.positionId === p)
							?.productId,
					};
				}),
				distance: getDistance(x.dist, x.lastNode),
			};

			expect(result).toMatchObject({
				pickingOrder: [
					{ positionId: "position-1", productId: "A" },
					{ positionId: "position-2", productId: "C" },
					{ positionId: "position-3", productId: "B" },
				],
			});
			expect(result.distance).toBeCloseTo(Math.sqrt(18) + Math.sqrt(2));
		}
	});
});
