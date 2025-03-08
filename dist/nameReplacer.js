"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NameReplacer = void 0;
// @ts-ignore
const faker_1 = require("@faker-js/faker");
// Class to handle name replacements
class NameReplacer {
    constructor(userGender) {
        this.nameMap = new Map();
        this.userNames = new Set();
        this.userGender = userGender;
        // Create a new random seed for each file to ensure different names between files
        this.seed = Math.floor(Math.random() * 1000000);
        faker_1.faker.seed(this.seed);
    }
    // Initialize with user info from JSONL data
    initialize(entries) {
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
    generateRealisticName() {
        if (this.userGender === null) {
            return Math.random() < 0.5
                ? faker_1.faker.person.firstName('male')
                : faker_1.faker.person.firstName('female');
        }
        return faker_1.faker.person.firstName(this.userGender);
    }
    // Function to replace names in a text
    replace(text) {
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
                }
                else if (match[0] === match[0].toUpperCase()) {
                    // First letter capitalized -> First letter capitalized
                    return replacement.charAt(0).toUpperCase() + replacement.slice(1);
                }
                else {
                    // all lowercase -> all lowercase
                    return replacement.toLowerCase();
                }
            });
        });
        return result;
    }
    // Helper function to escape special regex characters
    escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
}
exports.NameReplacer = NameReplacer;
