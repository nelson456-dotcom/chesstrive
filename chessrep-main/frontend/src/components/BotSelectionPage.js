import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Crown, User, Clock, Play } from 'lucide-react';

const BotSelectionPage = () => {
  const navigate = useNavigate();
  
  const [gameSettings, setGameSettings] = useState({
    selectedBot: null,
    playerColor: 'white',
    timeControl: 'blitz',
    timeInMinutes: 5
  });

  const availableBots = [
    {
      id: 'alex',
      name: 'Alex',
      elo: 800,
      avatar: '/images/bot-beginner.png',
      description: 'Learning the basics',
      hoverDescription: 'Alex is just starting out in chess. A great opponent for beginners who want to practice fundamental moves and tactics without too much pressure.'
    },
    {
      id: 'jordan',
      name: 'Jordan',
      elo: 1200,
      avatar: '/images/bot-casual.png',
      description: 'Casual player',
      hoverDescription: 'Jordan plays casually and understands basic openings and tactics. Perfect for players looking to improve their middlegame understanding.'
    },
    {
      id: 'morgan',
      name: 'Morgan',
      elo: 1600,
      avatar: '/images/bot-intermediate.png',
      description: 'Solid fundamentals',
      hoverDescription: 'Morgan has solid chess fundamentals and can punish mistakes. A challenging opponent for intermediate players working on consistency.'
    },
    {
      id: 'taylor',
      name: 'Taylor',
      elo: 2000,
      avatar: '/images/bot-advanced.png',
      description: 'Strong tactical player',
      hoverDescription: 'Taylor is a strong tactical player with excellent position evaluation. Expect sharp, tactical games with creative combinations.'
    },
    {
      id: 'sam',
      name: 'Sam',
      elo: 2400,
      avatar: '/images/bot-expert.png',
      description: 'Master-level play',
      hoverDescription: 'Sam plays at master level with deep strategic understanding and flawless tactics. Only for advanced players seeking a serious challenge.'
    }
  ];

  const timeControls = [
    { id: 'bullet', name: 'Bullet', description: '1-2 minutes', defaultTime: 1 },
    { id: 'blitz', name: 'Blitz', description: '3-5 minutes', defaultTime: 5 },
    { id: 'rapid', name: 'Rapid', description: '10-15 minutes', defaultTime: 10 },
    { id: 'classical', name: 'Classical', description: '30+ minutes', defaultTime: 30 }
  ];

  const startGame = () => {
    if (!gameSettings.selectedBot) {
      alert('Please select a bot to play against!');
      return;
    }

    // Navigate to the game page with settings
    navigate('/bot-game', { 
      state: { 
        bot: gameSettings.selectedBot,
        color: gameSettings.playerColor,
        timeControl: gameSettings.timeControl,
        timeInMinutes: gameSettings.timeInMinutes
      } 
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50">
      <div className="max-w-4xl mx-auto p-6">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4 flex items-center justify-center gap-3">
            <Bot className="text-blue-600" size={40} />
            Play with Bot
          </h1>
          <p className="text-gray-600 text-lg">Choose your opponent and game settings</p>
        </div>

        {/* Bot Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <Crown className="text-yellow-500" size={24} />
            Select Your Opponent
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {availableBots.map((bot) => (
              <div
                key={bot.id}
                className={`group relative p-6 border-2 rounded-xl cursor-pointer transition-all hover:shadow-lg ${
                  gameSettings.selectedBot?.id === bot.id
                    ? 'border-blue-500 bg-gradient-to-br from-blue-50 to-blue-100 shadow-md'
                    : 'border-gray-200 hover:border-blue-300 bg-white'
                }`}
                onClick={() => setGameSettings(prev => ({ ...prev, selectedBot: bot }))}
                title={bot.hoverDescription}
              >
                <div className="text-center relative">
                  <div className="relative inline-block mb-3">
                    <img 
                      src={bot.avatar} 
                      alt={bot.name}
                      className="mx-auto w-20 h-20 rounded-full object-cover border-3 border-gray-300 shadow-sm"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                    <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 hidden items-center justify-center">
                      <Bot className="text-white" size={40} />
                    </div>
                    {gameSettings.selectedBot?.id === bot.id && (
                      <div className="absolute -top-1 -right-1 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-xs font-bold">✓</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-bold text-lg text-gray-900 mb-1">{bot.name}</h3>
                  <p className="text-sm text-gray-600 mb-3 min-h-[40px]">{bot.description}</p>
                  <div className="flex items-center justify-center gap-2">
                    <div className="text-xs font-semibold bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1.5 rounded-full shadow-sm">
                      {bot.elo} ELO
                    </div>
                  </div>
                  
                  {/* Hover Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10 pointer-events-none">
                    <div className="font-semibold mb-1">{bot.name} ({bot.elo} ELO)</div>
                    <p className="text-gray-300 leading-relaxed">{bot.hoverDescription}</p>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1 border-4 border-transparent border-t-gray-900"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Color Selection */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <User className="text-green-500" size={24} />
            Choose Your Color
          </h2>
          <div className="flex gap-4 justify-center">
            {['white', 'black'].map((color) => (
              <button
                key={color}
                className={`px-6 py-3 rounded-lg border-2 transition-all ${
                  gameSettings.playerColor === color
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setGameSettings(prev => ({ ...prev, playerColor: color }))}
              >
                <div className="flex items-center gap-2">
                  <div className={`w-6 h-6 rounded-full border-2 ${
                    color === 'white' ? 'bg-white border-gray-400' : 'bg-gray-800 border-gray-600'
                  }`} />
                  <span className="capitalize font-medium text-gray-800">{color}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Time Control */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2 text-gray-800">
            <Clock className="text-purple-500" size={24} />
            Time Control
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {timeControls.map((control) => (
              <button
                key={control.id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  gameSettings.timeControl === control.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300 bg-white'
                }`}
                onClick={() => setGameSettings(prev => ({
                  ...prev,
                  timeControl: control.id,
                  timeInMinutes: control.defaultTime
                }))}
              >
                <h3 className="font-semibold text-gray-800">{control.name}</h3>
                <p className="text-sm text-gray-600">{control.description}</p>
              </button>
            ))}
          </div>
          
          <div className="flex items-center justify-center gap-4">
            <label className="font-medium text-gray-800">Custom time (minutes):</label>
            <input
              type="number"
              min="1"
              max="180"
              value={gameSettings.timeInMinutes}
              onChange={(e) => setGameSettings(prev => ({ 
                ...prev, 
                timeInMinutes: parseInt(e.target.value) || 10 
              }))}
              className="px-3 py-2 border rounded-lg w-20 text-center text-gray-800 bg-white"
            />
          </div>
        </div>

        {/* Start Game Button */}
        <div className="text-center">
          <button
            onClick={startGame}
            disabled={!gameSettings.selectedBot}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all shadow-lg ${
              gameSettings.selectedBot
                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 hover:shadow-xl transform hover:scale-105'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play className="inline mr-2" size={20} />
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};

export default BotSelectionPage;




