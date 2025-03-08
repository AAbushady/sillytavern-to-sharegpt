# SillyTavern To ShareGPT

A node.js script to convert SillyTavern chat logs into ShareGPT format and other formats for LLM fine-tuning!

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
  - Supported formats: `sharegpt` (default), `alpaca`
  - Example: `npm start -- --format alpaca`
- `--combine [filename]`: Combine all converted files into a single file
  - Optional filename parameter (e.g., `--combine dataset.json`)
  - Without filename parameter: Uses format-appropriate default (`combined.jsonl` for ShareGPT, `combined.json` for Alpaca)
  - Example: `npm start -- --format alpaca --combine my_dataset.json`

## Supported Formats

### ShareGPT Format (Default)

The ShareGPT format is designed for sharing conversations with large language models. It preserves the multi-turn structure of conversations with each message marked as either "human" or "gpt".

- Output Format: JSONL (JSON Lines)
- File Extension: `.jsonl`
- Structure: Each conversation is a JSON object with a `conversations` array containing message objects with `from` and `value` fields

Example:

```json
{"conversations":[{"from":"human","value":"Hello, how are you?"},{"from":"gpt","value":"I'm doing well, thanks for asking! How can I help you today?"}]}
```

### Alpaca Format

The Alpaca format is specifically designed for fine-tuning language models like LLaMA. It condenses multi-turn conversations into instruction-input-output triplets that are ideal for instruction tuning.

- Output Format: JSON array
- File Extension: `.json`
- Structure: Each conversation is condensed into a single JSON object with `instruction`, `input`, and `output` fields

Example:

```json
[
  {
    "instruction": "You are Character, a character in a roleplay scenario. Respond in character, maintaining the established tone and style.",
    "input": "Human: Hello, how are you?\nCharacter: I'm doing well, thanks for asking! How can I help you today?\nHuman: Tell me about yourself.",
    "output": "I'm Character, an AI assistant designed to provide helpful, accurate, and safe responses to a wide variety of questions and requests. I can provide information, assist with tasks, engage in conversations, and much more. I don't have personal experiences or feelings in the way humans do, but I'm programmed to be friendly and supportive. I'm constantly learning and improving based on interactions. How can I assist you today?"
  }
]
```

In Alpaca format:

- The `instruction` field contains a system message about the character's role
- The `input` field contains the full conversation history
- The `output` field contains the last character response


### Name Anonymization

When using the anonymize feature, the script:

1. Automatically detects all user names in your data files
2. Replaces them with realistic random names from Faker.js's database
3. Generates different random names for each file
4. Only changes user names, leaving character names intact

Each file processed will get its own set of random name replacements, ensuring variety across your dataset while maintaining consistency within each conversation.
