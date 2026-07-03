import fs from "fs";
import {
  type ParsedEntity,
  type ParsedRelationship,
  type ParsedFileMetadata,
  type LanguageParser,
} from "./parsers/BaseParser";
import { TypeScriptParser } from "./parsers/TypeScriptParser";
import { PythonParser } from "./parsers/PythonParser";
import { GoParser } from "./parsers/GoParser";
import { RustParser } from "./parsers/RustParser";
import { CParser } from "./parsers/CParser";
import { CppParser } from "./parsers/CppParser";
import { CSharpParser } from "./parsers/CSharpParser";
import { JavaParser } from "./parsers/JavaParser";
import { RubyParser } from "./parsers/RubyParser";
import { PhpParser } from "./parsers/PhpParser";

import { PathResolver } from "./pathResolver.js";
import logger from "../../lib/logger.js";

// Export the types so other files can still import them from astParser.ts
export type { ParsedEntity, ParsedRelationship, ParsedFileMetadata };

export async function parseRepository(
  repoId: string,
  filePaths: string[],
  basePath: string = ""
): Promise<{
  entities: ParsedEntity[];
  relationships: ParsedRelationship[];
  fileMetadata: ParsedFileMetadata[];
}> {
  const pathResolver = basePath ? new PathResolver(basePath) : null;
  const entities: ParsedEntity[] = [];
  const relationships: ParsedRelationship[] = [];
  const fileMetadata: ParsedFileMetadata[] = [];

  // Initialize parsers
  const tsParser = new TypeScriptParser(false);
  const tsxParser = new TypeScriptParser(true);
  let pyParser: PythonParser | null = null;
  let goParser: GoParser | null = null;
  let rustParser: RustParser | null = null;
  let cParser: CParser | null = null;
  let cppParser: CppParser | null = null;
  let csParser: CSharpParser | null = null;
  let javaParser: JavaParser | null = null;
  let rubyParser: RubyParser | null = null;
  let phpParser: PhpParser | null = null;

  for (const filePath of filePaths) {
    try {
      const content = fs.readFileSync(filePath, "utf-8");
      let parser: LanguageParser | null = null;

      if (filePath.endsWith(".ts")) {
        parser = tsParser;
      } else if (filePath.endsWith(".tsx") || filePath.endsWith(".jsx") || filePath.endsWith(".js")) {
        parser = tsxParser;
      } else if (filePath.endsWith(".py")) {
        if (!pyParser) pyParser = new PythonParser();
        parser = pyParser;
      } else if (filePath.endsWith(".go")) {
        if (!goParser) goParser = new GoParser();
        parser = goParser;
      } else if (filePath.endsWith(".rs")) {
        if (!rustParser) rustParser = new RustParser();
        parser = rustParser;
      } else if (filePath.endsWith(".c") || filePath.endsWith(".h")) {
        if (!cParser) cParser = new CParser();
        parser = cParser;
      } else if (
        filePath.endsWith(".cpp") ||
        filePath.endsWith(".hpp") ||
        filePath.endsWith(".cc")
      ) {
        if (!cppParser) cppParser = new CppParser();
        parser = cppParser;
      } else if (filePath.endsWith(".cs")) {
        if (!csParser) csParser = new CSharpParser();
        parser = csParser;
      } else if (filePath.endsWith(".java")) {
        if (!javaParser) javaParser = new JavaParser();
        parser = javaParser;
      } else if (filePath.endsWith(".rb")) {
        if (!rubyParser) rubyParser = new RubyParser();
        parser = rubyParser;
      } else if (filePath.endsWith(".php")) {
        if (!phpParser) phpParser = new PhpParser();
        parser = phpParser;
      }

      if (parser) {
        const result = await parser.parse(repoId, filePath, content, pathResolver);
        entities.push(...result.entities);
        relationships.push(...result.relationships);
        fileMetadata.push(result.fileMetadata);
      }
    } catch (err: any) {
      logger.error({ err: err?.message || err, filePath }, "Failed to parse AST for file");
    }
  }

  return {
    entities,
    relationships,
    fileMetadata,
  };
}
