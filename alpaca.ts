import { NameReplacer } from './nameReplacer';
import { FormatConverter } from './converter';

/**
 * Interface for a single Alpaca format entry
 */
export interface AlpacaEntry {
  instruction: string;
  input: string;
  output: string;
}

/**
 * Interface for multiple Alpaca entries
 */
export interface AlpacaDataset {
  items: AlpacaEntry[];
}

/**
 * Interface for metadata about the conversation
 */
export interface AlpacaMetadata {
  characterName?: string;
}

/**
 * Alpaca format converter implementation
 * Condenses multi-turn conversations into single Alpaca entries
 */
export const AlpacaConverter: FormatConverter<AlpacaDataset, AlpacaEntry> = {
  /**
   * Extract metadata from SillyTavern entries, specifically looking for character info
   */
  extractMetadata(entries: any[]): AlpacaMetadata {
    const metadata: AlpacaMetadata = {};
    
    // Find the character name from the entries
    // First look at chat metadata if available
    const chatMetaEntry = entries.find(e => e.chat_metadata && e.chat_metadata.character_name);
    if (chatMetaEntry && chatMetaEntry.chat_metadata.character_name) {
      metadata.characterName = chatMetaEntry.chat_metadata.character_name;
      return metadata;
    }

    // Next, look for non-user messages with a name field
    for (const entry of entries) {
      if (!entry.is_user && entry.name && entry.name.trim() !== '') {
        metadata.characterName = entry.name;
        return metadata;
      }
    }
    
    return metadata;
  },

  /**
   * Converts a SillyTavern entry to intermediate Alpaca format
   * This is just a processing step for each message; the full entries are created in serializeEntry
   */
  convertEntry(entry: any, includeReasoning: boolean, nameReplacer: NameReplacer | null): any {
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
      // Also check if reasoning exists in a nested structure
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
    
    // Return the processed entry with message content and role
    return {
      content: messageValue,
      is_user: entry.is_user,
      name: nameReplacer && entry.name ? nameReplacer.replace(entry.name) : entry.name
    };
  },

  /**
   * Checks if an entry is valid for Alpaca format
   */
  isValidEntry(entry: any): boolean {
    return entry.mes && entry.mes.trim() !== '';
  },

  /**
   * Process all messages and create a JSON format string
   * This condenses multi-turn conversations into single Alpaca entries
   */
  serializeEntry(entriesOrDataset: any[] | AlpacaDataset, metadata?: AlpacaMetadata): string {
    // If it's already an AlpacaDataset, just stringify it
    if (!Array.isArray(entriesOrDataset)) {
      // Convert dataset to a JSON array
      return JSON.stringify(entriesOrDataset.items, null, 2);
    }
    
    // Otherwise, it's an array of processed entries that we need to format
    const entries = entriesOrDataset;
    
    // Construct a single Alpaca entry from the entire conversation
    const alpacaEntries: AlpacaEntry[] = [];
    const characterName = metadata?.characterName || 'Assistant';
    
    // Create a single entry with the entire conversation
    // First, build the conversation history for the input field
    let conversationHistory = '';
    let lastCharacterResponse = '';
    
    // Flag to track if we've processed a character response
    let hasCharacterResponse = false;
    
    // Process all messages in the conversation
    for (let i = 0; i < entries.length; i++) {
      const entry = entries[i];
      
      // Skip entries without content
      if (!entry.content) continue;
      
      if (entry.is_user) {
        // This is a user message
        if (conversationHistory) conversationHistory += '\n\n';
        conversationHistory += `Human: ${entry.content}`;
      } else {
        // This is a character message
        if (conversationHistory) conversationHistory += '\n\n';
        conversationHistory += `${characterName}: ${entry.content}`;
        
        // Save this as the last character response
        lastCharacterResponse = entry.content;
        hasCharacterResponse = true;
      }
    }
    
    // Only create an entry if we have at least one character response
    if (hasCharacterResponse) {
      // Create the instruction as a system message
      const instruction = `You are ${characterName}, a character in a roleplay scenario. Respond in character, maintaining the established tone and style.`;
      
      alpacaEntries.push({
        instruction,
        input: conversationHistory,
        output: lastCharacterResponse
      });
    }
    
    // Convert to standard Alpaca JSON format (array of objects)
    return JSON.stringify(alpacaEntries, null, 2);
  }
}; 