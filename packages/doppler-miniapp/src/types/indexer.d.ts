import type { Token, Pool, Position } from "../services/indexer";

declare global {
  type IndexerToken = Token;
  type IndexerPool = Pool;
  type IndexerPosition = Position;
}
