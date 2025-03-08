import { NameReplacer } from './nameReplacer';
import { FormatConverter } from './converter';

export interface ShareGPTEntry {
  from: 'human' | 'gpt';
  value: string;
}

/**
 * ShareGPT format converter implementation
 */
export const ShareGPTConverter: FormatConverter<ShareGPTEntry> = {
  /**
   * Converts a SillyTavern entry to ShareGPT format
   */
  convertEntry(entry: any, includeReasoning: boolean, nameReplacer: NameReplacer | null): ShareGPTEntry {
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
    return {
      from: entry.is_user ? 'human' : 'gpt',
      value: messageValue
    };
  },

  /**
   * Checks if an entry is valid for ShareGPT format
   */
  isValidEntry(entry: any): boolean {
    return entry.mes && entry.mes.trim() !== '';
  },

  /**
   * Serializes a ShareGPT entry to a string
   */
  serializeEntry(entry: ShareGPTEntry): string {
    return JSON.stringify(entry);
  }
}; 