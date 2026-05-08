import Parser from "tree-sitter";
import Java from "tree-sitter-java";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class JavaParser extends BaseParser {
  languageName = "java";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Java);
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
      } else if (node.type === "field_declaration") {
        // Class fields
        const declarator = node.descendantsOfType("variable_declarator")[0];
        if (declarator) {
          const name = declarator.childForFieldName("name")?.text || "anonymous";
          entities.push(
            this.createEntity(repoId, filePath, node, "property", name, depth, parentName)
          );
        }
      } else if (node.type === "import_declaration") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      }

      // ── Relationships ──
      if (node.type === "method_invocation") {
        const name = node.childForFieldName("name")?.text;
        const obj = node.childForFieldName("object")?.text;
        if (name && parentName) {
          const target = obj ? `${obj}.${name}` : name;
          relationships.push(
            this.createRelationship(
              repoId,
              parentName,
              filePath,
              target,
              "calls",
              node.startPosition.row + 1
            )
          );
        }
      }

      if (node.type === "import_declaration") {
        // Extract the imported path
        const importText = node.text
          .replace("import ", "")
          .replace("static ", "")
          .replace(";", "")
          .trim();
        relationships.push(
          this.createRelationship(
            repoId,
            filePath.split("/").pop() || filePath,
            filePath,
            importText,
            "imports",
            node.startPosition.row + 1
          )
        );
      }

      if (node.type === "field_access") {
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
    return ["method_declaration", "class_declaration", "interface_declaration"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (["method_declaration", "class_declaration", "interface_declaration"].includes(node.type)) {
      return node.childForFieldName("name")?.text || null;
    }
    return null;
  }
}
