// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';

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

    // Filter out entries without a valid 'mes' property
    const validEntries = entries.filter((entry: { mes: string; }) => entry.mes && entry.mes.trim() !== '');

    // Convert the entries to the desired format
    const outputLines: string[] = [];

    // Process each valid entry
    validEntries.forEach((entry: { is_user: any; mes: any; extra?: any; }) => {
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
    const outputFileName = `${path.parse(file).name}.jsonl`;
    const outputFilePath = path.join(convertedDir, outputFileName);

    // Write the converted data as JSONL format (one JSON object per line)
    fs.writeFileSync(outputFilePath, outputLines.join('\n'));

    console.log(`Converted ${file} to ${outputFileName}`);

    if (deleteOriginalFile) {
      // Delete the processed JSONL file from the "ToConvert" directory
      fs.unlinkSync(filePath);
    }
  }
});

console.log('Conversion complete!');
