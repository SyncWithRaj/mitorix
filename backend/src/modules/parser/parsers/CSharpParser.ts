import Parser from "tree-sitter";
import CSharp from "tree-sitter-c-sharp";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class CSharpParser extends BaseParser {
  languageName = "csharp";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(CSharp);
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

      if (node.type === "method_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "method", name, depth, parentName));
      } else if (node.type === "constructor_declaration") {
        const name = node.childForFieldName("name")?.text || "constructor";
        entities.push(
          this.createEntity(repoId, filePath, node, "constructor", name, depth, parentName)
        );
      } else if (node.type === "class_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
      } else if (node.type === "interface_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "interface", name, depth, parentName)
        );
      } else if (node.type === "enum_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "enum", name, depth, parentName));
      } else if (node.type === "property_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "property", name, depth, parentName)
        );
      } else if (node.type === "using_directive") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      }

      // ── Relationships ──
      if (node.type === "invocation_expression") {
        const func = node.childForFieldName("function") || node.child(0);
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

      if (node.type === "using_directive") {
        const nameNode = node.childForFieldName("name") || node.child(1);
        if (nameNode) {
          relationships.push(
            this.createRelationship(
              repoId,
              filePath.split("/").pop() || filePath,
              filePath,
              nameNode.text,
              "imports",
              node.startPosition.row + 1
            )
          );
        }
      }

      if (node.type === "member_access_expression") {
        const name = node.childForFieldName("name")?.text;
        if (name && parentName) {
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              name,
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
    return ["method_declaration", "class_declaration", "interface_declaration"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (["method_declaration", "class_declaration", "interface_declaration"].includes(node.type)) {
      return node.childForFieldName("name")?.text || null;
    }
    return null;
  }
}
