import React, { useState, useEffect, useRef, useCallback } from 'react';
import { GameSettings, IngredientType, PlayerState, FallingItem, GameMode } from '../types';
import { INGREDIENTS, LANE_COUNT, MAX_HP, MEMORY_TIME_SEC, SPAWN_RATE_MS, INITIAL_FALL_SPEED } from '../constants';
import { generateRecipeDescription, generateGameOverMessage } from '../services/geminiService';

interface GameplayProps {
  settings: GameSettings;
  onEndGame: (finalScore: number, durationPlayed: number, win: boolean, msg: string, scores?: number[]) => void;
  onExit: () => void;
}

const Gameplay: React.FC<GameplayProps> = ({ settings, onEndGame, onExit }) => {
  const isDuo = settings.playerCount === 2;

  // Game Logic State
  const [mode, setMode] = useState<GameMode>(GameMode.MEMORIZE);
  const [recipe, setRecipe] = useState<IngredientType[]>([]);
  // In Duo, players share the same recipe requirement
  const [recipeDesc, setRecipeDesc] = useState<string>("Analyzing recipe...");
  const [timeElapsed, setTimeElapsed] = useState<number>(0);
  const [memoryTimer, setMemoryTimer] = useState<number>(MEMORY_TIME_SEC);
  const [gameStartTime] = useState<number>(Date.now());
  
  // Per-Player States (Array indices correspond to Player ID 0 and 1)
  const [players, setPlayers] = useState<PlayerState[]>(
    Array.from({ length: settings.playerCount }).map((_, i) => ({
      id: i,
      hp: MAX_HP,
      score: 0,
      consecutiveMistakes: 0,
      lane: 2,
      y: 70,
      isDead: false,
      frozenUntil: 0
    }))
  );
  
  const [currentSteps, setCurrentSteps] = useState<number[]>([1, 1]);
  const [caughtStacks, setCaughtStacks] = useState<IngredientType[][]>([[IngredientType.BREAD], [IngredientType.BREAD]]);
  const [feedbacks, setFeedbacks] = useState<('NONE' | 'SUCCESS' | 'ERROR' | 'EXPLOSION' | 'SLEEP')[]>(['NONE', 'NONE']);
  const [poisonEndTimes, setPoisonEndTimes] = useState<number[]>([0, 0]);
  const [completedSandwiches, setCompletedSandwiches] = useState<number>(0); // Shared progress for difficulty scaling

  const [fallingItems, setFallingItems] = useState<FallingItem[]>([]);
  
  // Refs
  const requestRef = useRef<number>(0);
  const lastSpawnTime = useRef<number>(0);
  const speedRef = useRef<number>(INITIAL_FALL_SPEED); 
  const spawnRateRef = useRef<number>(SPAWN_RATE_MS);
  
  // Ref for accessing state inside loop
  const gameStateRef = useRef({ 
    mode, players, recipe, currentSteps, poisonEndTimes, isDuo 
  });

  useEffect(() => {
    gameStateRef.current = { mode, players, recipe, currentSteps, poisonEndTimes, isDuo };
  }, [mode, players, recipe, currentSteps, poisonEndTimes, isDuo]);

  // --- Initialization ---
  const generateNewRecipe = useCallback(async () => {
    let fillingCount = 1;
    if (completedSandwiches >= 1) fillingCount = 2;
    if (completedSandwiches >= 3) fillingCount = Math.floor(Math.random() * 3) + 3;

    const fillingTypes = Object.values(IngredientType).filter(t => 
        t !== IngredientType.BREAD && t !== IngredientType.POISON && t !== IngredientType.BOMB && t !== IngredientType.SLEEPING_PILL
    );
    
    const newRecipe = [IngredientType.BREAD];
    for(let i=0; i<fillingCount; i++) {
      newRecipe.push(fillingTypes[Math.floor(Math.random() * fillingTypes.length)]);
    }
    newRecipe.push(IngredientType.BREAD);

    setRecipe(newRecipe);
    setCurrentSteps(Array(settings.playerCount).fill(1));
    setCaughtStacks(Array(settings.playerCount).fill([IngredientType.BREAD]));
    
    // AI Content
    generateRecipeDescription(newRecipe).then(desc => setRecipeDesc(desc));
  }, [completedSandwiches, settings.playerCount]);

  useEffect(() => {
    generateNewRecipe();
  }, [generateNewRecipe]);


  // --- Controls ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (mode === GameMode.MEMORIZE) {
        if (e.key === 'Enter') setMode(GameMode.PLAYING);
        return;
      }

      if (mode !== GameMode.PLAYING) return;
      
      const updatePlayer = (pIndex: number, dx: number, dy: number) => {
        setPlayers(prev => {
           const newPlayers = [...prev];
           const p = newPlayers[pIndex];
           if (!p || p.isDead) return prev;
           
           // Check Frozen State
           if (Date.now() < p.frozenUntil) return prev;

           newPlayers[pIndex] = {
             ...p,
             lane: Math.max(0, Math.min(LANE_COUNT - 1, p.lane + dx)),
             y: Math.max(15, Math.min(80, p.y + dy))
           };
           return newPlayers;
        });
      };

      // Player 1 Controls (WASD) - Only if 2 players OR 1 player (optional)
      // If 1 player, we usually bind Arrows. If 2 players, P1 is WASD.
      if (isDuo) {
          // P1 WASD
          if (e.key === 'a') updatePlayer(0, -1, 0);
          if (e.key === 'd') updatePlayer(0, 1, 0);
          if (e.key === 'w') updatePlayer(0, 0, -5);
          if (e.key === 's') updatePlayer(0, 0, 5);

          // P2 Arrows
          if (e.key === 'ArrowLeft') updatePlayer(1, -1, 0);
          if (e.key === 'ArrowRight') updatePlayer(1, 1, 0);
          if (e.key === 'ArrowUp') updatePlayer(1, 0, -5);
          if (e.key === 'ArrowDown') updatePlayer(1, 0, 5);
      } else {
          // Solo Mode: Support both WASD and Arrows for convenience
          if (e.key === 'ArrowLeft' || e.key === 'a') updatePlayer(0, -1, 0);
          if (e.key === 'ArrowRight' || e.key === 'd') updatePlayer(0, 1, 0);
          if (e.key === 'ArrowUp' || e.key === 'w') updatePlayer(0, 0, -5);
          if (e.key === 'ArrowDown' || e.key === 's') updatePlayer(0, 0, 5);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, isDuo]);


  // --- Timers ---
  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (mode === GameMode.MEMORIZE) {
      interval = setInterval(() => {
        setMemoryTimer(prev => {
          if (prev <= 1) {
            setMode(GameMode.PLAYING);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (mode === GameMode.PLAYING) {
      interval = setInterval(() => {
        setTimeElapsed(prev => prev + 1);
        // Force re-render for UI updates on frozen states
        setPlayers(prev => [...prev]); 
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [mode]);

  // --- Feedback Reset ---
  useEffect(() => {
     feedbacks.forEach((f, i) => {
        if (f !== 'NONE') {
            const duration = f === 'EXPLOSION' ? 800 : (f === 'SLEEP' ? 1500 : 300);
            setTimeout(() => {
                setFeedbacks(prev => {
                    const next = [...prev];
                    next[i] = 'NONE';
                    return next;
                });
            }, duration);
        }
     });
  }, [feedbacks]);


  // --- Core Game Loop ---
  const gameLoop = (time: number) => {
    const state = gameStateRef.current;

    if (state.mode === GameMode.PLAYING) {
      // 1. Spawning
      if (time - lastSpawnTime.current > spawnRateRef.current) {
        lastSpawnTime.current = time;
        
        const { recipe } = state;
        const newItems: FallingItem[] = [];
        
        // Spawn items for each alive player independently
        state.players.forEach((player, pIdx) => {
            if (!player || player.isDead) return;

            const targetIngredient = recipe[state.currentSteps[pIdx]];
            const normalTypes = Object.values(IngredientType).filter(t => 
                t !== IngredientType.POISON && t !== IngredientType.BOMB && t !== IngredientType.SLEEPING_PILL
            );

            let dropCount = 1;
            if (completedSandwiches > 1) dropCount = Math.floor(Math.random() * 2) + 1;
            if (completedSandwiches > 3) dropCount = Math.floor(Math.random() * 2) + 2;

            const availableLanes = Array.from({length: LANE_COUNT}, (_, i) => i).sort(() => Math.random() - 0.5);
            const selectedLanes = availableLanes.slice(0, dropCount);

            selectedLanes.forEach((lane, idx) => {
                let chosenType: IngredientType;
                const rand = Math.random();
                
                if (idx === 0 && targetIngredient && rand < 0.4) {
                   chosenType = targetIngredient;
                } else if (rand < 0.50) { 
                   chosenType = IngredientType.POISON;
                } else if (rand < 0.55) { 
                   chosenType = IngredientType.BOMB;
                } else if (rand < 0.60) {
                   chosenType = IngredientType.SLEEPING_PILL;
                } else {
                   chosenType = normalTypes[Math.floor(Math.random() * normalTypes.length)];
                }

                newItems.push({
                    id: time + pIdx * 1000 + idx, 
                    type: chosenType,
                    lane: lane,
                    y: -20 - (Math.random() * 10),
                    ownerId: player.id
                });
            });
        });
        setFallingItems(prev => [...prev, ...newItems]);
      }

      // 2. Movement & Collision
      setFallingItems(prevItems => {
        const nextItems: FallingItem[] = [];
        const hits: { pIndex: number, type: IngredientType }[] = [];

        prevItems.forEach(item => {
          const newY = item.y + speedRef.current;
          const player = state.players[item.ownerId];
          
          if (!player || player.isDead) return; // Discard items for dead players

          const hitZoneStart = player.y;
          const hitZoneEnd = player.y + 10;
          const inYZone = newY >= hitZoneStart && newY <= hitZoneEnd;

          if (item.lane === player.lane && inYZone) {
             hits.push({ pIndex: item.ownerId, type: item.type });
          } else if (newY > 120) {
             // Missed
          } else {
            nextItems.push({ ...item, y: newY });
          }
        });

        if (hits.length > 0) {
            hits.forEach(h => handleCatch(h.pIndex, h.type));
        }

        return nextItems;
      });
    }

    requestRef.current = requestAnimationFrame(gameLoop);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(requestRef.current);
  }, []); 


  // --- Logic Helpers ---
  const handleCatch = (pIndex: number, type: IngredientType) => {
    const { recipe, players, currentSteps } = gameStateRef.current;
    
    // Safety check
    const player = players[pIndex];
    if (!player || player.isDead) return;

    // Feedback Setter Helper
    const setPFeedback = (fb: 'NONE' | 'SUCCESS' | 'ERROR' | 'EXPLOSION' | 'SLEEP') => {
        setFeedbacks(prev => {
            const next = [...prev];
            next[pIndex] = fb;
            return next;
        });
    };

    const updatePlayerHP = (idx: number, delta: number, scoreDelta: number) => {
        setPlayers(prev => {
            const next = [...prev];
            const p = next[idx];
            if (!p) return prev;
            const newHp = p.hp + delta;
            
            next[idx] = {
                ...p,
                hp: newHp,
                score: Math.max(0, p.score + scoreDelta),
                isDead: newHp <= 0
            };
            return next;
        });
    };

    if (type === IngredientType.BOMB) {
        setPFeedback('EXPLOSION');
        updatePlayerHP(pIndex, -1, -50);
        setCaughtStacks(prev => {
            const next = [...prev];
            next[pIndex] = [IngredientType.BREAD];
            return next;
        });
        setCurrentSteps(prev => {
            const next = [...prev];
            next[pIndex] = 1;
            return next;
        });
        return;
    }

    if (type === IngredientType.POISON) {
        setPFeedback('ERROR');
        setPoisonEndTimes(prev => {
            const next = [...prev];
            next[pIndex] = Date.now() + 5000;
            return next;
        });
        updatePlayerHP(pIndex, -1, -50);
        return;
    }

    if (type === IngredientType.SLEEPING_PILL) {
        setPFeedback('SLEEP');
        setPlayers(prev => {
            const next = [...prev];
            if (!next[pIndex]) return prev;
            next[pIndex].frozenUntil = Date.now() + 5000; // Freeze for 5 seconds
            return next;
        });
        return;
    }

    const targetIngredient = recipe[currentSteps[pIndex]];

    if (type === targetIngredient) {
        setPFeedback('SUCCESS');
        setCaughtStacks(prev => {
            const next = [...prev];
            next[pIndex] = [...next[pIndex], type];
            return next;
        });
        setPlayers(prev => {
            const next = [...prev];
            if (!next[pIndex]) return prev;
            next[pIndex].score += 10;
            next[pIndex].consecutiveMistakes = 0;
            return next;
        });

        const nextStep = currentSteps[pIndex] + 1;
        if (nextStep >= recipe.length) {
            // Sandwich Complete
            setPlayers(prev => {
                const next = [...prev];
                if (!next[pIndex]) return prev;
                next[pIndex].score += 50;
                return next;
            });
            // Difficulty UP (Shared)
            setCompletedSandwiches(prev => prev + 1);
            speedRef.current = Math.min(2.5, speedRef.current + 0.1); 
            spawnRateRef.current = Math.max(500, spawnRateRef.current - 100);
            
            // Soft Reset for everyone (New Recipe)
            setMode(GameMode.MEMORIZE);
            setMemoryTimer(MEMORY_TIME_SEC);
            setFallingItems([]);
        } else {
            setCurrentSteps(prev => {
                const next = [...prev];
                next[pIndex] = nextStep;
                return next;
            });
        }
    } else {
        setPFeedback('ERROR');
        setPlayers(prev => {
            const next = [...prev];
            if (!next[pIndex]) return prev;
            next[pIndex].consecutiveMistakes += 1;
            return next;
        });
        updatePlayerHP(pIndex, -1, 0);
    }
  };

  // Check Game Over Condition
  useEffect(() => {
    const allDead = players.every(p => p.isDead);
    if (allDead && mode !== GameMode.GAME_OVER) {
        finishGame();
    }
  }, [players, mode]);

  const finishGame = async () => {
    setMode(GameMode.GAME_OVER);
    const duration = Math.floor((Date.now() - gameStartTime) / 1000);
    
    // Determine winner
    const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
    const winner = sortedPlayers[0];
    const isWin = winner ? winner.score > 0 : false;

    let msg = "Game Over!";
    if (isDuo && winner) {
        msg = `Winner: ${winner.id === 0 ? 'Player 1' : 'Player 2'}! Score: ${winner.score}`;
    }

    let aiMsg = "";
    try {
        if (winner) {
            const aiPromise = generateGameOverMessage(winner.score, 1000, isWin);
            const timeoutPromise = new Promise<string>((resolve) => setTimeout(() => resolve(""), 2000));
            aiMsg = await Promise.race([aiPromise, timeoutPromise]);
        }
    } catch (e) { }

    onEndGame(winner ? winner.score : 0, duration, isWin, `${msg} ${aiMsg}`, players.map(p => p.score));
  };

  const handleManualExit = () => {
    finishGame();
  };

  const renderCaughtStack = (pIndex: number) => {
    const stack = caughtStacks[pIndex];
    const reversedStack = [...stack].reverse();

    return (
        <div className="flex flex-col items-center z-30 transform translate-y-3">
            {reversedStack.map((ing, i) => {
                const originalIndex = stack.length - 1 - i;
                return (
                    <div 
                        key={originalIndex}
                        className="flex items-center justify-center filter drop-shadow-xl transition-transform duration-300"
                        style={{
                            zIndex: originalIndex + 30,
                            marginBottom: i === reversedStack.length - 1 ? 0 : '-50px',
                            transform: `rotate(${Math.sin(originalIndex * 132 + pIndex * 10) * 8}deg)`
                        }}
                    >
                        <span className="text-7xl select-none leading-none filter drop-shadow-sm">
                            {INGREDIENTS[ing].emoji}
                        </span>
                    </div>
                );
            })}
        </div>
    );
  };

  // --- Render ---
  return (
    <div className="relative w-full h-screen overflow-hidden font-sans select-none bg-yellow-50 text-slate-800 flex">
      
      {/* Shared Background Pattern */}
      <div className="absolute inset-0 opacity-10 pointer-events-none z-0" 
           style={{ 
             backgroundImage: 'linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000), linear-gradient(45deg, #000 25%, transparent 25%, transparent 75%, #000 75%, #000)',
             backgroundPosition: '0 0, 20px 20px',
             backgroundSize: '40px 40px'
           }}>
      </div>

      {/* Manual Exit Button */}
      <button 
        onClick={handleManualExit}
        className="absolute top-4 left-4 z-50 bg-white/90 hover:bg-white text-slate-600 hover:text-red-500 p-3 rounded-2xl font-bold shadow-lg border-2 border-slate-200 hover:border-red-200 transition-all transform hover:scale-105 flex items-center gap-2"
      >
        <span className="text-xl">🛑</span>
        <span className="hidden sm:inline">放棄挑戰</span>
      </button>

      {/* Shared Overlays (Recipe Memory) */}
      {mode === GameMode.MEMORIZE && (
        <div className="absolute inset-0 bg-orange-100/95 z-50 flex flex-col items-center justify-center text-center p-6 animate-fade-in backdrop-blur-sm">
          <h2 className="text-5xl font-black text-orange-500 mb-2 drop-shadow-white">MEMORIZE!</h2>
          <div className="text-8xl font-black text-slate-800 mb-4">{memoryTimer}</div>
          <div className="bg-white p-8 rounded-[40px] border-8 border-orange-200 max-w-lg w-full shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 left-0 w-full h-4 bg-orange-300"></div>
             <p className="text-gray-400 text-xs uppercase tracking-widest mb-4 font-bold mt-2">Target Recipe</p>
             <div className="flex flex-col-reverse items-center gap-2 mb-6">
               {recipe.map((r, i) => (
                 <div key={i} className={`px-6 py-3 rounded-2xl w-full flex justify-between items-center ${INGREDIENTS[r].color} text-slate-800 font-extrabold text-lg shadow-sm border border-black/5`}>
                    <span>Layer {i+1}</span>
                    <span className="flex items-center gap-2">{INGREDIENTS[r].name} <span className="text-3xl">{INGREDIENTS[r].emoji}</span></span>
                 </div>
               ))}
             </div>
             <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
               <p className="italic text-orange-800 text-lg font-serif">"{recipeDesc}"</p>
             </div>
          </div>
        </div>
      )}

      {/* Player Views */}
      {players.map((player, index) => {
        // Safety check for render loop
        if (!player) return null;

        const isPoisoned = Date.now() < poisonEndTimes[index];
        const isFrozen = Date.now() < player.frozenUntil;
        const feedback = feedbacks[index];
        const currentStep = currentSteps[index];

        return (
          <div key={index} className={`relative h-full flex-1 border-r-4 border-orange-200/50 last:border-r-0
             transition-all duration-300
             ${feedback === 'SUCCESS' ? 'shadow-[inset_0_0_50px_rgba(34,197,94,0.3)]' : ''}
             ${feedback === 'ERROR' && !isPoisoned ? 'shadow-[inset_0_0_50px_rgba(239,68,68,0.5)]' : ''}
             ${isPoisoned ? 'grayscale contrast-125 shadow-[inset_0_0_100px_rgba(128,0,128,0.5)]' : ''}
             ${isFrozen ? 'brightness-75 contrast-75 saturate-50 shadow-[inset_0_0_100px_rgba(50,50,200,0.3)]' : ''} 
             ${feedback === 'EXPLOSION' ? 'animate-shake bg-red-100' : ''}
             ${player.isDead ? 'grayscale brightness-50 contrast-50' : ''}
          `}>
             
             {/* HUD Per Player */}
             <div className={`${isDuo 
                 ? "absolute top-0 left-0 right-0 p-4 flex flex-col items-center mt-12" 
                 : "absolute top-0 right-0 p-8 flex flex-col items-end"} z-20 pointer-events-none`}>
                 
                <div className={`bg-white/80 backdrop-blur px-4 py-2 rounded-2xl shadow-lg border-2 border-orange-200 flex flex-col ${isDuo ? "items-center" : "items-end"}`}>
                   <div className="text-sm font-bold text-gray-400 uppercase">{isDuo ? `Player ${index + 1}` : 'Player'}</div>
                   <div className="text-3xl font-extrabold text-orange-500">{player.score}</div>
                </div>
                {/* Hearts */}
                <div className={`flex gap-1 mt-2 ${!isDuo ? "justify-end" : ""}`}>
                   {Array.from({length: MAX_HP}).map((_, i) => (
                     <span key={i} className={`text-xl transition-all ${i < player.hp ? 'opacity-100' : 'opacity-20 grayscale'}`}>❤️</span>
                   ))}
                </div>
                
                {/* Target Next - DUO MODE ONLY (Keep it here for stack layout) */}
                {isDuo && recipe[currentStep] && !player.isDead && (
                   <div className="mt-4 bg-yellow-100 px-5 py-2 rounded-full text-xl font-black text-yellow-800 flex items-center gap-2 shadow-md border-4 border-white animate-bounce-tiny">
                      <span>NEXT</span>
                      <span className="text-5xl drop-shadow-md">{INGREDIENTS[recipe[currentStep]].emoji}</span>
                   </div>
                )}
             </div>

             {/* Target Next - SOLO MODE ONLY (Top Center) */}
             {!isDuo && recipe[currentStep] && !player.isDead && (
                <div className="absolute top-8 left-1/2 -translate-x-1/2 z-20 pointer-events-none">
                   <div className="bg-yellow-100 px-5 py-2 rounded-full text-xl font-black text-yellow-800 flex items-center gap-2 shadow-md border-4 border-white animate-bounce-tiny">
                      <span>NEXT</span>
                      <span className="text-5xl drop-shadow-md">{INGREDIENTS[recipe[currentStep]].emoji}</span>
                   </div>
                </div>
             )}

             {/* Dead Overlay */}
             {player.isDead && (
                 <div className="absolute inset-0 flex items-center justify-center z-40">
                     <div className="text-6xl font-black text-red-600 rotate-12 border-4 border-red-600 p-4 rounded-xl bg-white/50 backdrop-blur">ELIMINATED</div>
                 </div>
             )}

             {/* Frozen Overlay Animation */}
             {isFrozen && !player.isDead && (
                 <div className="absolute top-1/4 left-1/2 -translate-x-1/2 z-40 animate-pulse text-center">
                     <div className="text-6xl font-bold text-blue-500 drop-shadow-white">zZz...</div>
                     <div className="text-white bg-blue-500 px-3 py-1 rounded-full text-sm mt-2 font-bold">FROZEN</div>
                 </div>
             )}

             {/* Game Lane Grid */}
             <div className="absolute inset-0 flex justify-center overflow-hidden">
                <div className="relative w-full max-w-lg h-full border-x-2 border-orange-100/30 lane-grid">
                    {/* Falling Items for this player */}
                    {fallingItems.filter(i => i.ownerId === index).map(item => (
                        <div 
                        key={item.id}
                        className="absolute flex items-center justify-center"
                        style={{
                            left: `${item.lane * (100 / LANE_COUNT)}%`,
                            width: `${100 / LANE_COUNT}%`,
                            top: `${item.y}%`,
                            height: 'auto'
                        }}
                        >
                            {/* Removed circle wrapper, showing pure icon with shadow */}
                            <div className="text-8xl filter drop-shadow-2xl animate-bounce-slow transform hover:scale-110 transition-transform">
                              {INGREDIENTS[item.type].emoji}
                            </div>
                        </div>
                    ))}

                    {/* Player Character */}
                    {!player.isDead && (
                        <div 
                            className={`absolute transition-all duration-75 ease-linear flex flex-col items-center justify-start z-30
                            ${player.consecutiveMistakes >= 3 || isPoisoned ? 'animate-shake' : ''}
                            `}
                            style={{
                                left: `${player.lane * (100 / LANE_COUNT)}%`,
                                width: `${100 / LANE_COUNT}%`,
                                top: `${player.y}%`, 
                                height: 'auto' 
                            }}
                        >
                            {renderCaughtStack(index)}
                            <div className="w-32 h-4 bg-white rounded-full shadow-xl border-2 border-gray-300 z-20 relative"></div>
                            <div className="text-7xl -mt-8 z-10 filter drop-shadow-2xl">
                                {isPoisoned ? '🤢' : (feedback === 'EXPLOSION' ? '😵' : (isFrozen ? '😴' : '🐭'))}
                            </div>
                        </div>
                    )}
                </div>
             </div>
          </div>
        );
      })}
    </div>
  );
};

export default Gameplay;