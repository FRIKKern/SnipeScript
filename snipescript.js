#!/usr/bin/env node
const ts = require("typescript");
const fs = require("fs");
const path = require("path");

function readFilesRecursively(folderPath) {
  const files = [];
  const entries = fs.readdirSync(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);
    if (entry.isDirectory()) {
      files.push(...readFilesRecursively(entryPath));
    } else if (entry.isFile()) {
      files.push(entryPath);
    }
  }

  return files;
}

function compile(fileNames, options) {
  const program = ts.createProgram(fileNames, options);
  const allDiagnostics = ts.getPreEmitDiagnostics(program);

  const errors = {};
  allDiagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const fileName = diagnostic.file.fileName;
      const { line, character } = ts.getLineAndCharacterOfPosition(
        diagnostic.file,
        diagnostic.start
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );

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
  });

  return { errors };
}

function main() {
  const fileNames = readFilesRecursively(".");
  const options = {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.CommonJS,
    strict: true,
    noEmit: true, // Add this line to prevent file generation
  };

  const targetFolder = process.argv[2];
  const filteredFileNames = fileNames.filter((fileName) =>
    fileName.startsWith(targetFolder)
  );
  const program = ts.createProgram(filteredFileNames, options);

  const result = compile(filteredFileNames, options);
  if (result.errors && Object.keys(result.errors).length > 0) {
    console.error("Compilation failed with errors:", result.errors);
  } else {
    console.log("Compilation succeeded without errors");
  }
}

main();
