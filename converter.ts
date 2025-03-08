import fs from 'fs';
import path from 'path';
import { NameReplacer } from './nameReplacer';
import { ShareGPTConverter } from './sharegpt';

export interface ConversionOptions {
  includeReasoning: boolean;
  deleteOriginalFile: boolean;
  anonymizeNames: boolean;
  userGender: string | null;
  format: string; // Added to specify which format to convert to
}

// Generic interface for format converters
export interface FormatConverter<T, M = any> {
  convertEntry: (
    entry: any, 
    includeReasoning: boolean, 
    nameReplacer: NameReplacer | null,
    metadata?: any
  ) => M;
  isValidEntry: (entry: any) => boolean;
  serializeEntry: (entries: M[] | T, metadata?: any) => string;
  extractMetadata?: (entries: any[]) => any;
}

// Registry of available format converters
const formatConverters: Record<string, FormatConverter<any, any>> = {
  'sharegpt': ShareGPTConverter,
  // Add more formats here as they are implemented
  // 'alpaca': AlpacaConverter,
};

/**
 * Get the converter for the specified format
 */
export function getFormatConverter(format: string): FormatConverter<any, any> {
  const converter = formatConverters[format.toLowerCase()];
  if (!converter) {
    const supportedFormats = Object.keys(formatConverters).join(', ');
    throw new Error(`Unsupported format: ${format}. Supported formats: ${supportedFormats}`);
  }
  return converter;
}

/**
 * Get a list of supported formats
 */
export function getSupportedFormats(): string[] {
  return Object.keys(formatConverters);
}

export function convertFile<T, M = any>(
  filePath: string, 
  outputFilePath: string, 
  options: ConversionOptions,
  formatConverter: FormatConverter<T, M>
): void {
  const { includeReasoning, anonymizeNames, userGender, deleteOriginalFile } = options;
  
  // Read and parse the JSONL file
  const jsonlData = fs.readFileSync(filePath, 'utf-8');
  const lines = jsonlData.trim().split('\n');
  const entries = lines.map((line: string) => JSON.parse(line));

  // Initialize a new name replacer for each file to ensure different names
  const nameReplacer = anonymizeNames ? new NameReplacer(userGender) : null;
  if (nameReplacer) {
    nameReplacer.initialize(entries);
  }

  // Extract metadata if the converter supports it
  const metadata = formatConverter.extractMetadata ? formatConverter.extractMetadata(entries) : undefined;

  // Filter out entries without required properties
  const validEntries = entries.filter(entry => formatConverter.isValidEntry(entry));

  // Convert all valid entries
  const convertedEntries: M[] = validEntries.map(entry => 
    formatConverter.convertEntry(entry, includeReasoning, nameReplacer, metadata)
  );

  // Serialize all entries to a single output string
  const outputContent = formatConverter.serializeEntry(convertedEntries, metadata);

  // Write the converted data to the output file
  fs.writeFileSync(outputFilePath, outputContent);

  const fileName = path.basename(filePath);
  const outputFileName = path.basename(outputFilePath);
  console.log(`Converted ${fileName} to ${outputFileName} in ${options.format} format`);

  if (deleteOriginalFile) {
    // Delete the processed JSONL file
    fs.unlinkSync(filePath);
  }
}

/**
 * Convert all files in a directory using the specified format
 */
export function convertDirectory(
  inputDir: string, 
  outputDir: string, 
  options: ConversionOptions
): void {
  // Get the appropriate converter for the specified format
  const formatConverter = getFormatConverter(options.format);

  // Create the output directory if it doesn't exist
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  // Read all files in the input directory
  const files = fs.readdirSync(inputDir);

  files.forEach((file: string) => {
    // Check if the file has a .jsonl extension
    if (path.extname(file) === '.jsonl') {
      const filePath = path.join(inputDir, file);
      
      // Keep the .jsonl extension for the output file
      const outputFileName = `${path.parse(file).name}.jsonl`;
      const outputFilePath = path.join(outputDir, outputFileName);
      
      convertFile(filePath, outputFilePath, options, formatConverter);
    }
  });

  console.log(`Conversion to ${options.format} format complete!`);
} 