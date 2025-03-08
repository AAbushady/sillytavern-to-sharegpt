"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-ignore
const fs_1 = __importDefault(require("fs"));
// @ts-ignore
const path_1 = __importDefault(require("path"));
// Directory paths
const toConvertDir = 'ToConvert';
const convertedDir = 'Converted';
// Utility Variables.
// Parse command line arguments
const args = process.argv.slice(3);
// Default to NOT including reasoning unless explicitly requested with --reasoning flag
const includeReasoning = args.includes('--reasoning');
const deleteOriginalFile = args.includes('--delete');
// Create the "Converted" directory if it doesn't exist
if (!fs_1.default.existsSync(convertedDir)) {
    fs_1.default.mkdirSync(convertedDir);
}
// Read all files in the "ToConvert" directory
const files = fs_1.default.readdirSync(toConvertDir);
files.forEach((file) => {
    // Check if the file has a .jsonl extension
    if (path_1.default.extname(file) === '.jsonl') {
        const filePath = path_1.default.join(toConvertDir, file);
        const jsonlData = fs_1.default.readFileSync(filePath, 'utf-8');
        const lines = jsonlData.trim().split('\n');
        const entries = lines.map((line) => JSON.parse(line));
        // Filter out entries without a valid 'mes' property
        const validEntries = entries.filter((entry) => entry.mes && entry.mes.trim() !== '');
        // Convert the entries to the desired format
        const outputLines = [];
        // Process each valid entry
        validEntries.forEach((entry) => {
            // Process the message value
            let messageValue = entry.mes;
            // Only add reasoning if the flag is set
            if (includeReasoning) {
                // Check if reasoning exists in the extra field
                if (entry.extra && entry.extra.reasoning && entry.extra.reasoning.trim() !== '') {
                    // Add the reasoning at the beginning of the message wrapped in <think> tags
                    messageValue = `<think>${entry.extra.reasoning}</think> ${messageValue}`;
                }
                // Also check if there's reasoning in a nested structure (in case the structure varies)
                else if (entry.extra && entry.extra.api && entry.extra.reasoning_type && entry.extra.reasoning && entry.extra.reasoning.trim() !== '') {
                    messageValue = `<think>${entry.extra.reasoning}</think> ${messageValue}`;
                }
            }
            // Create the output object for this entry
            const outputEntry = {
                from: entry.is_user ? 'human' : 'gpt',
                value: messageValue
            };
            // Add the JSON stringified entry to our output lines
            outputLines.push(JSON.stringify(outputEntry));
        });
        // Generate the output file name with .jsonl extension
        const outputFileName = `${path_1.default.parse(file).name}.jsonl`;
        const outputFilePath = path_1.default.join(convertedDir, outputFileName);
        // Write the converted data as JSONL format (one JSON object per line)
        fs_1.default.writeFileSync(outputFilePath, outputLines.join('\n'));
        console.log(`Converted ${file} to ${outputFileName}`);
        if (deleteOriginalFile) {
            // Delete the processed JSONL file from the "ToConvert" directory
            fs_1.default.unlinkSync(filePath);
        }
    }
});
console.log('Conversion complete!');
