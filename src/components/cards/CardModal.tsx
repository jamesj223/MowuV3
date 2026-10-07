import React from 'react';
import { PlaytestCard } from './PlaytestCard';
import type { ActivePermanent, ResolvedEvent } from '@/types/card';
import { X, Sparkles } from 'lucide-react';

interface CardModalProps {
  card: ActivePermanent | ResolvedEvent | null;
  onClose: () => void;
  isNewDraw?: boolean;
}

export const CardModal: React.FC<CardModalProps> = ({ card, onClose, isNewDraw = false }) => {
  if (!card) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col items-center max-w-lg w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Draw announcement banner if drawn on turn */}
        {isNewDraw && (
          <div className="flex items-center gap-2 mb-3 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-medium text-sm shadow-lg animate-bounce">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Opponent played a card!</span>
          </div>
        )}

        {/* Detailed Card Frame */}
        <PlaytestCard
          name={card.name}
          manaCost={'manaCost' in card ? card.manaCost : ''}
          typeLine={card.typeLine}
          artFile={card.artFile}
          renderedText={card.renderedText}
          flavorText={'flavorText' in card ? card.flavorText : undefined}
          power={'power' in card ? card.power : undefined}
          toughness={'toughness' in card ? card.toughness : undefined}
          variant="detailed"
          size="lg"
        />

        {/* Dismiss / Continue button */}
        <button
          onClick={onClose}
          className="mt-4 px-6 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-medium border border-neutral-600 shadow-lg cursor-pointer transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-xs"
        >
          <X className="w-4 h-4" />
          <span>Dismiss / Continue (Space / Esc)</span>
        </button>
      </div>
    </div>
  );
};
