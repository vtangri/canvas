#!/usr/bin/env python3
"""
save_entry.py - Command-line tool to add journal entries to reflections.json

This script allows users to add journal entries via the command line.
It prompts for all required fields and saves the entry to reflections.json.
"""

import json
import os
from datetime import datetime
import uuid

# Path to the JSON file
JSON_FILE = os.path.join(os.path.dirname(__file__), 'reflections.json')


def load_entries():
    """Load existing entries from reflections.json"""
    if not os.path.exists(JSON_FILE):
        return []
    
    try:
        with open(JSON_FILE, 'r', encoding='utf-8') as f:
            content = f.read().strip()
            if not content:
                return []
            return json.loads(content)
    except json.JSONDecodeError:
        print("Warning: JSON file is corrupted. Starting with empty list.")
        return []
    except Exception as e:
        print(f"Error loading entries: {e}")
        return []


def save_entries(entries):
    """Save entries to reflections.json with pretty formatting"""
    try:
        with open(JSON_FILE, 'w', encoding='utf-8') as f:
            json.dump(entries, f, indent=2, ensure_ascii=False)
        return True
    except Exception as e:
        print(f"Error saving entries: {e}")
        return False


def get_input(prompt, input_type=str, validator=None):
    """Get and validate user input"""
    while True:
        try:
            value = input(prompt).strip()
            if not value:
                print("This field cannot be empty. Please try again.")
                continue
            
            # Convert to appropriate type
            if input_type == int:
                value = int(value)
            
            # Run custom validator if provided
            if validator and not validator(value):
                continue
            
            return value
        except ValueError:
            print(f"Invalid input. Please enter a valid {input_type.__name__}.")
        except KeyboardInterrupt:
            print("\n\nOperation cancelled.")
            exit(0)


def get_technologies():
    """Get technologies used from user"""
    print("\nAvailable technologies:")
    options = ["HTML", "CSS", "JavaScript", "PWA", "Manifest", "Responsive Design", "Python", "JSON"]
    for i, tech in enumerate(options, 1):
        print(f"  {i}. {tech}")
    
    print("\nEnter technology numbers separated by commas (e.g., 1,3,5)")
    print("Or type custom technology names separated by commas:")
    
    while True:
        choice = input("Technologies: ").strip()
        if not choice:
            print("Please select at least one technology.")
            continue
        
        technologies = []
        parts = [p.strip() for p in choice.split(',')]
        
        for part in parts:
            if part.isdigit():
                idx = int(part) - 1
                if 0 <= idx < len(options):
                    technologies.append(options[idx])
                else:
                    print(f"Invalid number: {part}")
            else:
                technologies.append(part)
        
        if technologies:
            return technologies
        print("Please select at least one technology.")


def word_count(text):
    """Count words in text"""
    return len([w for w in text.split() if w])


def main():
    """Main function to add a journal entry"""
    print("=" * 60)
    print("  LEARNING JOURNAL - Add New Entry")
    print("=" * 60)
    print()
    
    # Collect entry data
    week = get_input(
        "Week of Journal (e.g., 15): ",
        int,
        lambda x: x > 0 or print("Week must be positive.")
    )
    
    journal_name = get_input("Journal Name (e.g., Learning Web APIs): ")
    
    # Get date with default to today
    date_str = input(f"Journal Date (YYYY-MM-DD) [default: today]: ").strip()
    if not date_str:
        date_str = datetime.now().strftime("%Y-%m-%d")
    else:
        # Validate date format
        try:
            datetime.strptime(date_str, "%Y-%m-%d")
        except ValueError:
            print("Invalid date format. Using today's date.")
            date_str = datetime.now().strftime("%Y-%m-%d")
    
    task_name = get_input("Task Name (e.g., Built a fetch wrapper): ")
    
    # Get description with word count validation
    while True:
        description = get_input("Task Description (min 10 words): ")
        wc = word_count(description)
        if wc >= 10:
            break
        print(f"Description has only {wc} words. Please write at least 10 words.")
    
    technologies = get_technologies()
    
    # Create entry object
    entry = {
        "id": str(uuid.uuid4()),
        "weekOfJournal": week,
        "journalName": journal_name,
        "journalDate": date_str,
        "taskName": task_name,
        "taskDescription": description,
        "technologies": technologies,
        "timestamp": datetime.now().isoformat()
    }
    
    # Display entry for confirmation
    print("\n" + "=" * 60)
    print("  ENTRY PREVIEW")
    print("=" * 60)
    print(f"Week: {entry['weekOfJournal']}")
    print(f"Name: {entry['journalName']}")
    print(f"Date: {entry['journalDate']}")
    print(f"Task: {entry['taskName']}")
    print(f"Description: {entry['taskDescription']}")
    print(f"Technologies: {', '.join(entry['technologies'])}")
    print("=" * 60)
    
    confirm = input("\nSave this entry? (y/n): ").strip().lower()
    if confirm != 'y':
        print("Entry discarded.")
        return
    
    # Load existing entries and append new one
    entries = load_entries()
    entries.append(entry)
    
    # Save to file
    if save_entries(entries):
        print(f"\n✅ Entry saved successfully!")
        print(f"📁 Total entries: {len(entries)}")
        print(f"📄 File: {JSON_FILE}")
    else:
        print("\n❌ Failed to save entry.")


if __name__ == "__main__":
    main()
