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
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              func.text,
              "calls",
              node.startPosition.row + 1
            )
          );
        }
      }

      if (node.type === "preproc_include") {
        const path = node.childForFieldName("path")?.text || "";
        relationships.push(
          this.createRelationship(
            repoId,
            filePath.split("/").pop() || filePath,
            filePath,
            path.replace(/[<>"]/g, ""),
            "imports",
            node.startPosition.row + 1
          )
        );
      }

      if (node.type === "field_expression") {
        const field = node.childForFieldName("field")?.text;
        if (field && parentName) {
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              field,
              "accesses",
              node.startPosition.row + 1
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
