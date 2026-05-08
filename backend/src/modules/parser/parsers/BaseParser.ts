import fs from "fs";
import { PathResolver } from "../pathResolver.js";

export type EntityType = "function" | "class" | "method" | "constructor" | "property" | "staticMethod" | "arrow" | "interface" | "typeAlias" | "enum" | "variable" | "import" | "export" | "route" | "css" | "html";
export type RelationType = "calls" | "accesses" | "imports" | "extends" | "implements";

export type ParsedEntity = {
    repoId: string;
    filePath: string;
    name: string;
    type: EntityType;
    language: string;
    parameters: string[];
    returnType: string;
    startLine: number;
    endLine: number;
    content: string;
    scopeDepth: number;
    parentName?: string | null;
}

export type ParsedRelationship = {
    repoId: string;
    fromName: string;
    fromFilePath: string;
    toName: string;
    toFilePath?: string | null;
    relationType: RelationType;
    line: number;
}

export type ParsedFileMetadata = {
    repoId: string;
    filePath: string;
    fileName: string;
    language: string;
    fileSize: number;
    totalLines: number;
    hasDefaultExport: boolean;
    hasReactComponent: boolean;
    isBackendFile: boolean;
    isTestFile: boolean;
}

export interface LanguageParser {
    languageName: string;
    parse(repoId: string, filePath: string, content: string, pathResolver?: PathResolver | null): Promise<{
        entities: ParsedEntity[];
        relationships: ParsedRelationship[];
        fileMetadata: ParsedFileMetadata;
    }>;
}

export abstract class BaseParser implements LanguageParser {
    abstract languageName: string;

    protected extractFileMetadata(repoId: string, filePath: string, content: string): ParsedFileMetadata {
        const fileName = filePath.split("/").pop() || "";
        let fileSize = 0;
        try {
            const stats = fs.statSync(filePath);
            fileSize = stats.size;
        } catch (e) {
            fileSize = Buffer.byteLength(content, 'utf8');
        }
        
        const totalLines = content.split("\n").length;
        
        const hasReactComponent = content.includes("React") || content.includes("useState") || content.includes("useEffect");
        const isBackendFile = filePath.includes("controller") || filePath.includes("service") || filePath.includes("route") || filePath.includes("model");
        const isTestFile = filePath.includes(".test.") || filePath.includes(".spec.") || filePath.includes("__tests__");
        
        return {
            repoId,
            filePath,
            fileName,
            language: this.languageName,
            fileSize,
            totalLines,
            hasDefaultExport: content.includes("export default"),
            hasReactComponent,
            isBackendFile,
            isTestFile
        };
    }

    protected createEntity(
        repoId: string, filePath: string, node: any,
        type: EntityType, name: string, depth: number, parentName: string | null,
        parameters: string[] = [], returnType: string = "any"
    ): ParsedEntity {
        return {
            repoId,
            filePath,
            name,
            type,
            language: this.languageName,
            parameters,
            returnType,
            startLine: node.startPosition.row + 1,
            endLine: node.endPosition.row + 1,
            content: node.text,
            scopeDepth: depth,
            parentName
        };
    }

    protected createRelationship(
        repoId: string, fromName: string, fromFilePath: string,
        toName: string, relationType: RelationType, line: number,
        toFilePath?: string | null
    ): ParsedRelationship {
        return { repoId, fromName, fromFilePath, toName, toFilePath: toFilePath || null, relationType, line };
    }

    abstract parse(repoId: string, filePath: string, content: string, pathResolver?: PathResolver | null): Promise<{
        entities: ParsedEntity[];
        relationships: ParsedRelationship[];
        fileMetadata: ParsedFileMetadata;
    }>;
}
