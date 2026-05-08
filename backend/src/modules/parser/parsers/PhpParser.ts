import Parser from "tree-sitter";
import Php from "tree-sitter-php";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class PhpParser extends BaseParser {
  languageName = "php";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Php.php);
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
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "function", name, depth, parentName)
        );
      } else if (node.type === "method_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "method", name, depth, parentName));
      } else if (node.type === "class_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
      } else if (node.type === "interface_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "interface", name, depth, parentName)
        );
      } else if (node.type === "namespace_use_declaration") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      }

      if (node.type === "function_call_expression" || node.type === "member_call_expression") {
        const func = node.childForFieldName("name")?.text || node.child(0)?.text;
        if (func && parentName) {
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              func,
              "calls",
              node.startPosition.row + 1
            )
          );
        }
      }

      if (node.type === "namespace_use_declaration") {
        relationships.push(
          this.createRelationship(
            repoId,
            filePath.split("/").pop() || filePath,
            filePath,
            node.text
              .replace(/use\s+/i, "")
              .replace(";", "")
              .trim(),
            "imports",
            node.startPosition.row + 1
          )
        );
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
    return ["function_definition", "method_declaration", "class_declaration"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (["function_definition", "method_declaration", "class_declaration"].includes(node.type)) {
      return node.childForFieldName("name")?.text || null;
    }
    return null;
  }
}
