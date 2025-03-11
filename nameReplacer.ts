// @ts-ignore
import { faker } from '@faker-js/faker';

// Class to handle name replacements
export class NameReplacer {
  private nameMap: Map<string, string> = new Map();
  private userNames: Set<string> = new Set();
  private seed: number;
  private userGender: string | null;
  
  constructor(userGender: string | null) {
    this.userGender = userGender;
    // Create a new random seed for each file to ensure different names between files
    this.seed = Math.floor(Math.random() * 1000000);
    faker.seed(this.seed);
  }
  
  // Initialize with user info from JSONL data
  public initialize(entries: any[]): void {
    // Extract user names from the data
    entries.forEach(entry => {
      // Check user_name field
      if (entry.user_name && typeof entry.user_name === 'string') {
        this.userNames.add(entry.user_name.trim());
      }
      // Check chat_metadata for user name
      if (entry.chat_metadata && entry.chat_metadata.user_name && typeof entry.chat_metadata.user_name === 'string') {
        this.userNames.add(entry.chat_metadata.user_name.trim());
      }
      // Check 'name' field with is_user flag
      if (entry.is_user && entry.name && typeof entry.name === 'string') {
        this.userNames.add(entry.name.trim());
      }
    });
    
    // Create replacement names for users
    this.userNames.forEach(name => {
      if (!this.nameMap.has(name)) {
        // Generate a random realistic name based on gender preference
        const replacementName = this.generateRealisticName();
        this.nameMap.set(name, replacementName);
      }
    });
    
    console.log("Detected user names to replace:", [...this.userNames]);
    console.log("Replacement mapping:", Object.fromEntries(this.nameMap));
  }
  
  // Generate a realistic random name using Faker.js
  private generateRealisticName(): string {
    if (this.userGender === null) {
        return Math.random() < 0.5 
        ? faker.person.firstName('male') 
        : faker.person.firstName('female');
    }

    return faker.person.firstName(this.userGender as 'male' | 'female');
  }
  
  // Function to replace names in a text
  public replace(text: string): string {
    let result = text;
    
    // Replace all detected user names with their mapped replacements
    this.nameMap.forEach((replacement, original) => {
      // Use word boundary and case-insensitive flag 'i' to catch all case variations
      const regex = new RegExp(`\\b${this.escapeRegExp(original)}\\b`, 'gi');
      
      // Replace with consideration for capitalization patterns
      result = result.replace(regex, (match) => {
        if (match === match.toUpperCase()) {
          // ALL CAPS -> ALL CAPS
          return replacement.toUpperCase();
        } else if (match[0] === match[0].toUpperCase()) {
          // First letter capitalized -> First letter capitalized
          return replacement.charAt(0).toUpperCase() + replacement.slice(1);
        } else {
          // all lowercase -> all lowercase
          return replacement.toLowerCase();
        }
      });
    });
    
    return result;
  }
  
  // Get a username to use in system messages
  public getRandomUserName(): string {
    // If we have any replacement names, return one of them
    if (this.nameMap.size > 0) {
      const names = Array.from(this.nameMap.values());
      return names[0]; // Just use the first replacement name
    }
    
    // If no replacement names exist, generate a new one
    return this.generateRealisticName();
  }
  
  // Helper function to escape special regex characters
  private escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
} 