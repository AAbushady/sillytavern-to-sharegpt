# SillyTavern To ShareGPT

A node.js script to convert SillyTavern chat logs into ShareGPT format!

## How To Use

- Clone or download the repository.
- Run `npm install` to install the dependencies.
- Run `npx tsc` for the TypeScript code.
- Add desired logs into the ToConvert Folder.
- Run `node dist/index.js` to run the script.
- Your files are now in the Converted Folder!

## Optional Commands

- Optional commands are to be added at the end of the node dist/index.js command.
- If your chat has reasoning use `--reasoning` at the end of the command to include \<think> tags!!
- Use `--delete` if you want to delete the original file!!