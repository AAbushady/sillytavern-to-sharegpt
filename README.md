# SillyTavern To ShareGPT

A node.js script to convert SillyTavern chat logs into ShareGPT format!

## How To Use

- Clone or download the repository.
- Run `npm install` to install the dependencies.
- Add desired logs into the ToConvert Folder.
- Run `npm start -- [options]` to execute the script directly.
  - For example: `npm start -- --anonymize male`
- Your files are now in the Converted Folder!

## Optional Commands

- Optional commands are to be added at the end of the command.
- `--reasoning`: Include reasoning as \<think> tags at the beginning of messages
- `--delete`: Delete original files after conversion
- `--anonymize [gender]`: Replace user names with realistic random alternatives
  - Optional gender parameter: `male` or `female` (e.g., `--anonymize male`)
  - Without gender parameter: Uses random gender names
- `--format [format]`: Specify the output format
  - Currently supported format: `sharegpt` (default)
  - Example: `npm start -- --format sharegpt`
- `--combine [filename]`: Combine all converted files into a single file
  - Optional filename parameter (e.g., `--combine dataset.jsonl`)
  - Without filename parameter: Uses `combined.jsonl` as default
  - Example: `npm start -- --combine my_dataset.jsonl`

### Name Anonymization

When using the anonymize feature, the script:

1. Automatically detects all user names in your data files
2. Replaces them with realistic random names from Faker.js's database
3. Generates different random names for each file
4. Only changes user names, leaving character names intact

Each file processed will get its own set of random name replacements, ensuring variety across your dataset while maintaining consistency within each conversation.
