import React from 'react';

const MarkdownRenderer = ({ content }) => {
  const renderMarkdown = (text) => {
    if (!text) return '';

    // Convert markdown to HTML
    let html = text;

    // Headers
    html = html.replace(/^### (.*$)/gim, '<h3 class="text-lg font-bold text-gray-800 mt-4 mb-2">$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2 class="text-xl font-bold text-gray-800 mt-4 mb-2">$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1 class="text-2xl font-bold text-gray-800 mt-4 mb-2">$1</h1>');

    // Bold
    html = html.replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>');
    
    // Italic
    html = html.replace(/\*(.+?)\*/g, '<em class="italic text-gray-800">$1</em>');
    
    // Underline
    html = html.replace(/__(.+?)__/g, '<u class="underline text-gray-800">$1</u>');
    
    // Code
    html = html.replace(/`(.+?)`/g, '<code class="bg-gray-100 text-purple-600 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>');
    
    // Images (must come before links)
    html = html.replace(/!\[([^\]]*)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="max-w-full h-auto rounded-lg my-4 shadow-md" />');
    
    // Links
    html = html.replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-purple-600 hover:text-purple-700 underline" target="_blank" rel="noopener noreferrer">$1</a>');
    
    // Blockquotes
    html = html.replace(/^&gt; (.+$)/gim, '<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-2 bg-gray-50 text-gray-700 italic">$1</blockquote>');
    html = html.replace(/^> (.+$)/gim, '<blockquote class="border-l-4 border-purple-500 pl-4 py-2 my-2 bg-gray-50 text-gray-700 italic">$1</blockquote>');
    
    // Unordered lists
    html = html.replace(/^\- (.+$)/gim, '<li class="ml-6 list-disc text-gray-700">$1</li>');
    
    // Ordered lists
    html = html.replace(/^\d+\. (.+$)/gim, '<li class="ml-6 list-decimal text-gray-700">$1</li>');
    
    // Line breaks
    html = html.replace(/\n/g, '<br />');

    return html;
  };

  return (
    <div
      className="prose max-w-none text-gray-700 leading-relaxed"
      dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
      style={{ color: '#374151' }}
    />
  );
};

export default MarkdownRenderer;

