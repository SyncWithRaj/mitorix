import Parser from "tree-sitter";
import Go from "tree-sitter-go";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class GoParser extends BaseParser {
  languageName = "go";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Go);
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

      // ── Entities ──
      if (node.type === "function_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "function", name, depth, parentName)
        );
      } else if (node.type === "method_declaration") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        // Extract receiver type as parentName
        const receiver = node.childForFieldName("receiver");
        let receiverType: string | null = null;
        if (receiver) {
          // Receiver is like (r *Router) — extract the type
          receiverType =
            receiver.text
              .replace(/[*()\s]/g, "")
              .split(/\s+/)
              .pop() || null;
        }
        entities.push(
          this.createEntity(
            repoId,
            filePath,
            node,
            "method",
            name,
            depth,
            receiverType || parentName
          )
        );
      } else if (node.type === "type_declaration") {
        for (let i = 0; i < node.childCount; i++) {
          const child = node.child(i)!;
          if (child.type === "type_spec") {
            const name = child.childForFieldName("name")?.text || "anonymous";
            const typeBody = child.childForFieldName("type");
            if (typeBody?.type === "interface_type") {
              entities.push(
                this.createEntity(repoId, filePath, child, "interface", name, depth, parentName)
              );
            } else if (typeBody?.type === "struct_type") {
              entities.push(
                this.createEntity(repoId, filePath, child, "class", name, depth, parentName)
              );
            } else {
              entities.push(
                this.createEntity(repoId, filePath, child, "typeAlias", name, depth, parentName)
              );
            }
          }
        }
      } else if (node.type === "import_spec") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      } else if (node.type === "var_declaration" || node.type === "const_declaration") {
        // Top-level var/const
        for (let i = 0; i < node.childCount; i++) {
          const spec = node.child(i)!;
          if (spec.type === "var_spec" || spec.type === "const_spec") {
            const name = spec.childForFieldName("name")?.text || spec.child(0)?.text;
            if (name) {
              entities.push(
                this.createEntity(repoId, filePath, spec, "variable", name, depth, parentName)
              );
            }
          }
        }
      }

      // ── Relationships: calls ──
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

      // ── Relationships: imports ──
      if (node.type === "import_spec") {
        const pathNode = node.childForFieldName("path");
        if (pathNode) {
          relationships.push(
            this.createRelationship(
              repoId,
              filePath.split("/").pop() || filePath,
              filePath,
              pathNode.text.replace(/['"]/g, ""),
              "imports",
              node.startPosition.row + 1
            )
          );
        }
      }

      // ── Relationships: selector (field/method access) ──
      if (node.type === "selector_expression") {
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
    return ["function_declaration", "method_declaration"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (node.type === "function_declaration" || node.type === "method_declaration") {
      return node.childForFieldName("name")?.text || null;
    }
    return null;
  }
}
