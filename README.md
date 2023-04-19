# SnipeScript

SnipeScript is a custom TypeScript compiler that compiles a specific folder and generates an error tree. It allows you to selectively filter errors by error codes and folder paths. The output of the program is a JSON file containing the error tree, making it easy to analyze and manage the TypeScript compilation errors.

## Features

- Compiles a specific folder containing TypeScript files.
- Generates an error tree for easier error analysis.
- Allows filtering errors by error codes and folder paths.
- Saves the output as a JSON file.

## Installation

To use SnipeScript, you will need to have Node.js installed on your system. After that, you can install SnipeScript as a global package by running the following command:

```bash
    npm install -g snipescript
```

## Usage

To compile a specific folder and generate the error tree, run the following command:

```bash

    snipescript <folder-path>

```

Replace <folder-path> with the path to the folder containing your TypeScript files.

The output will be saved to an output.json file in the current directory.

## Configuration

You can customize the behavior of SnipeScript by modifying the script. For example, you can add or remove error codes to ignore by updating the ignoredErrorCodes array:

```javascript
const ignoredErrorCodes = [17004, 1259, 1208, 2339, 2351]; // Add the error codes you want to ignore
```

You can also update the TypeScript compiler options by modifying the options object:

```javascript
const options = {
  target: ts.ScriptTarget.ES2020,
  module: ts.ModuleKind.CommonJS,
  strict: true,
  noEmit: true,
};
```

## License

SnipeScript is released under the MIT License.
