import { CodeEntity } from "../models/codeEntity.model.js";

export async function getUnembeddedEntities(repoId: string) {
  return CodeEntity.find({
    repoId,
    embedded: { $ne: true },
  }).limit(50);
}
