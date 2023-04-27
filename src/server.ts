import express, { Express } from "express";
import products from "./api/products";

const app: Express = express();

app.use(express.json());
app.post("/api/products/path", products.getProductsPath);

export default app;
