import { useState, useCallback } from 'react';
import { getHandleSuggestions, getChannelDescription } from '../api/channel';
import { toast } from 'react-toastify';

interface ChannelAIResult {
  description: string;
  suggestedHandle: string;
}

export const useChannelAI = () => {
  const [isGeneratingHandle, setIsGeneratingHandle] = useState(false);
  const [isGeneratingDescription, setIsGeneratingDescription] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  const generateHandleSuggestions = useCallback(
    async (name: string, context?: { description?: string }) => {
      if (!name.trim()) {
        toast.error('Channel name is required');
        return [];
      }

      setIsGeneratingHandle(true);
      try {
        const response = await getHandleSuggestions(name, context);
        
        if (response.success && Array.isArray(response.suggestions)) {
          setSuggestions(response.suggestions);
          return response.suggestions;
        } else {
          console.warn('Invalid suggestions format:', response);
          setSuggestions([]);
          return [];
        }
      } catch (error) {
        console.error('Handle suggestion error:', error);
        toast.error('Failed to generate handle suggestions');
        setSuggestions([]);
        return [];
      } finally {
        setIsGeneratingHandle(false);
      }
    },
    []
  );

  const generateChannelDescription = useCallback(
    async (name: string, keywords: string, additionalInfo: string): Promise<ChannelAIResult> => {
      console.log('Starting description generation with:', { name, keywords, additionalInfo });
      
      if (!name.trim()) {
        toast.error('Channel name is required');
        return { description: '', suggestedHandle: '' };
      }

      setIsGeneratingDescription(true);
      try {
        console.log('Calling getChannelDescription API...');
        const response = await getChannelDescription(name, { 
          keywords: keywords.split(',').map(k => k.trim()), 
          additionalInfo 
        });
        
        console.log('API Response:', response);

        if (response.success && response.description) {
          const result: ChannelAIResult = {
            description: response.description,
            suggestedHandle: response.originalName || ''
          };
          console.log('Returning generated content:', result);
          return result;
        } else {
          console.error('API returned unsuccessful response:', response);
          throw new Error('Failed to generate description');
        }
      } catch (error) {
        console.error('Description generation error:', error);
        toast.error('Failed to generate channel description');
        return { description: '', suggestedHandle: '' };
      } finally {
        setIsGeneratingDescription(false);
      }
    },
    []
  );

  const clearSuggestions = useCallback(() => {
    setSuggestions([]);
  }, []);

  return {
    isGeneratingHandle,
    isGeneratingDescription,
    suggestions,
    generateHandleSuggestions,
    generateChannelDescription,
    clearSuggestions,
  };
};