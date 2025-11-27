#!/bin/bash

# Script to automatically rename lookbook images to 1.jpg, 2.jpg, etc.
# Usage: Run this script after placing your images in public/lookbook/

LOOKBOOK_DIR="public/lookbook"

# Create directory if it doesn't exist
mkdir -p "$LOOKBOOK_DIR"

# Check if directory is empty
if [ -z "$(ls -A $LOOKBOOK_DIR 2>/dev/null)" ]; then
    echo "❌ No images found in $LOOKBOOK_DIR"
    echo ""
    echo "📋 Instructions:"
    echo "1. Place your 13 lookbook images in: $LOOKBOOK_DIR"
    echo "2. Run this script again: ./rename-lookbook-images.sh"
    echo ""
    echo "The script will automatically rename them to 1.jpg, 2.jpg, 3.jpg, etc."
    exit 1
fi

# Count images
IMAGE_COUNT=$(find "$LOOKBOOK_DIR" -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | wc -l | tr -d ' ')

if [ "$IMAGE_COUNT" -eq 0 ]; then
    echo "❌ No image files found in $LOOKBOOK_DIR"
    echo "Please add .jpg, .jpeg, .png, or .webp files to the folder"
    exit 1
fi

echo "✅ Found $IMAGE_COUNT image(s) in $LOOKBOOK_DIR"
echo "🔄 Renaming images..."

# Create temporary directory for renamed files
TEMP_DIR="$LOOKBOOK_DIR/.temp_rename"
mkdir -p "$TEMP_DIR"

# Get all image files and sort them
counter=1
find "$LOOKBOOK_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) | sort | while read -r file; do
    # Get file extension (lowercase)
    ext="${file##*.}"
    ext=$(echo "$ext" | tr '[:upper:]' '[:lower:]')
    
    # Convert to jpg extension for consistency
    if [ "$ext" != "jpg" ]; then
        # If it's not jpg, we'll convert the extension
        new_name="$LOOKBOOK_DIR/$counter.jpg"
    else
        new_name="$LOOKBOOK_DIR/$counter.jpg"
    fi
    
    # Move to temp first to avoid conflicts
    temp_name="$TEMP_DIR/$counter.jpg"
    cp "$file" "$temp_name"
    
    echo "  📸 $(basename "$file") → $counter.jpg"
    counter=$((counter + 1))
done

# Move files back from temp
mv "$TEMP_DIR"/* "$LOOKBOOK_DIR/" 2>/dev/null
rmdir "$TEMP_DIR" 2>/dev/null

# Remove old files (keep only numbered ones)
find "$LOOKBOOK_DIR" -maxdepth 1 -type f \( -iname "*.jpg" -o -iname "*.jpeg" -o -iname "*.png" -o -iname "*.webp" \) ! -name "[0-9]*.jpg" -delete 2>/dev/null

echo ""
echo "✅ Done! Images renamed to 1.jpg, 2.jpg, 3.jpg, etc."
echo "📁 Check: $LOOKBOOK_DIR"

