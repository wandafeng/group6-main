import React, { useState } from 'react';
import MainMenu from './components/MainMenu';
import Gameplay from './components/Gameplay';
import GameOver from './components/GameOver';
import { GameSettings } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<'MENU' | 'GAME' | 'RESULT'>('MENU');
  const [settings, setSettings] = useState<GameSettings>({ duration: 60, playerCount: 1 });
  const [lastResult, setLastResult] = useState<{ score: number; duration: number; win: boolean; msg: string; scores?: number[] } | null>(null);

  const handleStart = (newSettings: GameSettings) => {
    setSettings(newSettings);
    setAppState('GAME');
  };

  const handleEndGame = (score: number, duration: number, win: boolean, msg: string, scores?: number[]) => {
    setLastResult({ score, duration, win, msg, scores });
    setAppState('RESULT');
  };

  const handleExit = () => {
    setAppState('MENU');
  };

  return (
    <div className="w-full h-screen overflow-hidden">
      {appState === 'MENU' && <MainMenu onStart={handleStart} />}
      
      {appState === 'GAME' && (
        <Gameplay 
          settings={settings} 
          onEndGame={handleEndGame} 
          onExit={handleExit} 
        />
      )}

      {appState === 'RESULT' && lastResult && (
        <GameOver 
          score={lastResult.score}
          duration={lastResult.duration}
          win={lastResult.win}
          message={lastResult.msg}
          scores={lastResult.scores}
          onRestart={() => setAppState('GAME')}
          onExit={handleExit}
        />
      )}
    </div>
  );
};

export default App;