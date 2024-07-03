// src/components/JsonOutputWithCopyButton.tsx
import React from 'react';
import CopyButton from './CopyButton';

interface JsonOutputWithCopyButtonProps {
  json: object;
}

const JsonOutputWithCopyButton: React.FC<JsonOutputWithCopyButtonProps> = ({ json }) => {
  return (
    <div className="relative p-4 bg-gray-100 rounded overflow-x-auto whitespace-pre max-h-96">
      <CopyButton textToCopy={JSON.stringify(json, null, 2)} />
      <pre className="p-4 pt-8 bg-gray-100 rounded overflow-x-auto whitespace-pre max-h-96">
        {JSON.stringify(json, null, 2)}
      </pre>
      <style jsx>{`
        div {
          position: relative;
        }
        button {
          position: absolute;
          top: 8px;
          right: 8px;
        }
      `}</style>
    </div>
  );
};

export default JsonOutputWithCopyButton;
