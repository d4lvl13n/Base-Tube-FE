import React, { useState } from 'react';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Info, Sparkles } from 'lucide-react';
import * as S from '../styles';
import { FormData } from '../types';
import RichTextEditor from '../../../../../components/common/RichTextEditor';
import AIAssistantPanel from '../../../../../components/common/AIAssistantPanel';
import { useChannelAI } from '../../../../../hooks/useChannelAI';
import { toast } from 'react-toastify';

interface StepDescriptionProps {
  control: Control<FormData>;
  errors: FieldErrors<FormData>;
  setValue: UseFormSetValue<FormData>;
  watch: UseFormWatch<FormData>;
}

const StepDescription: React.FC<StepDescriptionProps> = ({ control, errors, setValue, watch }) => {
  const [isAIPanelOpen, setIsAIPanelOpen] = useState(false);
  const [keywords, setKeywords] = useState('');
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [generatedDescription, setGeneratedDescription] = useState<string | undefined>();
  const watchedTitle = watch('title') || '';

  const { generateChannelDescription, isGeneratingDescription } = useChannelAI();

  const handleGenerateDescription = async () => {
    if (!watchedTitle.trim()) {
      toast.error('Please enter a pass title first');
      return;
    }

    const { description } = await generateChannelDescription(watchedTitle, keywords, additionalInfo);
    if (!description) {
      return;
    }

    setGeneratedDescription(description);
    setValue('description', description, {
      shouldValidate: true,
      shouldDirty: true
    });
  };

  return (
    <>
      <S.FormGroup>
        <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <S.Label htmlFor="description" className="mb-0">Description *</S.Label>
          <button
            type="button"
            onClick={() => setIsAIPanelOpen(true)}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-[#fa7517]/30 bg-[#fa7517]/10 px-4 py-2 text-sm font-medium text-[#fa7517] transition-all hover:bg-[#fa7517]/15"
          >
            <Sparkles className="h-4 w-4" />
            Write With AI
          </button>
        </div>
        <Controller
          name="description"
          control={control}
          rules={{
            required: 'Description is required',
            minLength: {
              value: 20,
              message: 'Description must be at least 20 characters'
            }
          }}
          render={({ field }) => (
            <RichTextEditor
              content={field.value || ''}
              onChange={field.onChange}
              placeholder="Describe your premium content in detail. What will subscribers get? Why is it valuable? Be compelling!"
              minHeight="300px"
            />
          )}
        />
        {errors.description && (
          <S.ErrorText>{errors.description.message}</S.ErrorText>
        )}
      </S.FormGroup>

      <S.InfoBox>
        <Info size={24} className="text-[#fa7517]" />
        <div>
          <h4 className="mb-2 font-medium">Write a Compelling Description</h4>
          <S.InfoText>
            A great description is key to selling your content pass. Be specific about what viewers get, why it is premium, and who this pass is for.
          </S.InfoText>
          <S.InfoText>
            If you want a draft quickly, use the AI assistant and then refine the final version in the editor.
          </S.InfoText>
        </div>
      </S.InfoBox>

      <AIAssistantPanel
        isOpen={isAIPanelOpen}
        onClose={() => setIsAIPanelOpen(false)}
        title={watchedTitle}
        keywords={keywords}
        additionalInfo={additionalInfo}
        onKeywordsChange={setKeywords}
        onAdditionalInfoChange={setAdditionalInfo}
        onGenerate={handleGenerateDescription}
        isGenerating={isGeneratingDescription}
        generatedDescription={generatedDescription}
        mode="pass"
      />
    </>
  );
};

export default StepDescription;
