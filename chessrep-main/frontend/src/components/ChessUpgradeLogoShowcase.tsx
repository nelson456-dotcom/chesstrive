import React from 'react';
import ChessUpgradeLogo from './ChessUpgradeLogo';

const ChessUpgradeLogoShowcase = () => {
  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-white">Chess Upgrade Logo</h1>
          <p className="text-gray-400">A modern logo for chess training platform</p>
        </div>

        <div className="space-y-8">
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Full Logo Variants</h2>
            <div className="space-y-6">
              <div className="flex items-center gap-8 flex-wrap">
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Large</p>
                  <ChessUpgradeLogo size="large" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Default</p>
                  <ChessUpgradeLogo size="default" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-gray-400">Small</p>
                  <ChessUpgradeLogo size="small" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Icon Only</h2>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Large</p>
                <ChessUpgradeLogo size="large" variant="icon" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Default</p>
                <ChessUpgradeLogo size="default" variant="icon" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Small</p>
                <ChessUpgradeLogo size="small" variant="icon" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">Text Only</h2>
            <div className="flex items-center gap-8 flex-wrap">
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Large</p>
                <ChessUpgradeLogo size="large" variant="text" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Default</p>
                <ChessUpgradeLogo size="default" variant="text" />
              </div>
              <div className="space-y-2">
                <p className="text-sm text-gray-400">Small</p>
                <ChessUpgradeLogo size="small" variant="text" />
              </div>
            </div>
          </div>

          <div className="bg-gray-800 border border-gray-700 rounded-lg p-8">
            <h2 className="text-xl font-semibold mb-6 text-white">On Different Backgrounds</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-900 p-6 rounded-lg border border-gray-700 flex items-center justify-center">
                <ChessUpgradeLogo />
              </div>
              <div className="bg-blue-500/5 p-6 rounded-lg flex items-center justify-center">
                <ChessUpgradeLogo />
              </div>
              <div className="bg-slate-900 p-6 rounded-lg flex items-center justify-center">
                <ChessUpgradeLogo />
              </div>
              <div className="bg-gradient-to-br from-blue-500/10 to-amber-500/10 p-6 rounded-lg flex items-center justify-center">
                <ChessUpgradeLogo />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChessUpgradeLogoShowcase;
