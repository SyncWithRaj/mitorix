import fs from "fs";
import path from "path";

// this defines the shape of what each scanned file will look like. (See o/p)
// absolutePath needed for read  file content later
// relativePath: clean display in UI/DB
export interface ScannedFile {
  absolutePath: string;
  relativePath: string;
  extension: string;
}

// used set instead of array bcz of efficiency .has(ext) is faster than .includes(ext), Set lookup = O(1)
const VALID_EXTENSIONS = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".css",
  ".html",
  ".py",
  ".go",
  ".rs",
  ".c",
  ".h",
  ".cpp",
  ".hpp",
  ".cc",
  ".cs",
  ".java",
  ".rb",
  ".php",
]);

const IGNORED_DIRECTIONS = new Set(["node_modules", ".git", "dist", "build", ".next", "coverage"]);

// you passed root folder. It returns array of ScannedFile
export function scanCodeFiles(rootPath: string): ScannedFile[] {
  // stores all discovered valid files. Thhink of it as a collection basket
  const results: ScannedFile[] = [];

  // recursive fn for exploring unknown depth directories
  function walk(currentPath: string) {
    let entries: fs.Dirent[];

    try {
      // reads everything inside the foldder
      // returns object called dirent
      // Each Dirent tells: -isDirectory(), -isFile()
      // withFileTypes: true is imp
      entries = fs.readdirSync(currentPath, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // check if it's folder
      if (entry.isDirectory()) {
        // if it's in ignored list -> skip
        if (IGNORED_DIRECTIONS.has(entry.name)) {
          continue;
        }

        // you go deeper into subfolder.
        // this continues until no subfolders remain
        walk(fullPath); // recursive call
      }

      // check for if it's file
      else if (entry.isFile()) {
        // check for extension
        const ext = path.extname(entry.name);

        // if not valid extension then skip
        if (!VALID_EXTENSIONS.has(ext)) {
          continue;
        }

        // if valid ext then this creates clean path like: src/components/Navbar.jsx
        const relativePath = path.relative(rootPath, fullPath);

        //recursion started, you start scanning from root folder.

        // return results
        results.push({
          absolutePath: fullPath,
          relativePath,
          extension: ext,
        });
        // after recursion completes you get full list
      }
    }
  }

  walk(rootPath);
  return results;
}
