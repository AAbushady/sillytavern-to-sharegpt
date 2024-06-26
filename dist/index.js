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
const deleteOriginalFile = false;
// Create the "Converted" directory if it doesn't exist
if (!fs_1.default.existsSync(convertedDir)) {
    fs_1.default.mkdirSync(convertedDir);
}
// Read all files in the "ToConvert" directory
const files = fs_1.default.readdirSync(toConvertDir);
files.forEach((file) => {
    var _a;
    // Check if the file has a .jsonl extension
    if (path_1.default.extname(file) === '.jsonl') {
        const filePath = path_1.default.join(toConvertDir, file);
        const jsonlData = fs_1.default.readFileSync(filePath, 'utf-8');
        const lines = jsonlData.trim().split('\n');
        const entries = lines.map((line) => JSON.parse(line));
        // Filter out entries without a valid 'mes' property
        const validEntries = entries.filter((entry) => entry.mes && entry.mes.trim() !== '');
        // Convert the data to ShareGPT format
        const shareGptData = {
            id: ((_a = validEntries[0]) === null || _a === void 0 ? void 0 : _a.swipe_id) || '',
            conversations: validEntries.map((entry) => {
                return {
                    from: entry.is_user ? 'human' : 'gpt',
                    value: entry.mes,
                };
            }),
        };
        // Generate the output file name
        const outputFileName = `${path_1.default.parse(file).name}.json`;
        const outputFilePath = path_1.default.join(convertedDir, outputFileName);
        // Write the converted data to a new file in the "Converted" directory
        fs_1.default.writeFileSync(outputFilePath, JSON.stringify(shareGptData, null, 2));
        console.log(`Converted ${file} to ${outputFileName}`);
        if (deleteOriginalFile) {
            // Delete the processed JSONL file from the "ToConvert" directory
            fs_1.default.unlinkSync(filePath);
        }
    }
});
console.log('Conversion complete!');
