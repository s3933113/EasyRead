
import React, { useState } from 'react';
import { Key, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ApiKeyInputProps {
  apiKey: string;
  onApiKeyChange: (key: string) => void;
}

const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ apiKey, onApiKeyChange }) => {
  const [showKey, setShowKey] = useState(false);
  const [isEditing, setIsEditing] = useState(!apiKey);

  if (!isEditing && apiKey) {
    return (
      <div className="flex items-center space-x-2">
        <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
          <Key className="w-4 h-4 text-green-600" />
          <span className="text-sm text-green-600 font-medium">API Key Set</span>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsEditing(true)}
        >
          Change
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      <div className="relative">
        <Input
          type={showKey ? 'text' : 'password'}
          placeholder="Enter OpenAI API Key"
          value={apiKey}
          onChange={(e) => onApiKeyChange(e.target.value)}
          className="w-64 pr-10"
        />
        <Button
          variant="ghost"
          size="sm"
          className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
          onClick={() => setShowKey(!showKey)}
        >
          {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </Button>
      </div>
      {apiKey && (
        <Button
          size="sm"
          onClick={() => setIsEditing(false)}
          className="bg-green-600 hover:bg-green-700"
        >
          Save
        </Button>
      )}
    </div>
  );
};

export default ApiKeyInput;
