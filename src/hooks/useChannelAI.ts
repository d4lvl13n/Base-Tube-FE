// src/hooks/useChannelAI.ts

import { useState, useCallback } from 'react';
import { getHandleSuggestions, getChannelDescription } from '../api/channel';
import { toast } from 'react-toastify';

interface UseChannelAIProps {
  onError?: (error: string) => void;
}

export const useChannelAI = ({ onError = (msg) => toast.error(msg) }: UseChannelAIProps = {}) => {
  const [isGeneratingHandle, setIsGeneratingHandle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateHandleSuggestions = useCallback(
    async (name: string, context?: { type?: string; description?: string }) => {
      if (!name.trim()) {
        onError('Channel name is required');
        return [];
      }

      setIsGeneratingHandle(true);
      try {
        const response = await getHandleSuggestions(name, context);
        if (response.success && response.suggestions) {
          setSuggestions(response.suggestions);
          return response.suggestions;
        } else {
          throw new Error(response.message || 'Failed to get suggestions');
        }
      } catch (error) {
        console.error('Handle suggestion error:', error);
        onError('Failed to generate handle suggestions');
        return [];
      } finally {
        setIsGeneratingHandle(false);
      }
    },
    [onError]
  );

  const generateDescription = useCallback(
    async (
      name: string,
      context?: {
        type?: string;
        keywords?: string[];
        additionalInfo?: string;
      }
    ) => {
      if (!name.trim()) {
        onError('Channel name is required');
        return null;
      }

      // Clean up context
      const cleanContext = {
        ...context,
        keywords: context?.keywords?.filter((kw) => kw && kw.trim()),
        additionalInfo: context?.additionalInfo?.trim(),
      };

      setIsGeneratingDescription(true);
      try {
        const response = await getChannelDescription(name, cleanContext);
        if (response.success && response.description) {
          return response.description;
        } else {
          throw new Error(response.message || 'Failed to generate description');
        }
      } catch (error) {
        console.error('Description generation error:', error);
        onError('Failed to generate channel description');
        return null;
      } finally {
        setIsGeneratingDescription(false);
      }
    },
    [onError]
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    isGeneratingHandle,
    isGeneratingDescription,
    suggestions,
    generateHandleSuggestions,
    generateDescription,
    clearSuggestions,
  };
};