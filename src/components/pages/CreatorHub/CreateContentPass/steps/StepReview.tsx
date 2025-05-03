import React, { useState } from 'react';
import { UseFormWatch } from 'react-hook-form';
import * as S from '../styles';
import { FormData } from '../types'; // Assuming types are defined in a central place or ../index.tsx
import { Check, DollarSign, Users, Play, Shield, AlertTriangle, X, ChevronRight, Sparkles, Crown, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ContentPassSuccessAnimation from '../../../../animations/ContentPassSuccessAnimation';

interface StepReviewProps {
  watch: UseFormWatch<FormData>;
  onConfirm?: () => void; // Optional callback for confirmation
  isLoading?: boolean; // Add loading state prop
  isSuccess?: boolean; // Add success state prop
  onContinue?: () => void; // Callback for when the user clicks continue after success
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

const StepReview: React.FC<StepReviewProps> = ({ 
  watch, 
  onConfirm, 
  isLoading,
  isSuccess,
  onContinue
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
                <S.PassTierBadge tier={watchedFields.tier || 'bronze'}>
                  {watchedFields.tier || 'bronze'} tier
                </S.PassTierBadge>
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
                    {watchedFields.supply_cap || 'Unlimited'} {parseInt(String(watchedFields.supply_cap)) === 1 ? 'pass' : 'passes'} available
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
                          <iframe
                            src={`https://www.youtube.com/embed/${getYouTubeID(urlObj.value) || ''}`}
                            width="100%"
                            height="100%"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            title={`Video Preview ${idx + 1}`}
                          ></iframe>
                        </S.PremiumVideoPreview>
                        <S.VideoUrl>{urlObj.value}</S.VideoUrl>
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
                    <Crown size={18} />
                    <span>Exclusive <strong>{watchedFields.tier}</strong> tier content</span>
                  </S.ConfirmFeatureItem>
                  
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
