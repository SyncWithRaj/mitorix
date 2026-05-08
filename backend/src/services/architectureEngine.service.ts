import path from "path";
import { CodeRelationship } from "../models/relationship.model.js";
import { ArchitectureViolation } from "../models/architectureViolation.model.js";

interface LayerDefinition {
  name: string;
  level: number;
  patterns: string[];
}

const LAYERS: LayerDefinition[] = [
  {
    name: "ui",
    level: 5,
    patterns: [
      "/ui/",
      "/components/",
      "/pages/",
      "/views/",
      "app.tsx",
      "app.jsx",
      "/frontend/src/",
    ],
  },
  { name: "controllers", level: 4, patterns: ["/controllers/", "/routes/", "/handlers/", "/api/"] },
  { name: "services", level: 3, patterns: ["/services/", "/modules/", "/logic/"] },
  { name: "models", level: 2, patterns: ["/models/", "/data/", "/db/", "/schemas/"] },
  { name: "utils", level: 1, patterns: ["/utils/", "/helpers/", "/config/"] },
];

function getFileLayer(filePath: string): LayerDefinition | null {
  if (!filePath) return null;
  const normalized = filePath.replace(/\\/g, "/").toLowerCase();

  for (const layer of LAYERS) {
    for (const pattern of layer.patterns) {
      if (
        normalized.includes(pattern.toLowerCase()) ||
        normalized.endsWith(pattern.toLowerCase())
      ) {
        return layer;
      }
    }
  }
  return null;
}

export async function runArchitectureCheck(repoId: string): Promise<number> {
  try {
    console.log(`[ArchitectureEngine] Running boundary checks for repository ${repoId}`);

    // 1. Clean up old violations for this repository
    await ArchitectureViolation.deleteMany({ repoId });

    // 2. Fetch all code relations for this repository
    const relationships = await CodeRelationship.find({ repoId }).lean();
    if (relationships.length === 0) {
      console.log(`[ArchitectureEngine] No relations found for repo ${repoId}. Skipping check.`);
      return 0;
    }

    const violationsToSave: any[] = [];
    const seenViolations = new Set<string>();

    for (const rel of relationships) {
      const fromPath = rel.fromFilePath;
      const toPath = rel.toFilePath;

      if (!fromPath || !toPath) continue;

      const fromLayer = getFileLayer(fromPath);
      const toLayer = getFileLayer(toPath);

      // We only flag clean architecture violations if both files map to recognized layers
      if (fromLayer && toLayer) {
        if (fromLayer.level < toLayer.level) {
          const fromFile = path.basename(fromPath);
          const toFile = path.basename(toPath);
          const violationKey = `${fromPath}->${toPath}`;

          // Prevent duplicate reporting of the same boundary leak
          if (seenViolations.has(violationKey)) continue;
          seenViolations.add(violationKey);

          const severity = toLayer.level - fromLayer.level >= 2 ? "high" : "medium";
          const desc = `Clean Architecture Violation: Lower layer file '${fromFile}' (${fromLayer.name.toUpperCase()} - Level ${fromLayer.level}) is importing from or calling higher layer file '${toFile}' (${toLayer.name.toUpperCase()} - Level ${toLayer.level}). Lower layers should never depend on higher layers.`;

          violationsToSave.push({
            repoId,
            severity,
            file: fromFile,
            path: fromPath,
            importedFile: toFile,
            importedPath: toPath,
            violatingLayer: fromLayer.name,
            importedLayer: toLayer.name,
            desc,
            line: rel.line,
          });
        }
      }
    }

    if (violationsToSave.length > 0) {
      await ArchitectureViolation.insertMany(violationsToSave);
      console.log(
        `[ArchitectureEngine] Detected and saved ${violationsToSave.length} layer boundary violations.`
      );
    } else {
      console.log(`[ArchitectureEngine] Codebase is architecturally compliant. Zero violations.`);
    }

    return violationsToSave.length;
  } catch (error) {
    console.error(`[ArchitectureEngine] Check failed for repository ${repoId}:`, error);
    return 0;
  }
}
