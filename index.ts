// @ts-ignore
import fs from 'fs';
// @ts-ignore
import path from 'path';
// @ts-ignore
import { NameReplacer } from './nameReplacer';

// Directory paths
const toConvertDir = 'ToConvert';
const convertedDir = 'Converted';

// Parse command line arguments
const args = process.argv.slice(2);

// Process flags first
const includeReasoning = args.includes('--reasoning');
const deleteOriginalFile = args.includes('--delete');

// Handle anonymization with potential gender parameter
let anonymizeNames = false;
let userGender: string | null = null;

// Check for anonymize flag
const anonymizeIndex = args.findIndex(arg => arg === '--anonymize');
if (anonymizeIndex !== -1) {
  anonymizeNames = true;
  
  // Check for gender specification in the next argument
  if (anonymizeIndex < args.length - 1) {
    const potentialGender = args[anonymizeIndex + 1].toLowerCase();
    if (potentialGender === 'male' || potentialGender === 'female') {
      userGender = potentialGender;
      console.log(`Detected gender parameter: ${userGender}`);
    }
  }
}

// Log configuration
console.log(`Including reasoning: ${includeReasoning ? 'Yes' : 'No'}`);
console.log(`Delete original files: ${deleteOriginalFile ? 'Yes' : 'No'}`);
console.log(`Anonymize names: ${anonymizeNames ? 'Yes' : 'No'}`);
if (anonymizeNames) {
  console.log(`User gender preference: ${userGender || 'random'}`);
}

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

    // Initialize a new name replacer for each file to ensure different names
    const nameReplacer = anonymizeNames ? new NameReplacer(userGender) : null;
    if (nameReplacer) {
      nameReplacer.initialize(entries);
    }

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
          let reasoningText = entry.extra.reasoning;
          if (nameReplacer) {
            reasoningText = nameReplacer.replace(reasoningText);
          }
          messageValue = `<think>${reasoningText}</think> ${messageValue}`;
        }
        // Also check if there's reasoning in a nested structure (in case the structure varies)
        else if (entry.extra && entry.extra.api && entry.extra.reasoning_type && entry.extra.reasoning && entry.extra.reasoning.trim() !== '') {
          let reasoningText = entry.extra.reasoning;
          if (nameReplacer) {
            reasoningText = nameReplacer.replace(reasoningText);
          }
          messageValue = `<think>${reasoningText}</think> ${messageValue}`;
        }
      }
      
      // Anonymize the message content if needed
      if (nameReplacer) {
        messageValue = nameReplacer.replace(messageValue);
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
