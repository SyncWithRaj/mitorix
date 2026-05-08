import fs from "fs";
import path from "path";

export class PathResolver {
    private pathsMapping: Record<string, string[]> = {};
    private repoBasePath: string = "";

    constructor(repoBasePath: string) {
        this.repoBasePath = path.resolve(repoBasePath);
        this.loadConfig();
    }

    /**
     * Attempts to load tsconfig.json or jsconfig.json and extract compilerOptions.paths
     */
    private loadConfig() {
        const configFiles = ["tsconfig.json", "jsconfig.json"];
        for (const file of configFiles) {
            const configPath = path.join(this.repoBasePath, file);
            if (fs.existsSync(configPath)) {
                try {
                    const content = fs.readFileSync(configPath, "utf-8");
                    // Strip comments from JSON if any
                    const cleanJson = content.replace(/\/\*[\s\S]*?\*\/|([^\\:]|^)\/\/.*$/gm, '$1');
                    const config = JSON.parse(cleanJson);
                    
                    if (config.compilerOptions?.paths) {
                        this.pathsMapping = config.compilerOptions.paths;
                        console.log(`[PathResolver] Successfully loaded ${file} path aliases:`, Object.keys(this.pathsMapping));
                        return;
                    }
                } catch (err: any) {
                    console.warn(`[PathResolver] Failed to parse ${file}:`, err.message);
                }
            }
        }
    }

    /**
     * Resolves an import source string to a fully-qualified relative file path from the repository root.
     * Handles:
     * 1. Relative imports: "../components/Button"
     * 2. TSConfig Path Aliases: "@/utils/math" -> "src/utils/math"
     * 3. Implicit extensions (.ts, .tsx, .js, .jsx, /index.ts, etc.)
     */
    public resolveImport(importSource: string, currentFilePath: string): string | null {
        let resolvedPath: string | null = null;

        const currentDir = path.dirname(path.resolve(currentFilePath));

        // 1. Check if import starts with a TSConfig/JSConfig alias
        for (const [aliasPattern, targetPaths] of Object.entries(this.pathsMapping)) {
            const aliasPrefix = aliasPattern.replace(/\*$/, ""); // e.g., "@/"
            if (importSource.startsWith(aliasPrefix)) {
                const subPath = importSource.slice(aliasPrefix.length); // e.g., "components/Button"
                
                for (const targetPattern of targetPaths) {
                    const targetPrefix = targetPattern.replace(/\*$/, ""); // e.g., "src/"
                    const absoluteTarget = path.join(this.repoBasePath, targetPrefix, subPath);
                    
                    const verified = this.verifyFileExistence(absoluteTarget);
                    if (verified) {
                        resolvedPath = verified;
                        break;
                    }
                }
            }
            if (resolvedPath) break;
        }

        // 2. Handle standard relative imports
        if (!resolvedPath && (importSource.startsWith(".") || importSource.startsWith("/"))) {
            const absoluteTarget = path.resolve(currentDir, importSource);
            resolvedPath = this.verifyFileExistence(absoluteTarget);
        }

        // 3. Fallback to matching absolute path inside repo (e.g. "src/utils/math")
        if (!resolvedPath) {
            const absoluteTarget = path.join(this.repoBasePath, importSource);
            resolvedPath = this.verifyFileExistence(absoluteTarget);
        }

        if (resolvedPath) {
            // Return relative path from repository root for normalized DB storage
            return path.relative(this.repoBasePath, resolvedPath);
        }

        return null;
    }

    /**
     * Verifies if a target path exists with various code extensions or as an index file
     */
    private verifyFileExistence(targetPath: string): string | null {
        const extensions = [".ts", ".tsx", ".js", ".jsx", ".py", ".go", ".rs", ".java", ".cpp", ".c", ".cs", ".rb", ".php"];
        
        // Exact match (e.g. extension already supplied)
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
            return targetPath;
        }

        // Try extensions
        for (const ext of extensions) {
            const withExt = targetPath + ext;
            if (fs.existsSync(withExt) && fs.statSync(withExt).isFile()) {
                return withExt;
            }
        }

        // Try index files inside directory
        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
            for (const ext of extensions) {
                const indexFile = path.join(targetPath, "index" + ext);
                if (fs.existsSync(indexFile) && fs.statSync(indexFile).isFile()) {
                    return indexFile;
                }
            }
        }

        return null;
    }
}
