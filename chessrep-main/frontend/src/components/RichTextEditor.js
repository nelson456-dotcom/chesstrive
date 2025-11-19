import React, { useState } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link,
  Code,
  Quote,
  Heading1,
  Heading2,
  Image as ImageIcon
} from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, rows = 4, disabled = false, onImageUpload }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [uploading, setUploading] = useState(false);
  const textareaRef = React.useRef(null);
  const fileInputRef = React.useRef(null);

  const applyFormat = (prefix, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const beforeText = value.substring(0, start);
    const afterText = value.substring(end);

    let newText;
    if (selectedText) {
      newText = beforeText + prefix + selectedText + suffix + afterText;
    } else {
      newText = beforeText + prefix + suffix + afterText;
    }

    onChange(newText);

    // Set cursor position after formatting
    setTimeout(() => {
      const newCursorPos = start + prefix.length + (selectedText ? selectedText.length : 0);
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  const formatButtons = [
    { icon: Bold, label: 'Bold', action: () => applyFormat('**', '**'), shortcut: 'Ctrl+B' },
    { icon: Italic, label: 'Italic', action: () => applyFormat('*', '*'), shortcut: 'Ctrl+I' },
    { icon: Underline, label: 'Underline', action: () => applyFormat('__', '__'), shortcut: 'Ctrl+U' },
    { icon: Code, label: 'Code', action: () => applyFormat('`', '`'), shortcut: 'Ctrl+E' },
    { icon: Quote, label: 'Quote', action: () => applyFormat('> '), shortcut: 'Ctrl+>' },
    { icon: List, label: 'Bullet List', action: () => applyFormat('- '), shortcut: '' },
    { icon: ListOrdered, label: 'Numbered List', action: () => applyFormat('1. '), shortcut: '' },
    { icon: Heading1, label: 'Heading 1', action: () => applyFormat('# '), shortcut: '' },
    { icon: Heading2, label: 'Heading 2', action: () => applyFormat('## '), shortcut: '' },
    { icon: Link, label: 'Link', action: () => applyFormat('[', '](url)'), shortcut: 'Ctrl+K' }
  ];

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setUploading(true);
    try {
      // Convert to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target.result;
        if (onImageUpload) {
          onImageUpload(imageUrl);
        }
        // Insert image markdown
        const imageMarkdown = `\n![Image](${imageUrl})\n`;
        onChange(value + imageMarkdown);
        setUploading(false);
      };
      reader.onerror = () => {
        alert('Failed to read image file');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
      setUploading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key.toLowerCase()) {
        case 'b':
          e.preventDefault();
          applyFormat('**', '**');
          break;
        case 'i':
          e.preventDefault();
          applyFormat('*', '*');
          break;
        case 'u':
          e.preventDefault();
          applyFormat('__', '__');
          break;
        case 'e':
          e.preventDefault();
          applyFormat('`', '`');
          break;
        case 'k':
          e.preventDefault();
          applyFormat('[', '](url)');
          break;
        default:
          break;
      }
    }
  };

  return (
    <div className={`border rounded-lg ${isFocused ? 'ring-2 ring-purple-500 border-purple-500' : 'border-gray-300'} transition-all`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 p-2 border-b border-gray-200 bg-gray-50 rounded-t-lg flex-wrap">
        {formatButtons.map((button, index) => (
          <button
            key={index}
            type="button"
            onClick={button.action}
            disabled={disabled}
            className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title={`${button.label}${button.shortcut ? ` (${button.shortcut})` : ''}`}
          >
            <button.icon className="w-4 h-4 text-gray-700" />
          </button>
        ))}
        
        {/* Image Upload Button */}
        <div className="ml-2 border-l border-gray-300 pl-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
            disabled={disabled || uploading}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="p-2 hover:bg-gray-200 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Upload Image"
          >
            <ImageIcon className="w-4 h-4 text-gray-700" />
          </button>
        </div>
      </div>

      {/* Text Area */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        rows={rows}
        disabled={disabled}
        className="w-full p-3 resize-none focus:outline-none rounded-b-lg text-gray-900 placeholder-gray-400 bg-white disabled:bg-gray-100"
        style={{
          color: '#1f2937',
          backgroundColor: '#ffffff'
        }}
      />

      {/* Help Text */}
      <div className="px-3 py-2 bg-gray-50 border-t border-gray-200 rounded-b-lg">
        <p className="text-xs text-gray-500">
          💡 Tip: Use markdown formatting. Select text and click buttons or use keyboard shortcuts.
        </p>
      </div>
    </div>
  );
};

export default RichTextEditor;

