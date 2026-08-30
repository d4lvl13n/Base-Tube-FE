import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreatePass, usePublishPass, usePassDetails } from '../../../../hooks/usePass';
import { useWallet } from '../../../../hooks/useWallet';
import { getPassErrorMessage } from '../../../../utils/passErrorMessages';
import { cx, form, motionPresets, page, skeleton } from '../shared/hubStyles';
import { FormData, transformFormToApiFormat } from './types';
import { useYouTubeAuth } from '../../../../hooks/useYouTubeAuth';
import TestnetModeBadge from '../../../pass/TestnetModeBadge';
import type { CreatorSettlementPreference } from '../../../../types/pass';

// Import step components
import StepBasic from './steps/StepBasic';
import StepDescription from './steps/StepDescription';
import StepVideos from './steps/StepVideos';
import StepReview from './steps/StepReview';
import StepPublish from './steps/StepPublish';

// The wizard's own chrome
import WizardStepper from './WizardStepper';
import YouTubeGateCard from './YouTubeGateCard';
import SuccessScreen from './SuccessScreen';

// Helper to format currency
const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
  if (amount === undefined) amount = 0;
  if (currency === undefined) currency = 'USD';

  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });

  return formatter.format(amount / 100);
};

// const tiers = [
//   { id: 'bronze', name: 'Bronze', description: 'Basic tier for standard content' },
//   { id: 'silver', name: 'Silver', description: 'Premium tier with enhanced value' },
//   { id: 'gold', name: 'Gold', description: 'Exclusive tier for your best content' }
// ];

const CreateContentPass: React.FC = () => {
  const prefersReducedMotion = useReducedMotion();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitErrorAction, setSubmitErrorAction] = useState<'link-youtube' | 'verify-channel' | 'link-wallet' | null>(null);
  const [createdPassId, setCreatedPassId] = useState<string | null>(null);
  const [createdPassSlug, setCreatedPassSlug] = useState<string | null>(null);
  const [settlementPreference, setSettlementPreference] = useState<CreatorSettlementPreference | ''>('');
  const [payoutAddress, setPayoutAddress] = useState('');
  const [publishError, setPublishError] = useState<string | null>(null);
  const createPass = useCreatePass();
  const publishPass = usePublishPass();
  const { data: wallet } = useWallet();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const youtubeAuth = useYouTubeAuth();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const resumeDraftId = searchParams.get('draft');
  const { data: resumeDraft } = usePassDetails(resumeDraftId, {
    enabled: Boolean(resumeDraftId),
  });

  // Use react-hook-form for form handling
  const formMethods: UseFormReturn<FormData> = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      price_cents: undefined,
      currency: 'USD',
      supply_cap: 100,
      src_urls: [{ value: '' }]
    },
    mode: 'onChange'
  });

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    trigger,
    getValues,
    formState: { errors }
  } = formMethods;

  // const watchedFields = watch();

  // Refetch YouTube status + creator videos when ?ytLinked=1 is present after OAuth callback
  useEffect(() => {
    if (location.search.includes('ytLinked')) {
      youtubeAuth.refetch();
      queryClient.invalidateQueries({ queryKey: ['youtube', 'creator-videos'] });
    }
  }, [location.search, youtubeAuth, queryClient]);

  useEffect(() => {
    if (!resumeDraft) return;
    setCreatedPassId(resumeDraft.id);
    setCreatedPassSlug(resumeDraft.slug || resumeDraft.id);
    setValue('title', resumeDraft.title || '');
    setValue('description', resumeDraft.description || '');
    setValue('price_cents', resumeDraft.price_cents);
    setValue('currency', resumeDraft.currency || 'USD');
    if (resumeDraft.supply_cap != null) {
      setValue('supply_cap', resumeDraft.supply_cap);
    }
    if (resumeDraft.creator_settlement_preference) {
      setSettlementPreference(resumeDraft.creator_settlement_preference);
    }
    if (resumeDraft.publish_status === 'published') {
      setSuccess(true);
      return;
    }
    setStep(5);
  }, [resumeDraft, setValue]);

  // Handle form submission
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const onSubmit = async (data: FormData) => {
    if (createdPassId) {
      setStep(5);
      return;
    }
    if (hasSubmitted) return; // guard against double-submit
    setHasSubmitted(true);
    setIsLoading(true);
    setSubmitError(null);

    const priceInCents = data.price_cents;

    if (priceInCents === undefined || priceInCents < 100) {
      toast.error('Invalid price entered. Minimum is $1.00');
      setIsLoading(false);
      setHasSubmitted(false);
      return;
    }

    try {
      // Transform form data to API format
      const payload = transformFormToApiFormat(data);

      // Check if we have at least one valid URL
      if (!payload.src_url && (!payload.videos || payload.videos.length === 0)) {
        toast.error('Please provide at least one valid YouTube URL.');
        setIsLoading(false);
        setHasSubmitted(false);
        return;
      }

      const result = await createPass.mutateAsync(payload);

      setCreatedPassId(result.id);
      setCreatedPassSlug(result.slug || result.id);
      setStep(5);
      setIsLoading(false);
    } catch (error: any) {
      console.error('Error creating pass:', error);

      const parsed = getPassErrorMessage(error);
      toast.error(parsed.message);
      setSubmitError(parsed.message);
      setSubmitErrorAction(parsed.action);
      setIsLoading(false);
      setHasSubmitted(false);
    }
  };

  const handlePublish = async () => {
    if (!createdPassId || !settlementPreference) return;
    setPublishError(null);
    try {
      const result = await publishPass.mutateAsync({
        passId: createdPassId,
        data: {
          creator_settlement_preference: settlementPreference,
          ...(payoutAddress.trim() ? { payout_address: payoutAddress.trim() } : {}),
        },
      });
      setCreatedPassSlug(result.slug || createdPassSlug || result.id);
      setSuccess(true);
    } catch (error: unknown) {
      const parsed = getPassErrorMessage(error);
      toast.error(parsed.message);
      setPublishError(parsed.message);
    }
  };

  // Handle animation completion
  const handleSuccessAnimationComplete = () => {
    // After animation completes, move to success state
    setSuccess(true);
    setIsLoading(false);
  };

  const handleNextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    switch (step) {
      case 1:
        fieldsToValidate = ['title', 'price_cents', 'currency', 'supply_cap'];
        break;
      case 2:
        fieldsToValidate = ['description'];
        break;
      case 3:
        fieldsToValidate = ['src_urls'];
        break;
      default:
        break;
    }

    const isValid = await trigger(fieldsToValidate);

    if (isValid) {
      if (step === 3) {
        // Check if we have at least one valid URL
        const urls = getValues('src_urls').map(item => item.value);
        const anyYouTubeUrls = urls.some(url => /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url || ''));
        if (anyYouTubeUrls && youtubeAuth.status !== 'linked') {
          toast.error('Connect your YouTube channel before continuing.');
          return;
        }
        const validUrls = urls.filter(url => url?.trim()?.length > 0 && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url));
        if (validUrls.length === 0) {
          toast.error('Please provide at least one valid YouTube URL.');
          return;
        }
      }
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setSubmitError(null);
    setStep(Math.max(1, step - 1));
  };

  const handleGoToVideosStep = () => {
    setSubmitError(null);
    setStep(3);
  };

  const stepsMeta = [
    { id: 1, label: 'Basics' },
    { id: 2, label: 'Description' },
    { id: 3, label: 'Content' },
    { id: 4, label: 'Review' },
    { id: 5, label: 'Publish' }
  ];

  const stepSlide = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : motionPresets.stepSlide;

  const renderStepContent = () => {
    const props = { register, control, errors, watch, setValue, getValues };
    switch (step) {
      case 1: return <StepBasic {...props} />;
      case 2: return <StepDescription control={control} errors={errors} setValue={setValue} watch={watch} />;
      case 3: return (
        <StepVideos
          register={register}
          errors={errors}
          control={control}
          watch={watch}
          youtubeAuth={youtubeAuth}
        />
      );
      case 4: return <StepReview
        watch={watch}
        onConfirm={handleSubmit(onSubmit)}
        isLoading={isLoading}
        isSuccess={isSubmitSuccess}
        onContinue={handleSuccessAnimationComplete}
        submitError={submitError}
        submitErrorAction={submitErrorAction}
        onStartOAuth={youtubeAuth.startOAuth}
        onBackToVideos={handleGoToVideosStep}
      />;
      case 5: {
        const values = getValues();
        const videoCount = (values.src_urls || []).filter(
          u => u?.value?.trim()?.length > 0 && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(u.value)
        ).length;
        return (
          <StepPublish
            settlementPreference={settlementPreference}
            onSettlementChange={setSettlementPreference}
            payoutAddress={payoutAddress}
            onPayoutAddressChange={setPayoutAddress}
            linkedWallet={wallet?.walletAddress}
            isPublishing={publishPass.isPending}
            publishError={publishError}
            onPublish={handlePublish}
            onBack={handlePrevStep}
            summary={{
              title: values.title,
              priceLabel: formatCurrency(values.price_cents, values.currency || 'USD'),
              supplyCap: values.supply_cap,
              videoCount,
            }}
          />
        );
      }
      default: return null;
    }
  };

  if (success && createdPassId) {
    const passUrl = `/p/${createdPassSlug}`;
    const currentValues = getValues();

    return (
      <SuccessScreen
        title={currentValues.title}
        priceLabel={formatCurrency(currentValues.price_cents, currentValues.currency || 'USD')}
        passUrl={passUrl}
        onViewPass={() => navigate(passUrl)}
        onCreateAnother={() => {
          formMethods.reset();
          setSuccess(false);
          setIsLoading(false);
          setHasSubmitted(false);
          setIsSubmitSuccess(false);
          setSubmitError(null);
          setPublishError(null);
          setSettlementPreference('');
          setPayoutAddress('');
          setStep(1);
          setCreatedPassId(null);
          setCreatedPassSlug(null);
        }}
      />
    );
  }

  // -------- Render gating screens before wizard --------
  if (youtubeAuth.status === 'loading' || youtubeAuth.status === 'unknown') {
    return (
      <div className={page.frame} aria-busy="true" aria-label="Checking YouTube verification">
        <div className={page.narrow}>
          <div className="space-y-2">
            <div className={cx(skeleton.line, 'h-7 w-48')} />
            <div className={cx(skeleton.line, 'w-72')} />
          </div>
          <div className="flex items-center gap-2 border-b border-gray-800/60 pb-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="h-px w-6 bg-gray-800/60" />}
                <div className={cx(skeleton.block, 'h-5 w-20')} />
              </React.Fragment>
            ))}
          </div>
          <div className={cx(form.panel, 'space-y-3')}>
            <div className={cx(skeleton.line, 'h-3 w-20')} />
            <div className={cx(skeleton.block, 'h-9 w-full')} />
            <div className={cx(skeleton.line, 'w-2/3')} />
          </div>
          <div className={cx(form.panel, 'space-y-3')}>
            <div className={cx(skeleton.line, 'h-3 w-28')} />
            <div className="grid grid-cols-2 gap-4">
              <div className={cx(skeleton.block, 'h-9')} />
              <div className={cx(skeleton.block, 'h-9')} />
            </div>
            <div className={cx(skeleton.block, 'h-9 w-1/2')} />
          </div>
        </div>
      </div>
    );
  }

  if (youtubeAuth.status === 'unlinked') {
    return <YouTubeGateCard onVerify={() => youtubeAuth.startOAuth()} />;
  }

  return (
    <main className={page.frame}>
      <TestnetModeBadge topOffsetPx={64} />
      <div className={page.narrow}>
        <header className={page.header}>
          <div className="min-w-0">
            <h1 className={page.title}>Create a pass</h1>
            <p className={page.subtitle}>
              Monetize your exclusive content by creating a premium pass.
            </p>
          </div>
        </header>

        <WizardStepper
          steps={stepsMeta}
          activeStep={step}
          isStepNavigable={(id) => id < step || (id === 5 && Boolean(createdPassId))}
          onStepClick={(targetStep) => {
            if (targetStep < step) {
              setStep(targetStep);
            }
            if (targetStep === 5 && createdPassId) {
              setStep(5);
            }
          }}
        />

        <form onSubmit={(e) => {
          if (step !== 4) {
            e.preventDefault();
            return false;
          }
          return handleSubmit(onSubmit)(e);
        }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={stepSlide.initial}
              animate={stepSlide.animate}
              exit={stepSlide.exit}
              className="pt-2"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {step < 5 && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-800/60 pt-4">
              {step > 1 ? (
                <button type="button" onClick={handlePrevStep} className={form.ghostButton}>
                  <ArrowLeft className="h-4 w-4" aria-hidden="true" />
                  Back
                </button>
              ) : (
                <span />
              )}

              {step < 4 && (
                <button
                  type="button"
                  onClick={handleNextStep}
                  disabled={isLoading || (step === 3 && youtubeAuth.status !== 'linked')}
                  className={form.primaryButton}
                >
                  Continue
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      <AnimatePresence>
        {(isLoading || publishPass.isPending) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: prefersReducedMotion ? 0 : 0.15 }}
            role="status"
            aria-live="polite"
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/60 backdrop-blur-sm"
          >
            <span
              aria-hidden="true"
              className="h-6 w-6 animate-spin rounded-full border-2 border-gray-700 border-t-[#fa7517] motion-reduce:animate-none"
            />
            <p className="text-sm text-gray-300">
              {step >= 5 ? 'Publishing your pass…' : 'Saving your draft…'}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};

export default CreateContentPass;
