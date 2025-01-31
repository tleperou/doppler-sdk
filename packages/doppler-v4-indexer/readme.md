## Doppler V4 Indexer

### Sample `.env.local` file

```bash
RPC_UNICHAIN_SEPOLIA=https://unichain-sepolia.g.alchemy.com/v2/[ALCHEMY_API_KEY]
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/default
```

### Running the project

Start the docker compose file in another terminal

`docker-compose -f tools/docker-compose.yml up`

Then start the project

`bun run dev`
