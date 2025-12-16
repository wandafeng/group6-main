import React from 'react';

interface GameOverProps {
  score: number;
  duration: number;
  win: boolean;
  message: string;
  onRestart: () => void;
  onExit: () => void;
  scores?: number[]; // Optional for multiplayer
}

const GameOver: React.FC<GameOverProps> = ({ score, duration, win, message, onRestart, onExit, scores }) => {
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}分 ${secs}秒`;
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 animate-fade-in font-sans select-none overflow-hidden">
       {/* Confetti Effect */}
       <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: 50 }).map((_, i) => (
             <div 
               key={i}
               className="absolute w-2 h-4"
               style={{
                 left: `${Math.random() * 100}%`,
                 top: `-10px`,
                 backgroundColor: ['#FF5733', '#33FF57', '#3357FF', '#F3FF33', '#FF33F3'][Math.floor(Math.random() * 5)],
                 animation: `fall ${2 + Math.random() * 3}s linear infinite`,
                 animationDelay: `${Math.random() * 5}s`,
                 transform: `rotate(${Math.random() * 360}deg)`
               }}
             ></div>
          ))}
          <style>{`
            @keyframes fall {
              to { transform: translateY(100vh) rotate(720deg); }
            }
          `}</style>
       </div>

       {/* Blurred Background */}
       <div className="absolute inset-0 bg-yellow-50/90 backdrop-blur-md"></div>
       
      <div className="bg-white p-8 rounded-[50px] shadow-[0_20px_60px_rgba(0,0,0,0.1)] border-[10px] border-white ring-4 ring-orange-100 max-w-2xl w-full text-center relative z-10 transform transition-all hover:scale-[1.01]">
        
        {/* The Doctor Avatar */}
        <div className="absolute -top-24 left-1/2 transform -translate-x-1/2">
            <div className="relative">
                <div className="w-40 h-40 bg-orange-100 rounded-full flex items-center justify-center shadow-xl border-4 border-white z-10">
                    <span className="text-8xl filter drop-shadow-md">🐭</span>
                </div>
                {/* Doctor Accessories */}
                <div className="absolute -top-4 -right-2 text-6xl filter drop-shadow-sm rotate-12 z-20">🎓</div>
            </div>
        </div>

        <div className="mt-16 mb-2">
            <h1 className="text-5xl font-black text-slate-700 tracking-wider">遊戲結束</h1>
            <p className="text-orange-400 font-bold text-lg mt-1">辛苦了！主廚們！</p>
        </div>

        {/* Stats Card */}
        <div className="bg-orange-50 rounded-3xl p-6 mb-6 border-2 border-orange-100 flex flex-col gap-4">
          {!scores ? (
             <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col items-center">
                    <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-1">最終分數</p>
                    <p className="text-5xl font-black text-slate-800">{score}</p>
                </div>
                <div className="flex flex-col items-center border-l-2 border-orange-200">
                    <p className="text-orange-400 text-sm font-bold uppercase tracking-wider mb-1">生存時間</p>
                    <p className="text-5xl font-black text-slate-800 tracking-tighter">{formatTime(duration)}</p>
                </div>
             </div>
          ) : (
              <div className="flex justify-around items-center">
                  <div className="flex flex-col items-center">
                      <p className="text-orange-400 text-xs font-bold uppercase mb-1">Player 1</p>
                      <p className="text-4xl font-black text-slate-800">{scores[0]}</p>
                      {scores[0] === score && <span className="text-xs bg-yellow-400 text-white px-2 rounded-full mt-1">WINNER</span>}
                  </div>
                  <div className="text-2xl text-orange-200 font-black">VS</div>
                  <div className="flex flex-col items-center">
                      <p className="text-blue-400 text-xs font-bold uppercase mb-1">Player 2</p>
                      <p className="text-4xl font-black text-slate-800">{scores[1]}</p>
                      {scores[1] === score && <span className="text-xs bg-blue-400 text-white px-2 rounded-full mt-1">WINNER</span>}
                  </div>
              </div>
          )}
        </div>

        {/* Doctor's Report */}
        <div className="mb-8 relative">
            <div className="absolute -top-3 left-4 bg-orange-200 text-orange-800 text-xs font-bold px-3 py-1 rounded-full">
                博士的診斷報告
            </div>
            <div className="bg-white border-2 border-orange-200 border-dashed rounded-2xl p-6 pt-6 text-lg text-slate-600 font-medium leading-relaxed shadow-sm">
             "{message}"
            </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 justify-center">
          <button 
            onClick={onRestart}
            className="flex-1 py-4 bg-yellow-400 hover:bg-yellow-300 text-yellow-900 font-black text-xl rounded-2xl transition transform hover:-translate-y-1 hover:shadow-xl shadow-md border-b-4 border-yellow-500 active:border-b-0 active:translate-y-0"
          >
            再挑戰一次
          </button>
          <button 
            onClick={onExit}
            className="flex-1 py-4 bg-stone-200 hover:bg-stone-300 text-stone-600 font-bold text-xl rounded-2xl transition transform hover:-translate-y-1 hover:shadow-xl shadow-md border-b-4 border-stone-300 active:border-b-0 active:translate-y-0"
          >
            回主選單
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameOver;