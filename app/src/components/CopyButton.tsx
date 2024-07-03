// src/components/CopyButton.tsx
import React from 'react';
import { ClipboardIcon } from '@radix-ui/react-icons';

interface CopyButtonProps {
  textToCopy: string;
}

const CopyButton: React.FC<CopyButtonProps> = ({ textToCopy }) => {
  const handleCopy = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        alert('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy: ', error);
      }
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = textToCopy;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Text copied to clipboard');
      } catch (error) {
        console.error('Failed to copy: ', error);
      }
      document.body.removeChild(textArea);
    }
  };

  return (
    <button onClick={handleCopy} className="absolute top-2 right-2 text-white p-2 rounded">
      <ClipboardIcon className="h-6 w-6 text-black" />
    </button>
  );
};

export default CopyButton;
