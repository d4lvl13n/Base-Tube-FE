import React, { useState } from 'react';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Sparkles } from 'lucide-react';
import { form } from '../../Business/businessStyles';
import { FieldError, FieldHelp, FieldLabel, WizardCard, describedBy } from '../wizardUi';
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
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* ── Description ────────────────────────────────────────────────── */}
      <WizardCard
        id="description-card"
        title="Describe the pass"
        description="The sales page shows this under the title. Say what fans get and who it is for."
        aside={
          <button type="button" onClick={() => setIsAIPanelOpen(true)} className={form.inlineAction}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Write with AI
          </button>
        }
      >
        <FieldLabel id="description-label">Description</FieldLabel>
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
            <div
              id="description"
              className={form.editorFrame}
              aria-labelledby="description-label"
              aria-describedby={describedBy('description-help', errors.description && 'description-error')}
            >
              <RichTextEditor
                content={field.value || ''}
                onChange={field.onChange}
                placeholder="Describe your premium content in detail. What will fans get? Why is it worth it?"
                minHeight="300px"
              />
            </div>
          )}
        />
        <FieldError id="description-error">{errors.description?.message}</FieldError>
        <div className="mt-1.5 flex justify-between gap-3">
          <FieldHelp id="description-help" className="mt-0">At least 20 characters.</FieldHelp>
          {generatedDescription && <span className="text-xs text-gray-400">AI draft applied</span>}
        </div>
      </WizardCard>

      {/* ── Guidance + the AI drawer ───────────────────────────────────── */}
      <div className="space-y-4">
        <WizardCard id="writing-tips" title="Write a description that sells">
          <ul className="space-y-2.5 text-sm leading-relaxed text-gray-400">
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
              Be specific about what viewers get, why it is premium, and who this pass is for.
            </li>
            <li className="flex gap-2.5">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gray-500" aria-hidden="true" />
              If you want a draft quickly, use the AI assistant, then refine the final version in the editor.
            </li>
          </ul>
        </WizardCard>

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
      </div>
    </div>
  );
};

export default StepDescription;
