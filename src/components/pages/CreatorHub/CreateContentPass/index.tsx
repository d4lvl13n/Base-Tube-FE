import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, UseFormReturn } from 'react-hook-form';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowRight, 
  ArrowLeft, 
  Video,
  Link as LinkIcon,
  Shield,
  Check,
  Info,
  Copy,
  Twitter,
  Facebook,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';
import { useCreatePass } from '../../../../hooks/usePass';
// import { CreatePassRequest } from '../../../../types/pass';
import * as S from './styles';
import { FormData, transformFormToApiFormat } from './types';
import { useYouTubeAuth } from '../../../../hooks/useYouTubeAuth';
import TestnetModeBadge from '../../../pass/TestnetModeBadge';

// Import step components
import StepBasic from './steps/StepBasic';
import StepDescription from './steps/StepDescription';
import StepVideos from './steps/StepVideos';
import StepReview from './steps/StepReview';

// Import the common StepIndicator
import StepIndicator from '../../../common/StepIndicator';

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
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitSuccess, setIsSubmitSuccess] = useState(false);
  const [success, setSuccess] = useState(false);
  const [createdPassId, setCreatedPassId] = useState<string | null>(null);
  const [createdPassSlug, setCreatedPassSlug] = useState<string | null>(null);
  const createPass = useCreatePass();
  const navigate = useNavigate();
  const youtubeAuth = useYouTubeAuth();
  const location = useLocation();
  
  // Use react-hook-form for form handling
  const formMethods: UseFormReturn<FormData> = useForm<FormData>({
    defaultValues: {
      title: '',
      description: '',
      price_cents: undefined,
      currency: 'USD',
      tier: 'bronze',
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
  
  // Refetch YouTube status when ?ytLinked=1 is present after OAuth callback
  useEffect(() => {
    if (location.search.includes('ytLinked')) {
      youtubeAuth.refetch();
    }
  }, [location.search, youtubeAuth]);
  
  // Handle form submission
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const onSubmit = async (data: FormData) => {
    if (hasSubmitted) return; // guard against double-submit
    setHasSubmitted(true);
    setIsLoading(true);
    
    const priceInCents = data.price_cents;
    
    if (priceInCents === undefined || priceInCents < 100) {
      toast.error('Invalid price entered. Minimum is $1.00');
      setIsLoading(false);
      return;
    }

    try {
      // Transform form data to API format
      const payload = transformFormToApiFormat(data);
      
      // Check if we have at least one valid URL
      if (!payload.src_url && (!payload.videos || payload.videos.length === 0)) {
        toast.error('Please provide at least one valid YouTube URL.');
        setIsLoading(false);
        return;
      }

      const result = await createPass.mutateAsync(payload);
      
      setCreatedPassId(result.id);
      setCreatedPassSlug(result.id);
      
      // Set isSubmitSuccess to trigger animation in StepReview
      setIsSubmitSuccess(true);
      
      // No toast here, the animation is the feedback
    } catch (error: any) {
      console.error('Error creating pass:', error);
      
      // Attempt to extract a specific message from the API response
      let message = 'Failed to create content pass. Please try again.'; // Default message
      if (error.response && error.response.data) {
        // Look for common error message structures
        message = error.response.data.message || error.response.data.error || message;
        // Handle potential array of errors (e.g., validation errors)
        if (Array.isArray(error.response.data.errors) && error.response.data.errors.length > 0) {
          message = error.response.data.errors.map((err: any) => err.msg || err.message || 'Invalid input').join(', ');
        }
      }
      
      toast.error(message);
      setIsLoading(false);
      setHasSubmitted(false);
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
        fieldsToValidate = ['title', 'tier', 'price_cents', 'currency'];
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
    setStep(Math.max(1, step - 1));
  };
  
  const stepsMeta = [
    { id: 1, label: 'Basic Info', icon: Shield },
    { id: 2, label: 'Description', icon: Info },
    { id: 3, label: 'Content', icon: Video },
    { id: 4, label: 'Review', icon: Check }
  ];
  
  const renderStepContent = () => {
    const props = { register, control, errors, watch, setValue, getValues };
    switch (step) {
      case 1: return <StepBasic {...props} />;
      case 2: return <StepDescription control={control} errors={errors} />;
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
      />;
      default: return null;
    }
  };
  
  if (success && createdPassId) {
    const passUrl = `/p/${createdPassSlug}`;
    const currentValues = getValues();
    
    return (
      <main className="flex-1 pt-4 md:pt-8 px-4 md:px-6">
            <S.Container 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
            >
              <S.SuccessContainer
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <S.SuccessIcon
                  initial={{ scale: 0.8, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.4, type: 'spring' }}
                >
                  <Check size={40} />
                </S.SuccessIcon>
                
                <S.Title>Content Pass Created!</S.Title>
            <S.SubTitle>Your exclusive content is now ready to be shared</S.SubTitle>
                
                <S.Card className="mt-8 max-w-xl mx-auto">
                  <S.SummaryRow>
                    <S.SummaryLabel>Pass Title</S.SummaryLabel>
                <S.SummaryValue>{currentValues.title}</S.SummaryValue>
                  </S.SummaryRow>
                  <S.SummaryRow>
                    <S.SummaryLabel>Tier</S.SummaryLabel>
                <div><S.TierBadge tier={currentValues.tier || 'bronze'}>{currentValues.tier || 'bronze'}</S.TierBadge></div>
                  </S.SummaryRow>
                  <S.SummaryRow>
                    <S.SummaryLabel>Price</S.SummaryLabel>
                <S.SummaryPrice>{formatCurrency(currentValues.price_cents, currentValues.currency || 'USD')}</S.SummaryPrice>
                  </S.SummaryRow>
                  <S.SummaryRow>
                    <S.SummaryLabel>Pass URL</S.SummaryLabel>
                    <div className="flex items-center gap-2">
                      <S.SummaryValue className="text-blue-400">{window.location.origin}{passUrl}</S.SummaryValue>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(`${window.location.origin}${passUrl}`);
                          toast.success('URL copied to clipboard!');
                        }}
                        className="p-1 hover:bg-gray-800 rounded-full transition-colors"
                      >
                        <Copy size={14} />
                      </button>
                    </div>
                  </S.SummaryRow>
                </S.Card>
                
                <S.ShareContainer>
                  <S.ShareButton
                    onClick={() => {
                      window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out my exclusive content on Base.Tube: ${window.location.origin}${passUrl}`)}`);
                    }}
                  >
                    <Twitter size={16} />
                    Share on Twitter
                  </S.ShareButton>
                  
                  <S.ShareButton
                    onClick={() => {
                      window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`${window.location.origin}${passUrl}`)}`);
                    }}
                  >
                    <Facebook size={16} />
                    Share on Facebook
                  </S.ShareButton>
                  
                  <S.ShareButton
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}${passUrl}`);
                      toast.success('URL copied to clipboard!');
                    }}
                  >
                    <Copy size={16} />
                    Copy Link
                  </S.ShareButton>
                </S.ShareContainer>
                
                <div className="mt-8 flex gap-4 justify-center">
                  <S.Button
                    variant="secondary"
                    onClick={() => navigate(passUrl)}
                    whileHover={{ scale: 1.02 }}
                  >
                    <Shield size={16} />
                    View Pass
                  </S.Button>
                  
                  <S.Button
                    variant="primary"
                    onClick={() => {
                  formMethods.reset();
                      setSuccess(false);
                      setStep(1);
                      setCreatedPassId(null);
                      setCreatedPassSlug(null);
                    }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <LinkIcon size={16} />
                    Create Another Pass
                  </S.Button>
                </div>
              </S.SuccessContainer>
            </S.Container>
          </main>
    );
  }
  
  // -------- Render gating screens before wizard --------
  if (youtubeAuth.status === 'loading' || youtubeAuth.status === 'unknown') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white pt-16">
        <div className="text-xl animate-pulse">Checking YouTube verification…</div>
      </div>
    );
  }

  if (youtubeAuth.status === 'unlinked') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white p-6 pt-16">
        <S.Card className="max-w-lg w-full">
          <div className="flex flex-col items-center gap-6">
            <Lock size={48} className="text-[#fa7517]" />
            <h2 className="text-2xl font-semibold text-center">Let's quickly verify your YouTube channel</h2>
            
            <div className="text-left space-y-4 w-full">
              <div>
                <h3 className="font-medium text-lg text-[#fa7517] mb-1">Why?</h3>
                <p className="text-gray-300">
                  We do a quick check with YouTube so everyone knows the videos really belong to you. No surprises, no copyright headaches.
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-[#fa7517] mb-1">What will happen next?</h3>
                <ol className="text-gray-300 list-decimal pl-5 space-y-2">
                  <li>We'll pop you over to Google for a sec</li>
                  <li>You pick the channel you want to use</li>
                  <li>Google sends you right back here</li>
                  <li>That's it — start making passes!</li>
                </ol>
              </div>
              
              <div>
                <h3 className="font-medium text-lg text-[#fa7517] mb-1">Important notes:</h3>
                <ul className="text-gray-300 list-disc pl-5 space-y-1">
                  <li>We never (and can't) post or edit anything on your channel</li>
                  <li>Only <strong>unlisted</strong> videos can be added to a pass</li>
                  <li>Change your mind? Disconnect with one click later</li>
                </ul>
              </div>
            </div>
            
            <S.Button
              variant="primary"
              onClick={youtubeAuth.startOAuth}
              whileHover={{ scale: 1.02 }}
              className="mt-2 px-6 py-3 text-lg"
            >
              Verify YouTube Channel
            </S.Button>
          </div>
        </S.Card>
      </div>
    );
  }
  
  return (
    <main className="flex-1 pt-4 md:pt-8 px-4 md:px-6">
          <TestnetModeBadge topOffsetPx={64} />
          <S.Container 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }}
          >
            <S.PageHeader>
              <S.Title>Create Content Pass</S.Title>
              <S.SubTitle>
            Monetize your exclusive content by creating a premium pass
              </S.SubTitle>
            </S.PageHeader>
            
        <div className="mb-12">
          <StepIndicator 
            steps={stepsMeta.map(s => ({ key: s.id.toString(), icon: s.icon, label: s.label }))}
            activeStep={step.toString()}
            onStepClick={(stepKey) => {
              const targetStep = parseInt(stepKey);
              if (targetStep < step) {
                setStep(targetStep);
              }
            }}
          />
                </div>
            
            <form onSubmit={(e) => {
              if (step < 4) {
                e.preventDefault();
                return false;
              }
              return handleSubmit(onSubmit)(e);
            }}>
              <S.FormContainer
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <AnimatePresence mode="wait">
                    <motion.div
                 key={step}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                 transition={{ duration: 0.3 }}
              >
                {renderStepContent()}
                    </motion.div>
                </AnimatePresence>
                
                <S.NavigationContainer>
                  {step > 1 && (
                    <S.Button
                      type="button"
                      variant="secondary"
                  onClick={handlePrevStep}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <ArrowLeft size={16} />
                      Previous
                    </S.Button>
                  )}
                  
              {step < stepsMeta.length ? (
                    <S.Button
                      type="button"
                      variant="primary"
                      onClick={handleNextStep}
                      disabled={isLoading || (step === 3 && youtubeAuth.status !== 'linked')}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      style={{ marginLeft: 'auto' }}
                    >
                      Next
                      <ArrowRight size={16} />
                    </S.Button>
                  ) : (
                    <div style={{ marginLeft: 'auto' }}></div>
                  )}
                </S.NavigationContainer>
              </S.FormContainer>
            </form>
          </S.Container>
      
      <AnimatePresence>
        {isLoading && (
          <S.LoaderOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <S.Spinner 
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            />
            <S.LoaderText>Creating your content pass...</S.LoaderText>
          </S.LoaderOverlay>
        )}
      </AnimatePresence>
    </main>
  );
};

export default CreateContentPass;
