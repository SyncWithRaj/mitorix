import path from "path";
import type { Request, Response } from "express";
import { Repository } from "../models/repo.model.js";
import { FileContent } from "../models/fileContent.model.js";

/**
 * Build a nested tree structure from flat FileContent documents.
 */
function buildFileTree(docs: any[]): any[] {
  // Build a map: relativePath -> node
  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

  // First pass: create all nodes
  for (const doc of docs) {
    const node: any = {
      name: doc.fileName,
      path: doc.relativePath,
      type: doc.isDirectory ? "folder" : "file",
    };

    if (doc.isDirectory) {
      node.children = [];
    }

    nodeMap.set(doc.relativePath, node);
  }

  // Second pass: build parent-child relationships
  for (const doc of docs) {
    const node = nodeMap.get(doc.relativePath);
    const parentPath = path.dirname(doc.relativePath);

    if (parentPath === "." || parentPath === "") {
      // Top-level item
      roots.push(node);
    } else {
      const parentNode = nodeMap.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        // Parent not found (shouldn't happen), add as root
        roots.push(node);
      }
    }
  }

  return roots;
}

export const getFileTree = async (req: Request, res: Response) => {
  try {
    const repoId = req.params.repoId as string;

    const repo = await Repository.findById(repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    // Read file tree from MongoDB instead of disk
    const fileDocs = await FileContent.find({ repoId: repo._id })
      .select("relativePath fileName isDirectory")
      .lean();

    const tree = buildFileTree(fileDocs);

    res.json({ files: tree });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File tree error" });
  }
};

export const getFileContent = async (req: Request, res: Response) => {
  try {
    const repoId = req.query.repoId as string;
    const filePath = req.query.path as string;

    const repo = await Repository.findById(repoId);

    if (!repo) {
      return res.status(404).json({ message: "Repository not found" });
    }

    let safePath = filePath.replace(/^\/+/, "");
    if (repo.localPath && filePath.startsWith(repo.localPath)) {
      safePath = filePath.substring(repo.localPath.length).replace(/^\/+/, "");
    }

    // Fallback: If safePath is still absolute (e.g. from a different machine), try taking the last parts
    // But usually repo.localPath should match since it's local.

    // Read file content from MongoDB instead of disk
    const fileDoc = await FileContent.findOne({
      repoId: repo._id,
      relativePath: safePath,
      isDirectory: false,
    }).lean();

    if (!fileDoc) {
      return res.status(404).json({ message: "File not found" });
    }

    if (fileDoc.content === null) {
      return res.status(200).json({
        content: "// [Binary file or content not stored]"
      });
    }

    res.json({ content: fileDoc.content });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "File content error" });
  }
};