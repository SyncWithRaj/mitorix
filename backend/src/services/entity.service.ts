import { RepoParsedData } from "../models/repoParsedData.model.js";
import { expandEntities } from "../utils/repoParsedData.helpers.js";

export async function getUnembeddedEntities(repoId: string) {
  const parsedData = await RepoParsedData.findOne({ repoId }).lean();
  if (!parsedData) return [];
  
  const entities = expandEntities(parsedData as any);
  return entities.filter(e => !e.embeddingId).slice(0, 50);
}
