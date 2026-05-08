import Parser from "tree-sitter";
import Python from "tree-sitter-python";
import { BaseParser, type ParsedEntity, type ParsedRelationship, type ParsedFileMetadata } from "./BaseParser.js";
import { PathResolver } from "../pathResolver.js";

export class PythonParser extends BaseParser {
    languageName = "python";
    private parser: Parser;

    constructor() {
        super();
        this.parser = new Parser();
        this.parser.setLanguage(Python);
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

        const walk = (node: Parser.SyntaxNode, depth: number, parentName: string | null, insideClass: string | null) => {
            const key = `${filePath}:${node.startPosition.row}:${node.type}`;
            if (seen.has(key)) return;
            seen.add(key);

            // ── Handle decorated definitions (unwrap @decorator → function/class) ──
            if (node.type === 'decorated_definition') {
                const definition = node.childForFieldName('definition');
                if (definition) {
                    // Process the inner definition but use the decorated_definition's span
                    const innerKey = `${filePath}:${definition.startPosition.row}:${definition.type}`;
                    seen.add(innerKey); // prevent double processing
                    this.processDefinition(definition, repoId, filePath, depth, parentName, insideClass, entities, node);
                }
                // Continue walking children for nested decorators
                for (let i = 0; i < node.childCount; i++) {
                    walk(node.child(i)!, depth, parentName, insideClass);
                }
                return;
            }

            this.processDefinition(node, repoId, filePath, depth, parentName, insideClass, entities);

            // ── Relationships: function calls ──
            if (node.type === 'call') {
                const func = node.childForFieldName('function');
                if (func && parentName) {
                    relationships.push(this.createRelationship(repoId, parentName, filePath, func.text, "calls", node.startPosition.row + 1));
                }
            }

            // ── Relationships: imports ──
            if (node.type === 'import_statement') {
                const nameNode = node.child(1); // `import <module>`
                if (nameNode) {
                    relationships.push(this.createRelationship(
                        repoId, filePath.split('/').pop() || filePath, filePath,
                        nameNode.text, "imports", node.startPosition.row + 1
                    ));
                }
            }
            if (node.type === 'import_from_statement') {
                const moduleNode = node.childForFieldName('module_name');
                if (moduleNode) {
                    relationships.push(this.createRelationship(
                        repoId, filePath.split('/').pop() || filePath, filePath,
                        moduleNode.text, "imports", node.startPosition.row + 1
                    ));
                }
            }

            // ── Relationships: attribute access (obj.method) ──
            if (node.type === 'attribute') {
                const attr = node.childForFieldName('attribute')?.text;
                if (attr && parentName) {
                    relationships.push(this.createRelationship(repoId, parentName, filePath, attr, "accesses", node.startPosition.row + 1));
                }
            }

            // ── Recurse children ──
            const newInsideClass = node.type === 'class_definition'
                ? (node.childForFieldName('name')?.text || insideClass)
                : insideClass;

            for (let i = 0; i < node.childCount; i++) {
                walk(
                    node.child(i)!,
                    depth + (this.isScopeNode(node) ? 1 : 0),
                    this.getScopeName(node) || parentName,
                    newInsideClass
                );
            }
        };

        if (tree.rootNode) walk(tree.rootNode, 0, null, null);
        return { entities, relationships, fileMetadata };
    }

    private processDefinition(
        node: Parser.SyntaxNode, repoId: string, filePath: string,
        depth: number, parentName: string | null, insideClass: string | null,
        entities: ParsedEntity[], spanNode?: Parser.SyntaxNode
    ) {
        const entityNode = spanNode || node;

        if (node.type === 'function_definition') {
            const name = node.childForFieldName('name')?.text || "anonymous";
            const params = this.extractParameters(node.childForFieldName('parameters'));
            const returnType = node.childForFieldName('return_type')?.text || "any";

            // If inside a class, it's a method
            if (insideClass) {
                entities.push(this.createEntity(repoId, filePath, entityNode, "method", name, depth, insideClass, params, returnType));
            } else {
                entities.push(this.createEntity(repoId, filePath, entityNode, "function", name, depth, parentName, params, returnType));
            }
        } else if (node.type === 'class_definition') {
            const name = node.childForFieldName('name')?.text || "anonymous_class";
            entities.push(this.createEntity(repoId, filePath, entityNode, "class", name, depth, parentName));
        } else if (node.type === 'import_statement' || node.type === 'import_from_statement') {
            entities.push(this.createEntity(repoId, filePath, entityNode, "import", "import", 0, null));
        } else if (node.type === 'expression_statement' && node.parent?.type === 'module') {
            // Top-level assignments (module-level variables)
            const expr = node.child(0);
            if (expr?.type === 'assignment') {
                const left = expr.childForFieldName('left');
                if (left?.type === 'identifier') {
                    entities.push(this.createEntity(repoId, filePath, entityNode, "variable", left.text, depth, parentName));
                }
            }
        }
    }

    private extractParameters(paramsNode: Parser.SyntaxNode | null): string[] {
        if (!paramsNode) return [];
        const params: string[] = [];
        for (let i = 0; i < paramsNode.childCount; i++) {
            const child = paramsNode.child(i)!;
            if (child.type === 'identifier' && child.text !== 'self' && child.text !== 'cls') {
                params.push(child.text);
            } else if (child.type === 'typed_parameter' || child.type === 'default_parameter' || child.type === 'typed_default_parameter') {
                const nameNode = child.child(0);
                if (nameNode && nameNode.text !== 'self' && nameNode.text !== 'cls') {
                    params.push(nameNode.text);
                }
            }
        }
        return params;
    }

    private isScopeNode(node: Parser.SyntaxNode) {
        return ['function_definition', 'class_definition'].includes(node.type);
    }
    
    private getScopeName(node: Parser.SyntaxNode) {
        if (node.type === 'function_definition' || node.type === 'class_definition') {
            return node.childForFieldName('name')?.text || null;
        }
        return null;
    }
}
