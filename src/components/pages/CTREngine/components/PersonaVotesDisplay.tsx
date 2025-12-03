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
      className={`p-5 rounded-xl border backdrop-blur-sm transition-all ${
        vote.wouldClick
          ? 'bg-emerald-500/10 border-emerald-500/20 hover:border-emerald-500/40'
          : 'bg-red-500/10 border-red-500/20 hover:border-red-500/40'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            vote.wouldClick 
              ? 'bg-emerald-500/20 border border-emerald-500/30' 
              : 'bg-red-500/20 border border-red-500/30'
          }`}>
            {vote.wouldClick ? (
              <ThumbsUp className="w-5 h-5 text-emerald-400" />
            ) : (
              <ThumbsDown className="w-5 h-5 text-red-400" />
            )}
          </div>
          <div>
            <h4 className="font-semibold text-white">{vote.personaName}</h4>
            <p className="text-xs text-gray-500">{vote.personaDescription}</p>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold ${
          vote.wouldClick
            ? 'bg-emerald-500/20 text-emerald-400'
            : 'bg-red-500/20 text-red-400'
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
      <div className="mb-3">
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-gray-500">Confidence</span>
          <span className={vote.wouldClick ? 'text-emerald-400' : 'text-red-400'}>
            {vote.confidence}%
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={vote.wouldClick ? 'bg-emerald-500' : 'bg-red-500'}
            initial={{ width: 0 }}
            animate={{ width: `${vote.confidence}%` }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.5 }}
            style={{ height: '100%' }}
          />
        </div>
      </div>
      
      {/* Reasoning Quote */}
      <div className="flex items-start gap-2 pt-3 border-t border-white/10">
        <MessageSquare className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
        <p className="text-sm text-gray-400 italic">"{vote.reasoning}"</p>
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
      color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' 
    },
    strong: { 
      text: 'Strong consensus', 
      color: 'text-blue-400 bg-blue-500/20 border-blue-500/30' 
    },
    mixed: { 
      text: 'Mixed opinions', 
      color: 'text-[#fa7517] bg-[#fa7517]/20 border-[#fa7517]/30' 
    },
    divided: { 
      text: 'Opinions divided', 
      color: 'text-orange-400 bg-orange-500/20 border-orange-500/30' 
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
      <div className="flex items-center justify-between p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#fa7517]/20 to-orange-500/20 flex items-center justify-center border border-[#fa7517]/30">
            <Users className="w-6 h-6 text-[#fa7517]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              Persona Analysis
              <span className="text-2xl">{consensusIcon}</span>
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {wouldClickCount}/{votes.votes.length} personas would click
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${consensus.color}`}>
            <Target className="w-4 h-4" />
            <span className="font-semibold">{consensus.text}</span>
          </div>
          <div className="mt-2 text-sm">
            <span className="text-gray-500">Aggregate: </span>
            <span className="text-white font-bold">{votes.aggregateScore.toFixed(1)}</span>
          </div>
        </div>
      </div>
      
      {/* Individual Votes Grid */}
      <div className="grid md:grid-cols-2 gap-4">
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
    <div className={`flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl ${className}`}>
      <span className="text-2xl">{getConsensusIcon(votes.consensusLevel)}</span>
      <div className="flex-1">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-400">Persona Approval</span>
          <span className="text-white font-semibold">{wouldClickCount}/{totalCount}</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              percentage >= 70
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                : percentage >= 50
                ? 'bg-gradient-to-r from-[#fa7517] to-orange-400'
                : 'bg-gradient-to-r from-red-500 to-red-400'
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
