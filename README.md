# Warehouse optimization demo

Finding shortest path in warehouse using djikstra algorithm.

## Setup and start


1. `npm i`
2. `cp .env.example .env`
3. set all env variables in `.env` file
4. `npm start`

## To run jest tests

`npm test`

## API endpoint

`[POST] /api/products/path`

```jsonc
// example request body
{
	"products": ["product-1", "product-2"],
	"workerAt": [0, 0, 0],
}
```




## Notes

- This repo is part of interview process and API keys are kept secret - code does not work without them.
- Entry point is located at src/index.ts.
- Server is decoupled to allow independent testing.
