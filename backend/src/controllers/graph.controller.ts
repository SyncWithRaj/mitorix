import type { Request, Response, NextFunction } from "express";
import { RepoParsedData } from "../models/repoParsedData.model.js";
import {
  expandEntities,
  expandRelationships,
  expandFileMetadata,
} from "../utils/repoParsedData.helpers.js";
import { Repository, touchRepository } from "../models/repo.model.js";
import path from "path";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";
import { getOwnedRepositoryOrThrow, requireString } from "../utils/repositoryAccess.util.js";

export const getRepositoryGraph = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<any> => {
  try {
    const repoId = requireString(req.params.id, "Repository ID");

    const repo = await getOwnedRepositoryOrThrow(repoId, req.user);

    await touchRepository(repoId);

    // ── Single query replaces 3 parallel find() calls ──
    const parsedData = await RepoParsedData.findOne({ repoId }).lean();

    const files = parsedData ? expandFileMetadata(parsedData as any) : [];
    const relationships = parsedData ? expandRelationships(parsedData as any) : [];
    const entities = parsedData ? expandEntities(parsedData as any) : [];

    const nodes: any[] = [];
    const edges: any[] = [];
    const folderNodesMap = new Map();

    // Add root node
    const rootId = "root";
    folderNodesMap.set(rootId, {
      id: rootId,
      path: rootId,
      name: repo.name || "Repository",
      type: "folder",
      val: 20,
      metadata: { isFolder: true, descendentCount: 0 },
    });

    // 1. Process files and build folder hierarchy
    for (const file of files) {
      // File Node
      nodes.push({
        id: file.filePath,
        path: path.relative(repo.localPath, file.filePath),
        name: file.fileName,
        type: "file",
        val: Math.max(5, Math.min(20, Math.sqrt(file.fileSize || 100))), // Dynamic scale
        group: file.filePath.split("/")[0] || "root",
        metadata: {
          fileSize: file.fileSize,
          totalLines: file.totalLines,
          hasReactComponent: file.hasReactComponent,
          isBackendFile: file.isBackendFile,
          isTestFile: file.isTestFile,
          hasDefaultExport: file.hasDefaultExport,
        },
      });

      // Path parsing for Folders using RELATIVE path to avoid absolute root chain
      const relativeFilePath = path.relative(repo.localPath, file.filePath).replace(/\\/g, "/");
      const parts = relativeFilePath.split("/");
      let currentPath = "";

      // Loop through directories (excluding the file itself)
      for (let i = 0; i < parts.length - 1; i++) {
        const parentPath = currentPath || rootId;
        const part = parts[i] as string;
        currentPath = currentPath ? `${currentPath}/${part}` : part;

        if (!folderNodesMap.has(currentPath)) {
          folderNodesMap.set(currentPath, {
            id: currentPath, // use relative path as ID for folders
            path: currentPath,
            name: part,
            type: "folder",
            val: 15, // Folder base size
            metadata: { isFolder: true, descendentCount: 1 },
          });

          // Folder -> Folder edge
          edges.push({
            source: parentPath,
            target: currentPath,
            label: "contains",
            line: 0,
          });
        } else {
          folderNodesMap.get(currentPath).metadata.descendentCount++;
        }
      }

      // Folder -> File edge (connect relative folder to absolute file ID)
      const parentOfFile = currentPath || rootId;
      edges.push({
        source: parentOfFile,
        target: file.filePath,
        label: "contains",
        line: 0,
      });
    }

    // Add all distinct folder nodes to the main nodes array
    for (const folderNode of folderNodesMap.values()) {
      nodes.push(folderNode);
    }

    const nodeIds = new Set(nodes.map((n) => n.id));

    // 2. Add Code Entities as nodes
    for (const entity of entities) {
      const entityId = `${entity.filePath}::${entity.name}`;
      nodes.push({
        id: entityId,
        path: entity.filePath,
        name: entity.name,
        type: entity.type,
        val: 5, // smaller base size for code entities
        group: entity.filePath.split("/")[0] || "root",
        metadata: {
          parameters: entity.parameters,
          returnType: entity.returnType,
          startLine: entity.startLine,
          endLine: entity.endLine,
        },
      });
      nodeIds.add(entityId);

      // Link parent file to this entity
      if (nodeIds.has(entity.filePath)) {
        edges.push({
          source: entity.filePath,
          target: entityId,
          label: "contains",
          line: 0,
        });
      }
    }

    // 3. Resolve and Add structural Code Dependencies (imports, calls, etc.)
    const fnToFile: Record<string, string> = Object.create(null);
    for (const entity of entities) {
      if (!fnToFile[entity.name]) fnToFile[entity.name] = entity.filePath;
    }

    const importsMap: Record<string, Record<string, string>> = Object.create(null);
    for (const rel of relationships) {
      if (rel.relationType === "imports" && rel.fromFilePath && rel.toFilePath) {
        if (!importsMap[rel.fromFilePath]) importsMap[rel.fromFilePath] = Object.create(null);
        const fromImports = importsMap[rel.fromFilePath];
        if (rel.toName && fromImports) {
          fromImports[rel.toName] = rel.toFilePath;
        }
      }
    }

    for (const rel of relationships) {
      if (!rel.fromFilePath) continue;

      let defFile = rel.toFilePath;
      const targetName = rel.toName || "";
      const sourceFile = rel.fromFilePath;

      // Dynamic Resolution if toFilePath is missing
      if (!defFile) {
        const srcImports = importsMap[sourceFile];
        if (srcImports && typeof srcImports[targetName] === "string") {
          defFile = srcImports[targetName];
        } else if (typeof fnToFile[targetName] === "string") {
          defFile = fnToFile[targetName];
        }
      }

      if (defFile) {
        // Normalize defFile to absolute path if it is a relative import path
        if (!defFile.startsWith("/")) {
          const match = files.find(
            (f: any) => f.filePath.endsWith("/" + defFile) || f.filePath === defFile
          );
          if (match) {
            defFile = match.filePath;
          }
        }

        const sourceEntityId = `${sourceFile}::${rel.fromName}`;
        const targetEntityId = `${defFile}::${targetName}`;

        let sourceNodeId = sourceFile;
        let targetNodeId = defFile;

        if (nodeIds.has(sourceEntityId)) sourceNodeId = sourceEntityId;
        if (nodeIds.has(targetEntityId)) targetNodeId = targetEntityId;

        if (
          nodeIds.has(sourceNodeId) &&
          nodeIds.has(targetNodeId) &&
          sourceNodeId !== targetNodeId
        ) {
          edges.push({
            source: sourceNodeId as string,
            target: targetNodeId as string,
            label: rel.relationType,
            line: rel.line,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      graph: {
        nodes,
        edges,
      },
    });
  } catch (error) {
    next(error);
  }
};
