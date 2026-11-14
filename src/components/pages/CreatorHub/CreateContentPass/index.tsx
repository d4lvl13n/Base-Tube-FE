import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { useForm, UseFormReturn } from 'react-hook-form';
import { useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreatePass, usePublishPass, usePassDetails, useUpdateDraftPass } from '../../../../hooks/usePass';
import { useWallet } from '../../../../hooks/useWallet';
import { getPassErrorMessage } from '../../../../utils/passErrorMessages';
import { cx, form, frame, skeleton, surface } from '../Business/businessStyles';
import { FormData, transformFormToApiFormat, validVideoRows } from './types';
import {
  MAX_PER_BUYER_DEFAULT,
  SUPPLY_CAP_DEFAULT,
  defaultMaxPerBuyer,
  maxPerBuyerOf,
  resaleTermsOf,
  supplyCapOf,
} from '../../../../utils/passTerms';
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

/** The wizard's measure: narrower than the management screens, one column of decisions. */
const WIZARD_MEASURE = 'mx-auto max-w-5xl space-y-6 px-4 md:px-6';

const STEP_SLIDE = {
  initial: { opacity: 0, x: 12 },
  animate: { opacity: 1, x: 0, transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } },
  exit: { opacity: 0, x: -12, transition: { duration: 0.18 } },
};

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
  const updateDraft = useUpdateDraftPass();
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
      supply_cap: SUPPLY_CAP_DEFAULT,
      max_per_buyer: MAX_PER_BUYER_DEFAULT,
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
    // A draft from before every pass had a cap has none: leave the field empty
    // (never the 100 default), so the publish step asks for it.
    const draftCap = supplyCapOf(resumeDraft);
    setValue('supply_cap', draftCap ?? undefined);
    setValue('max_per_buyer', maxPerBuyerOf(resumeDraft) ?? (draftCap ? defaultMaxPerBuyer(draftCap) : undefined));
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
        fieldsToValidate = ['title', 'price_cents', 'currency', 'supply_cap', 'max_per_buyer'];
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

  /** "Change" on a term of the Review step: back to the step that sets it. */
  const handleEditStep = (target: number) => {
    setSubmitError(null);
    setStep(Math.max(1, Math.min(4, target)));
  };

  /** A resumed draft with no cap: save the two numbers on the draft, then publishing can go on. */
  const handleSetLimits = async ({ supplyCap, maxPerBuyer }: { supplyCap: number; maxPerBuyer: number }) => {
    if (!createdPassId) return;
    const updated = await updateDraft.mutateAsync({
      passId: createdPassId,
      data: { supply_cap: supplyCap, max_per_buyer: maxPerBuyer },
    });
    const savedCap = supplyCapOf(updated) ?? supplyCap;
    setValue('supply_cap', savedCap);
    setValue('max_per_buyer', maxPerBuyerOf(updated) ?? maxPerBuyer);
    setPublishError(null);
  };

  const resaleTerms = resaleTermsOf(resumeDraft ?? null);

  const stepsMeta = [
    { id: 1, label: 'Basics' },
    { id: 2, label: 'Description' },
    { id: 3, label: 'Content' },
    { id: 4, label: 'Review' },
    { id: 5, label: 'Publish' }
  ];

  const stepSlide = prefersReducedMotion
    ? { initial: { opacity: 0 }, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : STEP_SLIDE;

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
        onEditStep={handleEditStep}
        resaleTerms={resaleTerms}
      />;
      case 5: {
        const values = getValues();
        // A resumed draft has no video rows in the form: count the draft's own videos.
        const formVideoCount = validVideoRows(values.src_urls).length;
        const videoCount = formVideoCount > 0 ? formVideoCount : resumeDraft?.videos?.length ?? 0;
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
              maxPerBuyer: values.max_per_buyer,
              videoCount,
            }}
            onSetLimits={handleSetLimits}
            isSavingLimits={updateDraft.isPending}
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
      <div className={frame.page} aria-busy="true" aria-label="Checking YouTube verification">
        <div className={WIZARD_MEASURE}>
          <div className="space-y-2">
            <div className={cx(skeleton.line, 'h-7 w-48')} />
            <div className={cx(skeleton.line, 'w-72')} />
          </div>
          <div className="flex items-center gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <React.Fragment key={i}>
                {i > 0 && <div className="h-px w-8 bg-gray-800" />}
                <div className={cx(skeleton.block, 'h-6 w-6 rounded-full')} />
                <div className={cx(skeleton.line, 'hidden w-16 sm:block')} />
              </React.Fragment>
            ))}
          </div>
          <div className={cx(surface.card, 'space-y-3 p-5 md:p-6')}>
            <div className={cx(skeleton.line, 'h-4 w-32')} />
            <div className={cx(skeleton.line, 'w-64')} />
            <div className={cx(skeleton.block, 'h-10 w-full')} />
          </div>
          <div className={cx(surface.card, 'space-y-3 p-5 md:p-6')}>
            <div className={cx(skeleton.line, 'h-4 w-20')} />
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-4">
              <div className={cx(skeleton.block, 'h-10')} />
              <div className={cx(skeleton.block, 'h-10 w-40')} />
            </div>
          </div>
          <div className={cx(surface.card, 'space-y-3 p-5 md:p-6')}>
            <div className={cx(skeleton.line, 'h-4 w-40')} />
            <div className={cx(skeleton.line, 'w-3/4')} />
            <div className={cx(skeleton.block, 'h-10 w-1/2')} />
          </div>
        </div>
      </div>
    );
  }

  if (youtubeAuth.status === 'unlinked') {
    return <YouTubeGateCard onVerify={() => youtubeAuth.startOAuth()} />;
  }

  return (
    <main className={frame.page}>
      <TestnetModeBadge topOffsetPx={64} />
      <div className={WIZARD_MEASURE}>
        <header>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold tracking-tight text-white">Create a pass</h1>
            <p className="mt-1 text-sm text-gray-400">
              A pass is limited access to your exclusive videos, resellable on BaseTube. You choose how many exist.
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
              className="pt-1"
            >
              {renderStepContent()}
            </motion.div>
          </AnimatePresence>

          {step < 5 && (
            <div className="mt-6 flex items-center justify-between gap-3 border-t border-gray-800/50 pt-5">
              <span className="sr-only" aria-live="polite">Step {step} of {stepsMeta.length}</span>
              {step > 1 ? (
                <button type="button" onClick={handlePrevStep} className={cx(form.ghostButton, 'h-10')}>
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
                  className={cx(form.primaryButton, 'h-10 px-4')}
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
            className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/80"
          >
            <span
              aria-hidden="true"
              className="h-6 w-6 animate-spin rounded-full border-2 border-gray-800 border-t-[#fa7517] motion-reduce:animate-none"
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
