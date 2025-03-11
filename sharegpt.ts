import { NameReplacer } from './nameReplacer';
import { FormatConverter } from './converter';
import fs from 'fs';
import path from 'path';

export interface ShareGPTMessage {
  from: 'human' | 'gpt' | 'system';
  value: string;
}

export interface ShareGPTConversation {
  conversations: ShareGPTMessage[];
}

export interface ShareGPTMetadata {
  characterName?: string;
  userName?: string;
}

/**
 * ShareGPT format converter implementation
 */
export const ShareGPTConverter: FormatConverter<ShareGPTConversation, ShareGPTMessage> = {
  /**
   * Extract metadata from SillyTavern entries, specifically looking for character info
   */
  extractMetadata(entries: any[]): ShareGPTMetadata {
    const metadata: ShareGPTMetadata = {};
    
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
   * Converts a SillyTavern entry to ShareGPT format
   */
  convertEntry(entry: any, includeReasoning: boolean, nameReplacer: NameReplacer | null, metadata?: ShareGPTMetadata): ShareGPTMessage {
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
   * Process all messages and create a JSONL format string
   * Each file will contain one conversation
   */
  serializeEntry(entriesOrConversation: ShareGPTMessage[] | ShareGPTConversation, metadata?: ShareGPTMetadata, nameReplacer?: NameReplacer | null): string {
    // If it's already a ShareGPTConversation, just stringify it
    if (!Array.isArray(entriesOrConversation)) {
      return JSON.stringify(entriesOrConversation);
    }
    
    // Otherwise, it's an array of messages
    const entries = entriesOrConversation;
    
    // Check if we already have a system message
    if (!entries.some(entry => entry.from === 'system')) {
      // Get system message from config
      let systemMessage = 'You are a character in a roleplay scenario. Respond in character, maintaining the established tone and style.';
      
      try {
        // Read the config file
        const configPath = path.join(process.cwd(), 'config.json');
        if (fs.existsSync(configPath)) {
          const configData = fs.readFileSync(configPath, 'utf-8');
          const config = JSON.parse(configData);
          
          // Get the system message for ShareGPT if it exists
          if (config.systemMessages && config.systemMessages.sharegpt) {
            systemMessage = config.systemMessages.sharegpt;
          }
        }
      } catch (error) {
        console.log('Error reading config file. Using default system message.');
      }
      
      // Check if system message contains the placeholders
      const hasCharacterNamePlaceholder = systemMessage.includes('{characterName}');
      const hasUserNamePlaceholder = systemMessage.includes('{userName}');
      
      // Replace placeholder with character name if available
      if (hasCharacterNamePlaceholder) {
        if (metadata?.characterName) {
          systemMessage = systemMessage.replace(/{characterName}/g, metadata.characterName);
        } else {
          // If no character name is available, remove the placeholder
          systemMessage = systemMessage.replace(/{characterName}/g, 'a');
        }
      }
      
      // Replace placeholder with user name if available
      if (hasUserNamePlaceholder) {
        if (metadata?.userName) {
          systemMessage = systemMessage.replace(/{userName}/g, metadata.userName);
        } else if (nameReplacer !== null && nameReplacer !== undefined) {
          // Get a random user name from the nameReplacer
          const replacedName = nameReplacer.getRandomUserName();
          systemMessage = systemMessage.replace(/{userName}/g, replacedName);
        } else {
          // If no user name is available, remove the placeholder
          systemMessage = systemMessage.replace(/{userName}/g, 'User');
        }
      }
      
      entries.unshift({
        from: 'system',
        value: systemMessage
      });
    }
    
    // For JSONL format, we create a single conversation object
    const conversation: ShareGPTConversation = {
      conversations: entries
    };
    
    // Return the JSON string of the entire conversation 
    // For JSONL, we just need a single line since each file represents one conversation
    return JSON.stringify(conversation);
  }
}; 