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

// Log configuration
console.log(`Output format: ${format}`);
console.log(`Including reasoning: ${includeReasoning ? 'Yes' : 'No'}`);
console.log(`Delete original files: ${deleteOriginalFile ? 'Yes' : 'No'}`);
console.log(`Anonymize names: ${anonymizeNames ? 'Yes' : 'No'}`);
if (anonymizeNames) {
  console.log(`User gender preference: ${userGender || 'random'}`);
}

// Prepare conversion options
const conversionOptions: ConversionOptions = {
  includeReasoning,
  deleteOriginalFile,
  anonymizeNames,
  userGender,
  format
};

// Run the conversion process
try {
  convertDirectory(toConvertDir, convertedDir, conversionOptions);
} catch (error: any) {
  console.error(`Error: ${error.message}`);
  console.log(`Supported formats: ${getSupportedFormats().join(', ')}`);
  process.exit(1);
}
