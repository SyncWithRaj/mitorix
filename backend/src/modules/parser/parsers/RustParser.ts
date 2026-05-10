import Parser from "tree-sitter";
import Rust from "tree-sitter-rust";
import {
  BaseParser,
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
} from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class RustParser extends BaseParser {
  languageName = "rust";
  private parser: Parser;

  constructor() {
    super();
    this.parser = new Parser();
    this.parser.setLanguage(Rust);
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

    const walk = (
      node: Parser.SyntaxNode,
      depth: number,
      parentName: string | null,
      insideImpl: string | null
    ) => {
      const key = `${filePath}:${node.startPosition.row}:${node.type}`;
      if (seen.has(key)) return;
      seen.add(key);

      // ── Entities ──

      if (node.type === "function_item" || node.type === "function_signature_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        const params = this.extractParameters(node.childForFieldName("parameters"));
        const retType =
          node.childForFieldName("return_type")?.text?.replace("->", "").trim() || "any";

        if (insideImpl) {
          // Function inside an impl block → method
          entities.push(
            this.createEntity(
              repoId,
              filePath,
              node,
              "method",
              name,
              depth,
              insideImpl,
              params,
              retType
            )
          );
        } else {
          entities.push(
            this.createEntity(
              repoId,
              filePath,
              node,
              "function",
              name,
              depth,
              parentName,
              params,
              retType
            )
          );
        }
      } else if (node.type === "struct_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
      } else if (node.type === "enum_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(this.createEntity(repoId, filePath, node, "enum", name, depth, parentName));
      } else if (node.type === "trait_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "interface", name, depth, parentName)
        );
      } else if (node.type === "impl_item") {
        // impl blocks are treated as class-like entities
        const typeName = node.childForFieldName("type")?.text || "anonymous_impl";
        // Check if it's a trait impl (impl Trait for Type)
        const traitNode = node.childForFieldName("trait");
        const implName = traitNode ? `${traitNode.text} for ${typeName}` : typeName;
        entities.push(
          this.createEntity(repoId, filePath, node, "class", implName, depth, parentName)
        );
      } else if (node.type === "mod_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "variable", name, depth, parentName)
        );
      } else if (node.type === "use_declaration") {
        entities.push(this.createEntity(repoId, filePath, node, "import", "import", 0, null));
      } else if (node.type === "type_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "typeAlias", name, depth, parentName)
        );
      } else if (node.type === "const_item" || node.type === "static_item") {
        const name = node.childForFieldName("name")?.text || "anonymous";
        entities.push(
          this.createEntity(repoId, filePath, node, "variable", name, depth, parentName)
        );
      }

      // ── Relationships: function/method calls ──
      if (node.type === "call_expression") {
        const func = node.childForFieldName("function");
        if (func) {
          const caller = parentName || insideImpl || "anonymous";
          let targetFile: string | null = null;
          let baseObjName: string | null = null;

          if (func.type === "field_expression") {
            const value = func.childForFieldName("value")?.text;
            baseObjName = value || null;
          } else if (func.type === "scoped_identifier") {
            const path = func.childForFieldName("path")?.text;
            baseObjName = path || null;
          } else if (func.type === "identifier") {
            baseObjName = func.text;
          }

          if (baseObjName) {
            targetFile = this.resolveCallTarget(baseObjName);
          }

          relationships.push(
            this.createRelationship(
              repoId,
              caller,
              filePath,
              func.text,
              "calls",
              node.startPosition.row + 1,
              targetFile
            )
          );
        }
      }

      // ── Relationships: macro invocations (println!, vec!, etc.) ──
      if (node.type === "macro_invocation") {
        const macroName = node.childForFieldName("macro")?.text || node.child(0)?.text;
        if (macroName) {
          const caller = parentName || insideImpl || "anonymous";
          relationships.push(
            this.createRelationship(
              repoId,
              caller,
              filePath,
              macroName,
              "calls",
              node.startPosition.row + 1
            )
          );
        }
      }

      // ── Relationships: use declarations ──
      if (node.type === "use_declaration") {
        const usePath = node.text.replace("use ", "").replace(";", "").trim();
        const alias = usePath.split("::").pop() || usePath;
        this.registerImportAlias(alias, usePath);

        relationships.push(
          this.createRelationship(
            repoId,
            filePath.split("/").pop() || filePath,
            filePath,
            usePath,
            "imports",
            node.startPosition.row + 1,
            usePath
          )
        );
      }

      // ── Relationships: field/method access ──
      if (node.type === "field_expression") {
        const value = node.childForFieldName("value")?.text;
        const field = node.childForFieldName("field")?.text;
        if (field && (parentName || insideImpl)) {
          let targetFile: string | null = null;
          if (value) {
            targetFile = this.resolveCallTarget(value);
          }
          relationships.push(
            this.createRelationship(
              repoId,
              parentName || insideImpl!,
              filePath,
              field,
              "accesses",
              node.startPosition.row + 1,
              targetFile
            )
          );
        }
      }

      // ── Recurse ──
      const newInsideImpl =
        node.type === "impl_item" ? node.childForFieldName("type")?.text || insideImpl : insideImpl;

      for (let i = 0; i < node.childCount; i++) {
        walk(
          node.child(i)!,
          depth + (this.isScopeNode(node) ? 1 : 0),
          this.getScopeName(node) || parentName,
          newInsideImpl
        );
      }
    };

    if (tree.rootNode) walk(tree.rootNode, 0, null, null);
    return { entities, relationships, fileMetadata };
  }

  private extractParameters(paramsNode: Parser.SyntaxNode | null): string[] {
    if (!paramsNode) return [];
    const params: string[] = [];
    for (let i = 0; i < paramsNode.childCount; i++) {
      const child = paramsNode.child(i)!;
      if (child.type === "parameter") {
        const pat = child.childForFieldName("pattern")?.text;
        if (pat && pat !== "self" && pat !== "&self" && pat !== "&mut self" && pat !== "mut self") {
          params.push(pat);
        }
      } else if (child.type === "self_parameter") {
        // Skip self
      }
    }
    return params;
  }

  private isScopeNode(node: Parser.SyntaxNode) {
    return ["function_item", "impl_item", "trait_item", "mod_item"].includes(node.type);
  }

  private getScopeName(node: Parser.SyntaxNode) {
    if (node.type === "function_item") return node.childForFieldName("name")?.text || null;
    if (node.type === "impl_item") return node.childForFieldName("type")?.text || null;
    if (node.type === "trait_item") return node.childForFieldName("name")?.text || null;
    if (node.type === "mod_item") return node.childForFieldName("name")?.text || null;
    return null;
  }
}
