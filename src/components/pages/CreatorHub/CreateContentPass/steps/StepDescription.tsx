import React, { useState } from 'react';
import { Control, Controller, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form';
import { Sparkles } from 'lucide-react';
import { cx, form, page } from '../../shared/hubStyles';
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
    <div className={form.grid}>
      {/* ── Description ────────────────────────────────────────────────── */}
      <section className={cx(form.panel, 'space-y-1.5')} aria-label="Description">
        <div className="flex items-center justify-between gap-3">
          <span id="description-label" className={form.fieldLabel}>Description</span>
          <button type="button" onClick={() => setIsAIPanelOpen(true)} className={form.inlineAction}>
            <Sparkles className="h-3.5 w-3.5" aria-hidden="true" />
            Write with AI
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
            <div id="description" className={form.editorFrame} aria-labelledby="description-label">
              <RichTextEditor
                content={field.value || ''}
                onChange={field.onChange}
                placeholder="Describe your premium content in detail. What will subscribers get? Why is it valuable? Be compelling!"
                minHeight="300px"
              />
            </div>
          )}
        />
        <div className="flex justify-between">
          <span className={form.counter}>At least 20 characters</span>
          {generatedDescription && <span className={form.counter}>AI draft applied</span>}
        </div>
        {errors.description && (
          <p className={form.errorText}>{errors.description.message}</p>
        )}
      </section>

      {/* ── Guidance + the AI drawer ───────────────────────────────────── */}
      <div className="space-y-4">
        <section className={cx(form.panel, 'space-y-2')} aria-label="Writing tips">
          <p className={page.eyebrow}>Write a compelling description</p>
          <p className="text-sm text-gray-400">
            A great description is key to selling your content pass. Be specific about what viewers get, why it is premium, and who this pass is for.
          </p>
          <p className="text-sm text-gray-400">
            If you want a draft quickly, use the AI assistant and then refine the final version in the editor.
          </p>
        </section>

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
