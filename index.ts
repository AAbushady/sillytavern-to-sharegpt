import fs from 'fs';
import path from 'path';
import { convertDirectory, ConversionOptions, getSupportedFormats } from './converter';

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

// Handle format selection
let format = 'sharegpt'; // Default format is ShareGPT
const formatIndex = args.findIndex(arg => arg === '--format');
if (formatIndex !== -1 && formatIndex < args.length - 1) {
  format = args[formatIndex + 1].toLowerCase();
}

// Handle combine option
let combineFiles = false;
let combinedFileName = 'combined.jsonl';
const combineIndex = args.findIndex(arg => arg === '--combine');
if (combineIndex !== -1) {
  combineFiles = true;
  
  // Check for filename specification in the next argument
  if (combineIndex < args.length - 1 && !args[combineIndex + 1].startsWith('--')) {
    combinedFileName = args[combineIndex + 1];
    // Add .jsonl extension if not provided
    if (!combinedFileName.endsWith('.jsonl')) {
      combinedFileName += '.jsonl';
    }
  }
  console.log(`Will combine all files into: ${combinedFileName}`);
}

// Log configuration
console.log(`Output format: ${format}`);
console.log(`Including reasoning: ${includeReasoning ? 'Yes' : 'No'}`);
console.log(`Delete original files: ${deleteOriginalFile ? 'Yes' : 'No'}`);
console.log(`Anonymize names: ${anonymizeNames ? 'Yes' : 'No'}`);
if (anonymizeNames) {
  console.log(`User gender preference: ${userGender || 'random'}`);
}
console.log(`Combine files: ${combineFiles ? 'Yes' : 'No'}`);

// Prepare conversion options
const conversionOptions: ConversionOptions = {
  includeReasoning,
  deleteOriginalFile,
  anonymizeNames,
  userGender,
  format,
  combineFiles,
  combinedFileName
};

// Run the conversion process
try {
  convertDirectory(toConvertDir, convertedDir, conversionOptions);
  
  // If combining files is enabled, read all converted files and combine them
  if (combineFiles) {
    // Create the combined file path
    const combinedFilePath = path.join(convertedDir, combinedFileName);
    
    // Get all JSONL files in the converted directory
    const convertedFiles = fs.readdirSync(convertedDir)
      .filter(file => file.endsWith('.jsonl') && file !== combinedFileName);
    
    if (convertedFiles.length === 0) {
      console.log('No files to combine!');
      process.exit(0);
    }
    
    // Read all files and combine their contents
    let combinedContent = '';
    
    convertedFiles.forEach(file => {
      const filePath = path.join(convertedDir, file);
      const content = fs.readFileSync(filePath, 'utf-8');
      combinedContent += content + '\n';
      
      // Delete individual files if option is enabled
      if (combineFiles) {
        fs.unlinkSync(filePath);
      }
    });
    
    // Write the combined content to the combined file
    fs.writeFileSync(combinedFilePath, combinedContent.trim());
    console.log(`Combined ${convertedFiles.length} files into ${combinedFileName}`);
  }
} catch (error: any) {
  console.error(`Error: ${error.message}`);
  console.log(`Supported formats: ${getSupportedFormats().join(', ')}`);
  process.exit(1);
}
