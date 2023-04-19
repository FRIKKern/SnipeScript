#!/usr/bin/env node
import * as ts from "typescript";
import * as fs from "fs";
import * as path from "path";

interface ErrorDetails {
  code: number;
  message: string;
  file: string;
  location: {
    line: number;
    character: number;
  };
}

interface Errors {
  [key: string]: ErrorDetails[];
}

function readFilesRecursively(folderPath: string): string[] {
  const files = [];
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "node_modules") {
        files.push(...readFilesRecursively(entryPath));
      }
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function filterErrorsByFolderPath(
  errorTree: Errors,
  folderPath: string
): Errors {
  const filteredErrors: Errors = {};

  for (const [filePath, errors] of Object.entries(errorTree)) {
    if (filePath.startsWith(folderPath)) {
      filteredErrors[filePath] = errors;
    }
  }

  return filteredErrors;
}

function createFileNode(filePath: string, errors: any[]): any {
  const errorFree = !errors || errors.length === 0;
  return {
    name: path.basename(filePath),
    type: "file",
    errorFree,
    errors,
  };
}

function createDirectoryNode(directoryPath: string, children: any[]): any {
  return {
    name: path.basename(directoryPath),
    type: "directory",
    children,
  };
}

function compile(
  fileNames: string[],
  options: ts.CompilerOptions
): Record<string, any> {
  const program = ts.createProgram(fileNames, options);
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  const errors: Errors = {};
  const ignoredErrorCodes = [17004, 1259, 1208, 2339, 2351]; // Add the error codes you want to ignore

  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file && diagnostic.start) {
      const fileName = diagnostic.file.fileName;
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );

      // Ignore specific errors by their error code
      if (!ignoredErrorCodes.includes(diagnostic.code)) {
        if (!errors[fileName]) {
          errors[fileName] = [];
        }

        errors[fileName].push({
          code: diagnostic.code,
          message,
          file: fileName,
          location: { line, character },
        });
      }
    }
  });

  return errors;
}

function buildFileTree(folderPath: string, errors: Record<string, any>): any {
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });
  const children = [];

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      children.push(buildFileTree(entryPath, errors));
    } else if (entry.isFile()) {
      children.push(createFileNode(entryPath, errors[entryPath]));
    }
  }

  return createDirectoryNode(folderPath, children);
}

function main(): void {
  const targetFolder = process.argv[2];
  const fileNames = readFilesRecursively(targetFolder);
  const options = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noEmit: true,
  };

  const filteredFileNames = fileNames.filter((fileName) =>
    fileName.startsWith(targetFolder)
  );
  const program = ts.createProgram(filteredFileNames, options);

  const errors = compile(filteredFileNames, options);
  const filteredErrors = filterErrorsByFolderPath(errors, targetFolder); // Filter errors based on the folder path
  const fileTree = buildFileTree(targetFolder, errors);

  console.log(JSON.stringify({ fileTree, errorTree: filteredErrors }, null, 2)); // Log the filtered error tree

  // Save the output to a file
  fs.writeFileSync(
    "output.json",
    JSON.stringify({ fileTree, errorTree: filteredErrors }, null, 2),
    "utf-8"
  );

  console.log("Output saved to output.json");
}

main();
