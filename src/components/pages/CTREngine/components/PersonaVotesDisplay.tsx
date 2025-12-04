// src/components/pages/CTREngine/components/PersonaVotesDisplay.tsx
// Premium persona voting results display

import React from 'react';
import { motion } from 'framer-motion';
import { Users, ThumbsUp, ThumbsDown, Target, CheckCircle, XCircle, MessageSquare } from 'lucide-react';
import { PersonaVotes, PersonaVote } from '../../../../types/ctr';
import { getConsensusIcon } from '../../../../api/ctr';

interface PersonaVotesDisplayProps {
  votes: PersonaVotes;
  className?: string;
}

const PersonaVoteCard: React.FC<{
  vote: PersonaVote;
  index: number;
}> = ({ vote, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + index * 0.1 }}
      className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm transition-all hover:border-gray-800/50 relative overflow-hidden"
      style={{
        boxShadow: `
          0 0 20px 5px rgba(250, 117, 23, 0.1),
          0 0 40px 10px rgba(250, 117, 23, 0.05),
          inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
        `
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vote.wouldClick 
              ? 'bg-[#fa7517]/20 border border-[#fa7517]/30' 
              : 'bg-gray-800/50 border border-gray-700/30'
          }`}>
            {vote.wouldClick ? (
              <ThumbsUp className="w-5 h-5 text-[#fa7517]" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white">{vote.personaName}</h4>
            <p className="text-xs text-gray-500 mt-0.5">{vote.personaDescription}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
          vote.wouldClick
            ? 'bg-[#fa7517]/20 text-[#fa7517]'
            : 'bg-gray-800/50 text-gray-400'
        }`}>
          {vote.wouldClick ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Would click
            </>
          ) : (
            <>
              <XCircle className="w-4 h-4" />
              Pass
            </>
          )}
        </div>
      </div>
      
      {/* Confidence Bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs mb-2">
          <span className="text-gray-500">Confidence</span>
          <span className={vote.wouldClick ? 'text-[#fa7517]' : 'text-gray-400'}>
            {vote.confidence}%
          </span>
        </div>
        <div className="h-2 bg-black/60 border border-gray-800/50 rounded-full overflow-hidden">
          <motion.div
            className={vote.wouldClick ? 'bg-gradient-to-r from-[#fa7517] to-orange-500' : 'bg-gray-600'}
            initial={{ width: 0 }}
            animate={{ width: `${vote.confidence}%` }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            style={{ height: '100%' }}
          />
        </div>
      </div>
      
      {/* Reasoning Quote */}
      <div className="flex items-start gap-2 pt-4 border-t border-gray-800/30">
        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-300 leading-relaxed">"{vote.reasoning}"</p>
      </div>
    </motion.div>
  );
};

export const PersonaVotesDisplay: React.FC<PersonaVotesDisplayProps> = ({
  votes,
  className = '',
}) => {
  const consensusIcon = getConsensusIcon(votes.consensusLevel);
  
  const consensusConfig = {
    unanimous: { 
      text: 'All personas agree', 
      color: 'text-[#fa7517] bg-[#fa7517]/20 border-[#fa7517]/30' 
    },
    strong: { 
      text: 'Strong consensus', 
      color: 'text-[#fa7517] bg-[#fa7517]/20 border-[#fa7517]/30' 
    },
    mixed: { 
      text: 'Mixed opinions', 
      color: 'text-[#fa7517] bg-[#fa7517]/20 border-[#fa7517]/30' 
    },
    divided: { 
      text: 'Opinions divided', 
      color: 'text-gray-400 bg-gray-800/50 border-gray-700/30' 
    },
  };
  
  const wouldClickCount = votes.votes.filter((v) => v.wouldClick).length;
  const consensus = consensusConfig[votes.consensusLevel];
  
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4 }}
      className={`space-y-5 ${className}`}
    >
      {/* Summary Header */}
      <div className="p-6 rounded-xl bg-black/50 border border-gray-800/30 backdrop-blur-sm relative overflow-hidden"
        style={{
          boxShadow: `
            0 0 20px 5px rgba(250, 117, 23, 0.1),
            0 0 40px 10px rgba(250, 117, 23, 0.05),
            inset 0 0 60px 15px rgba(250, 117, 23, 0.03)
          `
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
              <Users className="w-6 h-6 text-[#fa7517]" />
            </div>
            <div>
              <h3 className="text-xl font-semibold text-white flex items-center gap-2">
                Persona Analysis
                <span className="text-2xl">{consensusIcon}</span>
              </h3>
              <p className="text-sm text-gray-400 mt-1">
                {wouldClickCount}/{votes.votes.length} personas would click • Aggregate score: <span className="text-[#fa7517] font-semibold">{votes.aggregateScore.toFixed(1)}</span>
              </p>
            </div>
          </div>
          
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${consensus.color}`}>
            <Target className="w-4 h-4" />
            <span className="font-semibold">{consensus.text}</span>
          </div>
        </div>
      </div>
      
      {/* Individual Votes Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {votes.votes.map((vote, index) => (
          <PersonaVoteCard key={index} vote={vote} index={index} />
        ))}
      </div>
    </motion.div>
  );
};

// Compact version for inline display
export const PersonaVotesSummary: React.FC<{
  votes: PersonaVotes;
  className?: string;
}> = ({ votes, className = '' }) => {
  const wouldClickCount = votes.votes.filter((v) => v.wouldClick).length;
  const totalCount = votes.votes.length;
  const percentage = Math.round((wouldClickCount / totalCount) * 100);
  
  return (
    <div className={`flex items-center gap-4 p-4 bg-black/50 border border-gray-800/30 rounded-xl backdrop-blur-sm ${className}`}>
      <span className="text-2xl">{getConsensusIcon(votes.consensusLevel)}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Persona Approval</span>
          <span className="text-white font-semibold">{wouldClickCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-black/60 border border-gray-800/50 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              percentage >= 50
                ? 'bg-gradient-to-r from-[#fa7517] to-orange-500'
                : 'bg-gray-600'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.6 }}
          />
        </div>
      </div>
    </div>
  );
};

export default PersonaVotesDisplay;
