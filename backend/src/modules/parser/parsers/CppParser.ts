import Parser from "tree-sitter";
import Cpp from "tree-sitter-cpp";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class CppParser extends BaseParser {
  languageName = "cpp";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Cpp);
  }

  async parse(
    repoId: string,
    filePath: string,
    content: string,
    pathResolver?: PathResolver | null
  ): Promise<{
    entities: ParsedEntity[];
    relationships: ParsedRelationship[];
    fileMetadata: ParsedFileMetadata;
  }> {
    this.clearImports();
    const fileMetadata = this.extractFileMetadata(repoId, filePath, content);
    const tree = this.parser.parse(content);

    const entities: ParsedEntity[] = [];
    const relationships: ParsedRelationship[] = [];
    const seen = new Set<string>();

    const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null) => {
      const key = `${filePath}:${node.startPosition.row}:${node.type}`;
      if (seen.has(key)) return;
      seen.add(key);

      if (node.type === "function_definition") {
        const decl = node.childForFieldName("declarator");
        const name =
          decl?.childForFieldName("declarator")?.text || decl?.text?.split("(")[0] || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "function", name, depth, parentName)
        );
      } else if (node.type === "class_specifier") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
      } else if (node.type === "struct_specifier") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
      } else if (node.type === "enum_specifier") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "enum", name, depth, parentName));
      } else if (node.type === "namespace_definition") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "variable", name, depth, parentName)
        );
      } else if (node.type === "preproc_include") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      }

      // ── Relationships ──
      if (node.type === "call_expression") {
        const func = node.childForFieldName("function");
        if (func && parentName) {
          let targetFile: string | null = null;
          if (func.type === "field_expression") {
            const argument = func.childForFieldName("argument")?.text;
            if (argument) targetFile = this.resolveCallTarget(argument);
          } else if (func.type === "scoped_identifier") {
            const namespace = func.childForFieldName("namespace")?.text;
            if (namespace) targetFile = this.resolveCallTarget(namespace);
          } else if (func.type === "identifier") {
            targetFile = this.resolveCallTarget(func.text);
          }
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              func.text,
              "calls",
              node.startPosition.row + 1,
              targetFile
            )
          );
        }
      }

      if (node.type === "preproc_include") {
        const path = node.childForFieldName("path")?.text || "";
        const cleanPath = path.replace(/[<>"]/g, "");
        this.registerImportAlias(cleanPath, cleanPath);
        relationships.push(
          this.createRelationship(
            repoId,
            filePath.split("/").pop() || filePath,
            filePath,
            cleanPath,
            "imports",
            node.startPosition.row + 1,
            cleanPath
          )
        );
      }

      if (node.type === "field_expression") {
        const argument = node.childForFieldName("argument")?.text;
        const field = node.childForFieldName("field")?.text;
        if (field && parentName) {
          let targetFile: string | null = null;
          if (argument) targetFile = this.resolveCallTarget(argument);
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              field,
              "accesses",
              node.startPosition.row + 1,
              targetFile
            )
          );
        }
      }

      for (let i = 0; i < node.childCount; i++) {
        walk(
          node.child(i)!,
          depth + (this.isScopeNode(node) ? 1 : 0),
          this.getScopeName(node) || parentName
        );
      }
    };

    if (tree.rootNode) walk(tree.rootNode, 0, null);
    return { entities, relationships, fileMetadata };
  }

  private isScopeNode(node: Parser.SyntaxNode) {
    return ["function_definition", "class_specifier", "namespace_definition"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (node.type === "function_definition") {
      const decl = node.childForFieldName("declarator");
      return decl?.childForFieldName("declarator")?.text || decl?.text?.split("(")[0] || null;
    }
    if (node.type === "class_specifier" || node.type === "namespace_definition") {
      return node.childForFieldName("name")?.text || null;
    }
    return null;
  }
}
