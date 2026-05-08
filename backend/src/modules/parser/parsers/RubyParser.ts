import Parser from "tree-sitter";
import Ruby from "tree-sitter-ruby";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class RubyParser extends BaseParser {
    languageName = "ruby";
    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(Ruby);
    }

    async parse(
        repoId: string,
        filePath: string,
        content: string,
        pathResolver?: PathResolver | null
    ): Promise<{ entities: ParsedEntity[]; relationships: ParsedRelationship[]; fileMetadata: ParsedFileMetadata; }> {
        const fileMetadata = this.extractFileMetadata(repoId, filePath, content);
        const tree = this.parser.parse(content);
        const entities: ParsedEntity[] = [];
        const relationships: ParsedRelationship[] = [];
        const seen = new Set<string>();

        const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null) => {
            const key = `${filePath}:${node.startPosition.row}:${node.type}`;
            if (seen.has(key)) return;
            seen.add(key);

            if (node.type === 'method') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "method", name, depth, parentName));
            } else if (node.type === 'singleton_method') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "staticMethod", name, depth, parentName));
            } else if (node.type === 'class') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
            } else if (node.type === 'module') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
            }

            if (node.type === 'call') {
                const method = node.childForFieldName('method')?.text;
                if (method && parentName) {
                    relationships.push(this.createRelationship(repoId, parentName, filePath, method, "calls", node.startPosition.row + 1));
                }
            }

            for (let i = 0; i < node.childCount; i++) {
                walk(node.child(i)!, depth + (this.isScopeNode(node) ? 1 : 0), this.getScopeName(node) || parentName);
            }
        };

        if (tree.rootNode) walk(tree.rootNode, 0, null);
        return { entities, relationships, fileMetadata };
    }

    private isScopeNode(node: Parser.SyntaxNode) {
        return ['method', 'class', 'module', 'singleton_method'].includes(node.type);
    }

    private getScopeName(node: Parser.SyntaxNode) {
        if (['method', 'class', 'module', 'singleton_method'].includes(node.type)) {
            return node.childForFieldName('name')?.text || null;
        }
        return null;
    }
}
