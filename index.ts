// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

// Directory paths
const toConvertDir = 'ToConvert';
const convertedDir = 'Converted';

// Create the "Converted" directory if it doesn't exist
if (!fs.existsSync(convertedDir)) {
  fs.mkdirSync(convertedDir);
}

// Read all files in the "ToConvert" directory
const files = fs.readdirSync(toConvertDir);

files.forEach((file: any) => {
  // Check if the file has a .jsonl extension
  if (path.extname(file) === '.jsonl') {
    const filePath = path.join(toConvertDir, file);
    const jsonlData = fs.readFileSync(filePath, 'utf-8');
    const lines = jsonlData.trim().split('\n');
    const entries = lines.map((line: string) => JSON.parse(line));

    // Convert the data to ShareGPT format
    const shareGptData = {
      id: entries[0].swipe_id || '',
      conversations: entries.map((entry: { is_user: any; mes: any; }) => {
        return {
          from: entry.is_user ? 'human' : 'gpt',
          value: entry.mes,
        };
      }),
    };

    // Generate the output file name
    const outputFileName = `${path.parse(file).name}.json`;
    const outputFilePath = path.join(convertedDir, outputFileName);

    // Write the converted data to a new file in the "Converted" directory
    fs.writeFileSync(outputFilePath, JSON.stringify(shareGptData, null, 2));

    console.log(`Converted ${file} to ${outputFileName}`);

    // Delete the processed JSONL file from the "ToConvert" directory
    fs.unlinkSync(filePath);
  }
});

console.log('Conversion complete!');
