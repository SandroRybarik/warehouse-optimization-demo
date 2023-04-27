import { ProductPosition } from "./external_api";

export interface Edge {
	source: string;
	target: string;
	metadata: string;
	distance: number;
}

export interface Graph {
	[vertex: string]: Edge[];
}

/**
 * Agreed upon output inteface for finding product pick order
 */
export interface ProductPickOrder {
	pickingOrder: {
		positionId: string;
		productId: string | undefined;
	}[];
	distance: number;
}

/**
 * Creates graph from given positions
 * this graph is used for djikstra algorithm
 * @param nodes
 * @param edges
 * @returns
 */
export function makeGraph(nodes: string[], edges: Edge[]) {
	const graph: Graph = {};

	for (const node of nodes) graph[node] = [];

	for (const edge of edges) graph[edge.source].push(edge);

	return graph;
}

/**
 * Find all neighbours of given node
 * @param graph
 * @param vertex
 * @returns
 */
export function neighbours(graph: Graph, node: string) {
	return graph[node];
}

const eqSet = <T>(xs: Set<T>, ys: Set<T>) =>
	xs.size === ys.size && [...xs].every((x) => ys.has(x));

/**
 * Runs djiikstra algorithm on given graph
 * @param graph
 * @param startNodePositionId
 * @param shouldVisitProductIds
 * @returns
 */
export function makeDjikstra(
	graph: Graph,
	startNodePositionId: string,
	shouldVisitProductIds: string[],
) {
	const dist: { [key: string]: number } = {};
	const prev: { [key: string]: string | null } = {};
	const visited: { [key: string]: boolean } = {};
	const visitedProducts: Set<string> = new Set();
	const toVisitProducts: Set<string> = new Set(shouldVisitProductIds);
	let lastNode: string | null = null;
	const Q: string[] = [];

	// Initialize the distances
	for (const vertex of Object.keys(graph)) {
		dist[vertex] = Infinity;
		prev[vertex] = null;
		visited[vertex] = false;
		Q.push(vertex);
	}

	dist[startNodePositionId] = 0;
	visitedProducts.add(graph[startNodePositionId][0].metadata);

	while (Q.length > 0) {
		// Find the smallest distance node
		let minDist = dist[Q[0]];
		let minId = Q[0];
		for (let i = 0; i < Q.length; i++) {
			const u = Q[i];
			if (dist[u] < minDist) {
				minDist = dist[u];
				minId = u;
			}
		}

		visited[minId] = true;

		// Remove the vertex from the queue
		Q.splice(Q.indexOf(minId), 1);

		// Update the distances of the neighbors
		const neighbEdges = neighbours(graph, minId);
		for (const { distance, target } of neighbEdges) {
			const alt = dist[minId] + distance;
			if (!visited[target] && alt < dist[target]) {
				dist[target] = alt;
				prev[target] = minId;
			}
		}

		visitedProducts.add(graph[minId][0].metadata);

		// check for condition
		if (eqSet(visitedProducts, toVisitProducts)) {
			lastNode = minId;
			break;
		}
	}

	return { dist, prev, lastNode };
}

/**
 * Helper function for graph building
 * @param positions
 * @returns
 */
export function getNodePositionIds(positions: ProductPosition[]) {
	return positions.map((p) => p.positionId);
}

/**
 * Calculates Euclidean distance between two points
 * @param x1 x coordinate of first point
 * @param y1 y coordinate of first point
 * @param z1 z coordinate of first point
 * @param x2 x coordinate of second point
 * @param y2 y coordinate of second point
 * @param z2 z coordinate of second point
 * @returns
 */
export function calcDistance(
	x1: number,
	y1: number,
	z1: number,
	x2: number,
	y2: number,
	z2: number,
) {
	return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2 + (z1 - z2) ** 2);
}

/**
 * Creates bidirectional edges between all *nodes*.
 * There are'n edges between same product nodes.
 *
 * @note If we want to tracking quantities of products we may
 * add edges between same product nodes
 * @param positions
 * @returns
 */
export function makeEdges(positions: ProductPosition[]) {
	const edges: Edge[] = [];
	for (let i = 0; i < positions.length; i++) {
		for (let j = i + 1; j < positions.length; j++) {
			const a = positions[i];
			const b = positions[j];

			// skip same product
			if (a.productId === b.productId) continue;

			const distance = calcDistance(a.x, a.y, a.z, b.x, b.y, b.z);

			edges.push({
				source: a.positionId,
				target: b.positionId,
				distance,
				metadata: a.productId,
			});
			// biderectional
			edges.push({
				source: b.positionId,
				target: a.positionId,
				distance,
				metadata: b.productId,
			});
		}
	}
	return edges;
}

/**
 * Helper function to extract distance from djikstra result
 * @param dist
 * @param node
 * @returns
 */
export function getDistance(dist: { [key: string]: number }, node: string) {
	return dist[node];
}

/**
 * Helper function to reconstruct path from djikstra result
 * @param prev
 * @param start
 * @param end
 * @returns
 */
export function makePath(
	prev: { [k: string]: string | null },
	start: string,
	end: string,
) {
	const S: string[] = [];
	let u: string | null = end; // target

	while (u !== null && prev[u] !== null) {
		S.push(u);

		u = prev[u];
	}

	return [...S, start].reverse();
}

/**
 * Helper to find closest product to pick from given position
 * @param x x starting coordinate of worker
 * @param y y starting coordinate of worker
 * @param z z starting coordinate of worker
 * @param productsToPick
 * @param positions
 * @returns
 */
export function getClosestProductPositionNode(
	x: number,
	y: number,
	z: number,
	productsToPick: string[],
	positions: ProductPosition[],
) {
	let minDistance = Infinity;
	let minNode: ProductPosition | null = null;
	const filtered = positions.filter((p) =>
		productsToPick.includes(p.productId),
	);

	for (const pos of filtered) {
		const distance = calcDistance(x, y, z, pos.x, pos.y, pos.z);

		if (distance < minDistance) {
			minDistance = distance;
			minNode = pos;
		}
	}

	return minNode;
}

/**
 * High level API to get the path of given products
 * Assuming that quantity of products are just one
 * @param workerStartingPosition
 * @param productsToPick
 * @param productPositions
 * @returns
 * @throws Error if starting position is invalid or no path is found
 */
function pathOfPickedProducts(
	workerStartingPosition: number[],
	productsToPick: string[],
	productPositions: ProductPosition[],
): ProductPickOrder {
	if (workerStartingPosition.length !== 3)
		throw new Error("Invalid starting position");

	const [x, y, z] = workerStartingPosition;

	// Find the closest product to worker where he starts
	const startingPosition = getClosestProductPositionNode(
		x,
		y,
		z,
		productsToPick,
		productPositions,
	);

	if (startingPosition === null) throw new Error("Invalid starting position");

	// Don't forget to add this distance to output
	const initialDistanceToFirstProduct = calcDistance(
		x,
		y,
		z,
		startingPosition.x,
		startingPosition.y,
		startingPosition.z,
	);

	if (!startingPosition) throw new Error("No starting position");

	// Build graph fro djikstra algorithm
	const nodes = getNodePositionIds(productPositions);
	const edges = makeEdges(productPositions);
	const g = makeGraph(nodes, edges);
	const djikstra = makeDjikstra(g, startingPosition.positionId, productsToPick);

	if (djikstra.lastNode === null) throw new Error("No path found");

	const positionIdsPath = makePath(
		djikstra.prev,
		startingPosition.positionId,
		djikstra.lastNode,
	);

	const result: ProductPickOrder = {
		// fulfill the output format
		pickingOrder: positionIdsPath.map((p) => {
			return {
				positionId: p,
				productId: productPositions.find((product) => product.positionId === p)
					?.productId,
			};
		}),
		distance:
			initialDistanceToFirstProduct +
			getDistance(djikstra.dist, djikstra.lastNode),
	};

	return result;
}

export default pathOfPickedProducts;
