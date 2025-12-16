import React, { useState } from 'react';
import { GameSettings } from '../types';

interface MainMenuProps {
  onStart: (settings: GameSettings) => void;
}

const MainMenu: React.FC<MainMenuProps> = ({ onStart }) => {
  const [menuState, setMenuState] = useState<'MAIN' | 'SETTINGS'>('MAIN');

  const handleStartSolo = () => {
    onStart({ duration: 60, playerCount: 1 });
  };

  const handleStartDuo = () => {
    onStart({ duration: 60, playerCount: 2 });
  };

  // Background floating items
  const bgItems = ['🍞', '🍅', '🥬', '🧀', '🍖', '🥓', '🍳', '🥒', '🧅', '🥑'];

  return (
    <div className="relative flex flex-col items-center justify-center min-h-screen bg-orange-50 text-gray-800 p-4 font-sans select-none overflow-hidden">
       {/* Background Pattern */}
       <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
           style={{ 
             backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
             backgroundPosition: '0 0, 20px 20px',
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Falling Ingredients Animation */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {Array.from({ length: 20 }).map((_, i) => (
            <div 
                key={i}
                className="absolute text-4xl opacity-30 animate-float"
                style={{
                    left: `${Math.random() * 100}%`,
                    top: `-10%`,
                    animationDuration: `${5 + Math.random() * 10}s`,
                    animationDelay: `${Math.random() * 5}s`,
                    animationIterationCount: 'infinite',
                    transform: `rotate(${Math.random() * 360}deg)`
                }}
            >
                {bgItems[Math.floor(Math.random() * bgItems.length)]}
            </div>
        ))}
        <style>{`
          @keyframes float {
            0% { transform: translateY(-20vh) rotate(0deg); opacity: 0; }
            10% { opacity: 0.3; }
            90% { opacity: 0.3; }
            100% { transform: translateY(120vh) rotate(360deg); opacity: 0; }
          }
          .animate-float {
            animation-name: float;
            animation-timing-function: linear;
          }
        `}</style>
      </div>

      <div className="bg-white/90 backdrop-blur-sm p-8 rounded-[40px] shadow-2xl max-w-md w-full border-8 border-orange-200 relative z-10">
        <div className="text-center mb-8">
            {/* Emojis removed here */}
            <h1 className="text-5xl font-black text-orange-500 tracking-wider drop-shadow-sm mt-4">疊不夠博士</h1>
            <p className="text-gray-400 font-bold mt-2">食材接住！三明治疊高高！</p>
        </div>

        {menuState === 'MAIN' && (
          <div className="flex flex-col gap-4">
            <button 
              onClick={handleStartSolo}
              className="w-full py-4 bg-orange-400 hover:bg-orange-500 text-white rounded-2xl font-bold text-2xl transition transform hover:scale-105 shadow-md border-b-4 border-orange-600"
            >
              單人挑戰
            </button>
            <button 
              onClick={handleStartDuo}
              className="w-full py-4 bg-blue-400 hover:bg-blue-500 text-white rounded-2xl font-bold text-2xl transition transform hover:scale-105 shadow-md border-b-4 border-blue-600 flex items-center justify-center gap-2"
            >
              <span>👯</span> 雙人對戰
            </button>
            <button 
              onClick={() => setMenuState('SETTINGS')}
              className="w-full py-3 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-2xl font-bold transition border-2 border-stone-200"
            >
              遊戲說明
            </button>
          </div>
        )}

        {menuState === 'SETTINGS' && (
          <div className="flex flex-col gap-4">
            <h2 className="text-2xl font-bold text-center text-orange-500">博士的教學</h2>
            
            <div className="bg-orange-50 p-5 rounded-2xl text-left text-sm text-stone-600 space-y-3 font-medium border-2 border-orange-100">
               <p>1. <strong>單人</strong>：方向鍵移動。</p>
               <p>2. <strong>雙人 P1</strong>：WASD 移動。</p>
               <p>3. <strong>雙人 P2</strong>：方向鍵移動。</p>
               <p>4. <strong>目標</strong>：依照食譜從下往上接食材。</p>
               <p>5. <strong>小心</strong>：避開毒藥 ☠️ 和炸彈 💣。</p>
               <p>6. <strong>注意</strong>：吃到安眠藥 💊 會睡著 5 秒！</p>
            </div>

            <button 
              onClick={() => setMenuState('MAIN')}
              className="w-full py-3 bg-stone-400 hover:bg-stone-500 text-white rounded-2xl font-bold mt-2 shadow border-b-4 border-stone-600"
            >
              我知道了
            </button>
          </div>
        )}
      </div>
      <p className="mt-8 text-sm text-orange-300 font-bold relative z-10">Powered by Gemini AI</p>
    </div>
  );
};

export default MainMenu;