import path from "path";
import type { Request, Response, NextFunction } from "express";
import { Repository, touchRepository } from "../models/repo.model.js";
import { FileContent } from "../models/fileContent.model.js";
import logger from "../lib/logger.js";
import { AppError } from "../middlewares/error.middleware.js";

/**
 * Build a nested tree structure from flat FileContent documents.
 */
function buildFileTree(docs: any[]): any[] {
  const nodeMap = new Map<string, any>();
  const roots: any[] = [];

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

  for (const doc of docs) {
    const node = nodeMap.get(doc.relativePath);
    const parentPath = path.dirname(doc.relativePath);

    if (parentPath === "." || parentPath === "") {
      roots.push(node);
    } else {
      const parentNode = nodeMap.get(parentPath);
      if (parentNode && parentNode.children) {
        parentNode.children.push(node);
      } else {
        roots.push(node);
      }
    }
  }

  return roots;
}

export const getFileTree = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoId = req.params.repoId as string;

    const repo = await Repository.findById(repoId);
    if (!repo) throw new AppError("Repository not found", 404);

    await touchRepository(repoId);

    const fileDocs = await FileContent.find({ repoId: repo._id })
      .select("relativePath fileName isDirectory")
      .lean();

    const tree = buildFileTree(fileDocs);

    res.json({
      success: true,
      files: tree,
    });
  } catch (err) {
    next(err);
  }
};

export const getFileContent = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const repoId = req.query.repoId as string;
    const filePath = req.query.path as string;

    const repo = await Repository.findById(repoId);
    if (!repo) throw new AppError("Repository not found", 404);

    await touchRepository(repoId);

    let safePath = filePath.replace(/^\/+/, "");
    if (repo.localPath && filePath.startsWith(repo.localPath)) {
      safePath = filePath.substring(repo.localPath.length).replace(/^\/+/, "");
    }

    const fileDoc = await FileContent.findOne({
      repoId: repo._id,
      relativePath: safePath,
      isDirectory: false,
    }).lean();

    if (!fileDoc) throw new AppError("File not found", 404);

    if (fileDoc.content === null) {
      return res.status(200).json({
        success: true,
        content: "// [Binary file or content not stored]",
      });
    }

    res.json({
      success: true,
      content: fileDoc.content,
    });
  } catch (err) {
    next(err);
  }
};
