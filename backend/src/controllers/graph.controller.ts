import type { Request, Response } from "express";
import { FileMetadata } from "../models/fileMetadata.model.js";
import { CodeRelationship } from "../models/relationship.model.js";
import { CodeEntity } from "../models/codeEntity.model.js";
import { Repository } from "../models/repo.model.js";
import path from "path";

export const getRepositoryGraph = async (req: Request, res: Response): Promise<any> => {
  try {
    const repoId = req.params.id;

    if (!repoId) {
      return res.status(400).json({ success: false, message: "Repository ID is required" });
    }

    const repo = await Repository.findById(repoId);
    if (!repo) {
      return res.status(404).json({ success: false, message: "Repository not found" });
    }

    // Fetch all files metadata for this repo
    const files = await FileMetadata.find({ repoId }).lean();

    // Fetch all relationships for this repo
    const relationships = await CodeRelationship.find({ repoId }).lean();

    // Fetch all code entities for this repo
    const entities = await CodeEntity.find({ repoId }).lean();

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
          content: entity.content,
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

    // 3. Add structural Code Dependencies (imports, calls, etc.)
    for (const rel of relationships) {
      if (rel.fromFilePath && rel.toFilePath) {
        const sourceEntityId = `${rel.fromFilePath}::${rel.fromName}`;
        const targetEntityId = `${rel.toFilePath}::${rel.toName}`;

        let sourceNodeId = rel.fromFilePath;
        let targetNodeId = rel.toFilePath;

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
    console.error("Error fetching repository graph:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch repository graph" });
  }
};
