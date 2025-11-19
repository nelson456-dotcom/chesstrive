import React from "react";
import { ChessFeaturesSectionWithHoverEffects } from "./ui/chess-feature-section-with-hover-effects";

function ChessFeaturesSectionWithHoverEffectsDemo() {
  return (
    <div className="w-full bg-gray-900">
      <div className="text-center mb-8 py-12">
        <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl mb-4">
          Master Chess with Our Complete Training Suite
        </h1>
        <p className="text-lg text-gray-300 max-w-3xl mx-auto">
          Whether you're a beginner learning the basics or an advanced player refining your technique, our comprehensive chess platform has everything you need to improve your game.
        </p>
      </div>
      <ChessFeaturesSectionWithHoverEffects />
    </div>
  );
}

export { ChessFeaturesSectionWithHoverEffectsDemo };
