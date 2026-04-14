import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import * as S from '../styles';
import { FormData } from '../types'; // Assuming types are defined in a central place or ../index.tsx
import { DollarSign, Users, Play, Shield, X, ChevronRight, Sparkles, Lock, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPassSuccessAnimation from '../../../../animations/ContentPassSuccessAnimation';

interface StepReviewProps {
  watch: UseFormWatch<FormData>;
  onConfirm?: () => void; // Optional callback for confirmation
  isLoading?: boolean; // Add loading state prop
  isSuccess?: boolean; // Add success state prop
  onContinue?: () => void; // Callback for when the user clicks continue after success
  submitError?: string | null;
  onBackToVideos?: () => void;
}

// Helper to format currency (can be moved to utils)
const formatCurrency = (amount: number | undefined, currency: string | undefined): string => {
  if (amount === undefined) amount = 0;
  if (currency === undefined) currency = 'USD';
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
  });
  // Assuming price is stored in cents, convert to dollars for display
  return formatter.format(amount / 100);
};

// Helper to extract YouTube video ID (can be moved to utils)
function getYouTubeID(url: string | undefined): string {
  if (!url) return '';
  const regExpWatch = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const regExpShort = /^.*(youtu.be\/)([^#&?]*).*/;
  let match = url.match(regExpWatch);
  if (match && match[2].length === 11) return match[2];
  match = url.match(regExpShort);
  if (match && match[2].length === 11) return match[2];
  return '';
}

const formatDuration = (seconds?: number): string => {
  if (!seconds) return 'Duration unavailable';

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

const getThumbnailUrl = (url?: string, thumbnailUrl?: string) => {
  if (thumbnailUrl) return thumbnailUrl;
  const videoId = getYouTubeID(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : '';
};

const getSourceLabel = (url?: string) => {
  if (!url) return 'Source unavailable';
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return 'youtube.com';
  }
};

const StepReview: React.FC<StepReviewProps> = ({ 
  watch, 
  onConfirm, 
  isLoading,
  isSuccess,
  onContinue,
  submitError,
  onBackToVideos
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const watchedFields = watch();
  const validUrls = watchedFields.src_urls?.filter(u => u?.value?.trim()?.length > 0 && /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/.test(u.value)) || [];

  // Format the price for display
  const formattedPrice = formatCurrency(watchedFields.price_cents, watchedFields.currency || 'USD');

  // Handle the confirm button click
  const handleConfirm = () => {
    setShowConfirmModal(false);
    if (onConfirm) onConfirm();
    // After successful creation (controlled by parent via isSuccess prop)
    // the animation will be shown
  };

  // Show success animation when isSuccess changes to true
  React.useEffect(() => {
    if (isSuccess) {
      setShowSuccessAnimation(true);
    }
  }, [isSuccess]);

  // Handler for when the success animation completes
  const handleAnimationComplete = () => {
    setShowSuccessAnimation(false);
    if (onContinue) onContinue();
  };

  return (
    <>
      {/* Show success animation when submission is successful */}
      {showSuccessAnimation && (
        <ContentPassSuccessAnimation 
          onComplete={handleAnimationComplete}
          passTitle={watchedFields.title || 'Premium Content Pass'}
          passPrice={formattedPrice}
        />
      )}

      <S.ReviewContainer>
        <S.ReviewHeader>
          <motion.div 
            initial={{ opacity: 0, y: -20 }} 
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <S.ReviewTitle>Review Your Premium Content Pass</S.ReviewTitle>
            <S.ReviewSubtitle>You're about to create exclusive content that viewers can purchase access to</S.ReviewSubtitle>
          </motion.div>
        </S.ReviewHeader>

        <S.ReviewGrid>
          {/* Left Column: Pass Details */}
          <motion.div 
            className="space-y-6"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <S.ReviewCard>
              <S.ReviewCardHeader>
                <Shield size={24} className="text-[#fa7517]" />
                <S.ReviewCardTitle>Pass Details</S.ReviewCardTitle>
              </S.ReviewCardHeader>
              
              <S.PassInfo>
                <S.PassTitle>{watchedFields.title || 'Untitled Pass'}</S.PassTitle>
              </S.PassInfo>
              
              <S.Divider />
              
              <S.ReviewDetail>
                <S.ReviewDetailIcon>
                  <DollarSign size={18} />
                </S.ReviewDetailIcon>
                <S.ReviewDetailContent>
                  <S.ReviewDetailLabel>Price</S.ReviewDetailLabel>
                  <S.ReviewDetailValue accent>
                    {formattedPrice}
                  </S.ReviewDetailValue>
                </S.ReviewDetailContent>
              </S.ReviewDetail>
              
              <S.ReviewDetail>
                <S.ReviewDetailIcon>
                  <Users size={18} />
                </S.ReviewDetailIcon>
                <S.ReviewDetailContent>
                  <S.ReviewDetailLabel>Supply Cap</S.ReviewDetailLabel>
                  <S.ReviewDetailValue>
                    {watchedFields.supply_cap || 'Unlimited'} {Number(watchedFields.supply_cap) === 1 ? 'pass' : 'passes'} available
                  </S.ReviewDetailValue>
                </S.ReviewDetailContent>
              </S.ReviewDetail>
              
              <S.ReviewDetail>
                <S.ReviewDetailIcon>
                  <Play size={18} />
                </S.ReviewDetailIcon>
                <S.ReviewDetailContent>
                  <S.ReviewDetailLabel>Content</S.ReviewDetailLabel>
                  <S.ReviewDetailValue>
                    {validUrls.length} video{validUrls.length !== 1 ? 's' : ''} included
                  </S.ReviewDetailValue>
                </S.ReviewDetailContent>
              </S.ReviewDetail>
            </S.ReviewCard>

            {watchedFields.description && (
              <S.ReviewCard>
                <S.ReviewCardHeader>
                  <S.ReviewCardTitle>Description</S.ReviewCardTitle>
                </S.ReviewCardHeader>
                <S.DescriptionContent
                  dangerouslySetInnerHTML={{ __html: watchedFields.description }}
                />
              </S.ReviewCard>
            )}
          </motion.div>

          {/* Right Column: Video Previews */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <S.ReviewCard className="h-full">
              <S.ReviewCardHeader>
                <Play size={24} className="text-[#fa7517]" />
                <S.ReviewCardTitle>Premium Content</S.ReviewCardTitle>
              </S.ReviewCardHeader>
              <p className="mb-4 text-sm text-gray-400">
                Final review uses lightweight source cards. Ownership and unlisted checks still happen when you launch.
              </p>

              <S.VideosGrid>
                {validUrls.length > 0 ? (
                  validUrls.map((urlObj, idx) => (
                    <motion.div 
                      key={`preview-${idx}`}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (idx * 0.1) }}
                    >
                      <S.VideoCard>
                        <S.VideoBadge>Video {idx + 1}</S.VideoBadge>
                        <S.PremiumVideoPreview>
                          {getThumbnailUrl(urlObj.value, urlObj.thumbnail_url) ? (
                            <img
                              src={getThumbnailUrl(urlObj.value, urlObj.thumbnail_url)}
                              alt={urlObj.title || `Video ${idx + 1}`}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <div className="flex h-full items-center justify-center bg-black/40 text-sm text-gray-400">
                              Preview unavailable
                            </div>
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-white">
                                {urlObj.title || `Video ${idx + 1}`}
                              </p>
                              <div className="mt-1 flex items-center gap-3 text-xs text-gray-300">
                                <span>{getSourceLabel(urlObj.value)}</span>
                                <span className="inline-flex items-center gap-1">
                                  <Clock className="h-3.5 w-3.5 text-[#fa7517]" />
                                  {formatDuration(urlObj.duration)}
                                </span>
                              </div>
                            </div>
                            <a
                              href={urlObj.value}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex shrink-0 items-center gap-1 rounded-full border border-white/10 bg-black/40 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:border-white/20 hover:bg-black/55"
                            >
                              <ExternalLink className="h-3.5 w-3.5 text-[#fa7517]" />
                              Open source
                            </a>
                          </div>
                        </S.PremiumVideoPreview>
                        <S.VideoUrl>
                          Launch will verify that this source belongs to your linked channel and is unlisted.
                        </S.VideoUrl>
                      </S.VideoCard>
                    </motion.div>
                  ))
                ) : (
                  <S.NoVideosMessage>No valid video URLs provided.</S.NoVideosMessage>
                )}
              </S.VideosGrid>
            </S.ReviewCard>
          </motion.div>
        </S.ReviewGrid>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          {submitError && (
            <div className="mb-4 rounded-2xl border border-red-500/20 bg-red-500/10 p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-full bg-red-500/15 p-2 text-red-300">
                    <AlertTriangle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="font-medium text-red-200">Launch blocked by validation</p>
                    <p className="mt-1 text-sm text-red-100/90">{submitError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onBackToVideos}
                  className="inline-flex items-center justify-center rounded-full border border-red-200/15 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/5"
                >
                  Back to videos
                </button>
              </div>
            </div>
          )}

          <S.SummaryCard>
            <S.SummaryStat>
              <S.SummaryStatNumber>{validUrls.length}</S.SummaryStatNumber>
              <S.SummaryStatLabel>Video{validUrls.length !== 1 ? 's' : ''}</S.SummaryStatLabel>
            </S.SummaryStat>
            
            <S.SummaryStat>
              <S.SummaryStatNumber>
                {formattedPrice}
              </S.SummaryStatNumber>
              <S.SummaryStatLabel>Price</S.SummaryStatLabel>
            </S.SummaryStat>
            
            <S.SummaryStat>
              <S.SummaryStatNumber>{watchedFields.supply_cap || '∞'}</S.SummaryStatNumber>
              <S.SummaryStatLabel>Supply Cap</S.SummaryStatLabel>
            </S.SummaryStat>
            
            <S.LaunchButton 
              type="button"
              onClick={() => setShowConfirmModal(true)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : 'Launch Content Pass'}
              {!isLoading && <ChevronRight size={18} />}
            </S.LaunchButton>
          </S.SummaryCard>

          <div className="mt-4 rounded-2xl border border-white/8 bg-white/[0.03] p-5">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#fa7517]">
              What Happens Next
            </p>
            <div className="mt-3 space-y-2 text-sm leading-6 text-gray-300">
              <p>1. We create the pass and attach the videos you selected.</p>
              <p>2. The backend verifies that every source belongs to your linked channel and is unlisted.</p>
              <p>3. Buyers then get the pass page and protected access flow.</p>
            </div>
          </div>
        </motion.div>
      </S.ReviewContainer>

      {/* Confirmation Modal */}
      <AnimatePresence>
        {showConfirmModal && (
          <S.ModalOverlay
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <S.ModalContent
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <S.ModalHeader>
                <S.ModalTitle>Ready to Launch Your Exclusive Content</S.ModalTitle>
                <S.ModalCloseButton onClick={() => setShowConfirmModal(false)}>
                  <X size={20} />
                </S.ModalCloseButton>
              </S.ModalHeader>
              
              <S.ModalBody>
                <S.ConfirmIcon className="celebration">
                  <Sparkles size={30} />
                </S.ConfirmIcon>
                
                <S.ConfirmTitle>You're about to create something special!</S.ConfirmTitle>
                
                <S.ConfirmText>
                  Your premium content pass <strong>"{watchedFields.title}"</strong> will be available to an exclusive audience at <strong>{formattedPrice}</strong>.
                </S.ConfirmText>
                
                <S.ConfirmFeatures>
                  <S.ConfirmFeatureItem>
                    <Lock size={18} />
                    <span>Limited to <strong>{watchedFields.supply_cap || 'unlimited'}</strong> passes</span>
                  </S.ConfirmFeatureItem>
                  
                  <S.ConfirmFeatureItem>
                    <Play size={18} />
                    <span><strong>{validUrls.length}</strong> premium video{validUrls.length !== 1 ? 's' : ''}</span>
                  </S.ConfirmFeatureItem>
                </S.ConfirmFeatures>
                
                <S.ModalActions>
                  <S.ModalButton 
                    variant="secondary"
                    onClick={() => setShowConfirmModal(false)}
                  >
                    Not Yet
                  </S.ModalButton>
                  
                  <S.ModalButton 
                    variant="primary"
                    onClick={handleConfirm}
                    disabled={isLoading}
                  >
                    {isLoading ? 'Creating...' : (
                      <>
                        <Sparkles size={16} />
                        Launch My Exclusive Pass
                      </>
                    )}
                  </S.ModalButton>
                </S.ModalActions>
              </S.ModalBody>
            </S.ModalContent>
          </S.ModalOverlay>
        )}
      </AnimatePresence>
    </>
  );
};

export default StepReview;
