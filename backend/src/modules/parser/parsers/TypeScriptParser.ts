import Parser from "tree-sitter";
import TypeScript from "tree-sitter-typescript";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser";

export class TypeScriptParser extends BaseParser {
    languageName: string;
    private parser: Parser;

    constructor(isTsx: boolean = false) {
        super();
        this.languageName = isTsx ? "typescript-tsx" : "typescript";
        this.parser = new Parser();
        this.parser.setLanguage(isTsx ? TypeScript.tsx : TypeScript.typescript);
    }

    async parse(repoId: string, filePath: string, content: string): Promise<{ entities: ParsedEntity[]; relationships: ParsedRelationship[]; fileMetadata: ParsedFileMetadata; }> {
        const fileMetadata = this.extractFileMetadata(repoId, filePath, content);
        const tree = this.parser.parse(content);
        
        const entities: ParsedEntity[] = [];
        const relationships: ParsedRelationship[] = [];
        const seen = new Set<string>();

        const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null) => {
            const key = `${filePath}:${node.startPosition.row}:${node.type}`;
            if (seen.has(key)) return;
            seen.add(key);

            if (node.type === 'function_declaration') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "function", name, depth, parentName, this.extractParameters(node.childForFieldName('parameters'))));
            } else if (node.type === 'arrow_function') {
                let name = "anonymous_arrow";
                if (node.parent?.type === 'variable_declarator') {
                    name = node.parent.childForFieldName('name')?.text || name;
                }
                entities.push(this.createEntity(repoId, filePath, node, "arrow", name, depth, parentName, this.extractParameters(node.childForFieldName('parameters'))));
            } else if (node.type === 'method_definition') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "method", name, depth, parentName, this.extractParameters(node.childForFieldName('parameters'))));
            } else if (node.type === 'class_declaration') {
                const name = node.childForFieldName('name')?.text || "anonymous_class";
                entities.push(this.createEntity(repoId, filePath, node, "class", name, depth, parentName));
            } else if (node.type === 'interface_declaration') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "interface", name, depth, parentName));
            } else if (node.type === 'type_alias_declaration') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "typeAlias", name, depth, parentName));
            } else if (node.type === 'enum_declaration') {
                const name = node.childForFieldName('name')?.text || "anonymous";
                entities.push(this.createEntity(repoId, filePath, node, "enum", name, depth, parentName));
            } else if (node.type === 'variable_declarator') {
                if (node.parent?.parent?.type === 'program' || node.parent?.parent?.type === 'export_statement') {
                    const init = node.childForFieldName('value');
                    // Skip if the initializer is an arrow/function (they get their own entity)
                    if (!init || (init.type !== 'arrow_function' && init.type !== 'function')) {
                        const name = node.childForFieldName('name')?.text || "anonymous";
                        entities.push(this.createEntity(repoId, filePath, node, "variable", name, depth, parentName));
                    }
                }
            } else if (node.type === 'import_statement') {
                const source = node.childForFieldName('source')?.text || "";
                const cleanSource = source.replace(/['"`]/g, "");
                entities.push(this.createEntity(repoId, filePath, node, "import", "import", depth, null, [], cleanSource));
            } else if (node.type === 'export_statement') {
                entities.push(this.createEntity(repoId, filePath, node, "export", "export", depth, null));
            }

            // ── Relationships ──
            if (node.type === 'call_expression') {
                const func = node.childForFieldName('function');
                if (func) {
                    relationships.push(this.createRelationship(repoId, parentName || "top_level", filePath, func.text, "calls", node.startPosition.row + 1));
                }
            }

            if (node.type === 'import_statement') {
                const source = node.childForFieldName('source')?.text;
                if (source && (source.startsWith("'.") || source.startsWith('".') || source.startsWith('`.'))) {
                    relationships.push(this.createRelationship(
                        repoId, filePath.split('/').pop() || filePath, filePath,
                        source.replace(/['"`]/g, ""), "imports", node.startPosition.row + 1
                    ));
                }
            }

            if (node.type === 'member_expression' || node.type === 'property_access_expression') {
                const prop = node.childForFieldName('property')?.text;
                if (prop && parentName) {
                    relationships.push(this.createRelationship(repoId, parentName, filePath, prop, "accesses", node.startPosition.row + 1));
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
        return ['function_declaration', 'method_definition', 'arrow_function', 'class_declaration'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_declaration' || node.type === 'class_declaration' || node.type === 'method_definition' || node.type === 'interface_declaration') {
            return node.childForFieldName('name')?.text || null;
        }
        if (node.type === 'arrow_function' && node.parent?.type === 'variable_declarator') {
            return node.parent.childForFieldName('name')?.text || null;
        }
        return null;
    }

    private extractParameters(paramsNode: Parser.SyntaxNode | null): string[] {
        if (!paramsNode) return [];
        const params: string[] = [];
        for (let i = 0; i < paramsNode.childCount; i++) {
            const child = paramsNode.child(i)!;
            if (child.type === 'required_parameter' || child.type === 'optional_parameter' || child.type === 'identifier') {
                const nameNode = child.type === 'identifier' ? child : child.child(0);
                if (nameNode) params.push(nameNode.text);
            } else if (child.type === 'formal_parameters') {
                return this.extractParameters(child);
            }
        }
        return params;
    }
}
