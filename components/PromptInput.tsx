import React from 'react';
import { MagicWandIcon } from '../constants';

interface PromptInputProps {
  prompt: string;
  setPrompt: (prompt: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  isReady: boolean;
}

const PromptInput: React.FC<PromptInputProps> = ({ prompt, setPrompt, onSubmit, isLoading, isReady }) => {
  return (
    <div className="w-full space-y-4">
      <textarea
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
        placeholder="Describe a luxury background... e.g., 'a minimalist marble set with soft morning light' or 'an opulent ballroom with crystal chandeliers'"
        className="w-full h-28 p-3 bg-gray-800 border border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all placeholder-gray-500"
        disabled={isLoading}
      />
      <button
        onClick={onSubmit}
        disabled={!isReady || isLoading}
        className="w-full flex items-center justify-center px-4 py-3 font-bold text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:bg-gray-500 disabled:cursor-not-allowed transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-purple-500"
      >
        <MagicWandIcon />
        {isLoading ? 'Generating...' : 'Apply Edit'}
      </button>
    </div>
  );
};

export default PromptInput;