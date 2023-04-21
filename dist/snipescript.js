#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const ts = __importStar(require("typescript"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
function readFilesRecursively(folderPath) {
    const files = [];
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name !== "node_modules") {
                files.push(...readFilesRecursively(entryPath));
            }
        }
        else if (entry.isFile()) {
            files.push(entryPath);
        }
    }
    return files;
}
function filterErrorsByFolderPath(errorTree, folderPath) {
    const filteredErrors = {};
    for (const [filePath, errors] of Object.entries(errorTree)) {
        if (filePath.startsWith(folderPath)) {
            filteredErrors[filePath] = errors;
        }
    }
    return filteredErrors;
}
function createFileNode(filePath, errors) {
    const errorFree = !errors || errors.length === 0;
    return {
        name: path.basename(filePath),
        type: "file",
        errorFree,
        errors,
    };
}
function createDirectoryNode(directoryPath, children) {
    return {
        name: path.basename(directoryPath),
        type: "directory",
        children,
    };
}
function compile(fileNames, options) {
    const program = ts.createProgram(fileNames, options);
    const allDiagnostics = ts.getPreEmitDiagnostics(program);
    const errors = {};
    const ignoredErrorCodes = [17004, 1259, 1208, 2339, 2351]; // Add the error codes you want to ignore
    allDiagnostics.forEach((diagnostic) => {
        if (diagnostic.file && diagnostic.start) {
            const fileName = diagnostic.file.fileName;
            const { line, character } = ts.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
            const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
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
function buildFileTree(folderPath, errors) {
    const entries = fs.readdirSync(folderPath, { withFileTypes: true });
    const children = [];
    for (const entry of entries) {
        const entryPath = path.join(folderPath, entry.name);
        if (entry.isDirectory()) {
            children.push(buildFileTree(entryPath, errors));
        }
        else if (entry.isFile()) {
            children.push(createFileNode(entryPath, errors[entryPath]));
        }
    }
    return createDirectoryNode(folderPath, children);
}
function formatFileTree(tree, indent = "") {
    let result = "";
    if (tree.type === "file") {
        const isError = tree.errors && tree.errors.length > 0;
        result += `${indent}📜 ${tree.name}`;
        if (isError) {
            result += "\n";
            for (const error of tree.errors) {
                result += `${indent}     ${error.message}\n`;
            }
        }
        else {
            result += "\n";
        }
    }
    else if (tree.type === "directory") {
        result += `${indent}📂 ${tree.name}\n`;
        const childIndent = tree.name === "src" ? " ┣ " : " ┃ ";
        for (const child of tree.children) {
            result += formatFileTree(child, indent + childIndent);
        }
    }
    return result;
}
function main() {
    const targetFolder = process.argv[2];
    const fileNames = readFilesRecursively(targetFolder);
    const options = {
        target: ts.ScriptTarget.ES2020,
        module: ts.ModuleKind.CommonJS,
        strict: true,
        noEmit: true,
    };
    const filteredFileNames = fileNames.filter((fileName) => fileName.startsWith(targetFolder));
    const program = ts.createProgram(filteredFileNames, options);
    const errors = compile(filteredFileNames, options);
    const filteredErrors = filterErrorsByFolderPath(errors, targetFolder); // Filter errors based on the folder path
    const fileTree = buildFileTree(targetFolder, errors);
    const formattedFileTree = formatFileTree(fileTree, " ┣ ");
    console.log(formattedFileTree);
    // Save the tree to a file
    fs.writeFileSync("tree.txt", formattedFileTree, "utf-8");
    console.log("Tree saved to tree.txt");
    console.log(formattedFileTree);
    console.log(JSON.stringify({ fileTree, errorTree: filteredErrors }, null, 2)); // Log the filtered error tree
    // Save the output to a file
    fs.writeFileSync("output.json", JSON.stringify({ fileTree, errorTree: filteredErrors }, null, 2), "utf-8");
    console.log("Output saved to output.json");
}
main();
//# sourceMappingURL=snipescript.js.map