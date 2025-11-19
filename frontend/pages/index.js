import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Barn from '../components/Barn';
import { motion, AnimatePresence } from 'framer-motion';

// 模拟数据
const MOCK_BARNS = Array(8).fill(0).map((_, i) => ({ id: i + 1, amount: 100 + i * 50 }));

export default function Home() {
  const [selectedBarn, setSelectedBarn] = useState(null);
  const [gameState, setGameState] = useState('BETTING'); // BETTING, LOCKED, ATTACK, RESULT
  const [timeLeft, setTimeLeft] = useState(60);
  const [destroyedBarnId, setDestroyedBarnId] = useState(null);

  // 倒计时逻辑 (模拟)
  useEffect(() => {
    if (timeLeft > 0 && gameState === 'BETTING') {
      const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && gameState === 'BETTING') {
      setGameState('LOCKED');
      setTimeout(() => setGameState('ATTACK'), 2000); // 2秒后开始攻击
    }
  }, [timeLeft, gameState]);

  // 攻击逻辑 (模拟)
  useEffect(() => {
    if (gameState === 'ATTACK') {
      setTimeout(() => {
        const target = Math.floor(Math.random() * 8) + 1;
        setDestroyedBarnId(target);
        setGameState('RESULT');
      }, 3000); // 3秒攻击动画
    }
  }, [gameState]);

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden relative">
      <Head>
        <title>NTX Bull Arena</title>
      </Head>

      {/* 背景氛围 */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black z-0"></div>

      <main className="relative z-10 container mx-auto px-4 py-8 flex flex-col h-screen">
        
        {/* 顶部 HUD */}
        <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
          <h1 className="text-3xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
            BULL ARENA
          </h1>
          
          {/* 倒计时面板 */}
          <div className={`text-4xl font-mono font-bold ${timeLeft < 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
            00:{timeLeft.toString().padStart(2, '0')}
          </div>

          <button className="px-6 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold transition-colors">
            Connect Wallet
          </button>
        </header>

        {/* 游戏主区域 */}
        <div className="flex-grow flex flex-col justify-center">
          
          {/* 状态提示 */}
          <div className="text-center mb-8 h-12">
            <AnimatePresence mode='wait'>
              {gameState === 'BETTING' && (
                <motion.div 
                  key="betting"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                  className="text-green-400 text-xl tracking-widest"
                >
                  PLACE YOUR BETS
                </motion.div>
              )}
              {gameState === 'LOCKED' && (
                <motion.div 
                  key="locked"
                  initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="text-yellow-400 text-2xl font-bold"
                >
                  🔒 LOCKED - BEWARE THE BULL
                </motion.div>
              )}
              {gameState === 'ATTACK' && (
                <motion.div 
                  key="attack"
                  className="text-red-600 text-4xl font-black uppercase shake-hard"
                >
                  ⚠️ BULL CHARGING! ⚠️
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* 牛栏网格 */}
          <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${gameState === 'ATTACK' ? 'shake-hard' : ''}`}>
            {MOCK_BARNS.map((barn) => (
              <Barn 
                key={barn.id}
                id={barn.id}
                amount={barn.amount}
                isSelected={selectedBarn === barn.id}
                isDestroyed={destroyedBarnId === barn.id}
                onSelect={(id) => gameState === 'BETTING' && setSelectedBarn(id)}
              />
            ))}
          </div>

          {/* 疯牛动画层 (覆盖在最上层) */}
          {gameState === 'ATTACK' && (
            <motion.div 
              initial={{ x: '-100%', opacity: 0 }}
              animate={{ x: '100%', opacity: 1 }}
              transition={{ duration: 0.5, repeat: 3, repeatType: "reverse" }}
              className="absolute inset-0 pointer-events-none flex items-center justify-center z-50"
            >
              {/* 这里应该放一个 Lottie 动画或高质量图片 */}
              <div className="text-9xl filter drop-shadow-[0_0_20px_rgba(255,0,0,0.8)]">
                🐂💨
              </div>
            </motion.div>
          )}

        </div>

        {/* 底部操作栏 */}
        <footer className="mt-8 border-t border-gray-800 pt-4 flex justify-center">
          <button 
            disabled={!selectedBarn || gameState !== 'BETTING'}
            className={`
              w-full md:w-1/2 py-4 text-xl font-bold rounded-lg uppercase tracking-widest transition-all
              ${!selectedBarn || gameState !== 'BETTING'
                ? 'bg-gray-800 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-yellow-500 to-red-600 hover:from-yellow-400 hover:to-red-500 text-black shadow-lg shadow-red-900/50'}
            `}
          >
            {selectedBarn ? `Confirm Bet on #${selectedBarn}` : 'Select a Barn'}
          </button>
        </footer>

      </main>
    </div>
  );
}
