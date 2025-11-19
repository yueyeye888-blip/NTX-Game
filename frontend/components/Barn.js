import React from 'react';
import { motion } from 'framer-motion';

/**
 * Barn (牛栏) 组件
 * @param {number} id - 牛栏编号 (1-8)
 * @param {number} amount - 当前池子金额
 * @param {boolean} isSelected - 玩家是否选择了这个
 * @param {boolean} isDestroyed - 是否被摧毁
 * @param {function} onSelect - 点击回调
 */
const Barn = ({ id, amount, isSelected, isDestroyed, onSelect }) => {
  
  // 动态样式
  const containerClass = `
    relative w-full h-32 md:h-48 rounded-lg border-2 cursor-pointer transition-all duration-300
    flex flex-col items-center justify-center overflow-hidden
    ${isDestroyed 
      ? 'border-red-600 bg-red-900/20 opacity-80' 
      : isSelected 
        ? 'border-yellow-400 bg-yellow-900/20 shadow-[0_0_20px_rgba(252,238,10,0.5)]' 
        : 'border-cyan-500/50 bg-cyan-900/10 hover:border-cyan-400 hover:bg-cyan-900/30'}
  `;

  return (
    <motion.div 
      className={containerClass}
      onClick={() => !isDestroyed && onSelect(id)}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      animate={isDestroyed ? { x: [0, -10, 10, -10, 10, 0], rotate: [0, -5, 5, 0] } : {}}
    >
      {/* 全息编号 */}
      <div className="absolute top-2 left-3 text-2xl font-bold opacity-50 font-mono">
        #{id}
      </div>

      {/* 内部内容 */}
      {isDestroyed ? (
        <div className="text-red-500 font-bold text-xl animate-pulse">
          ⚠️ DESTROYED
        </div>
      ) : (
        <>
          {/* 栅栏纹理 (CSS实现) */}
          <div className="absolute inset-0 bg-[url('/assets/grid-pattern.png')] opacity-20 pointer-events-none"></div>
          
          {/* 金额显示 */}
          <div className="z-10 flex flex-col items-center">
            <span className="text-xs text-gray-400 uppercase tracking-widest">Pool</span>
            <span className={`text-xl md:text-2xl font-bold ${isSelected ? 'text-yellow-400' : 'text-cyan-300'}`}>
              {amount} NTX
            </span>
          </div>

          {/* 选中标记 */}
          {isSelected && (
            <motion.div 
              initial={{ scale: 0 }} 
              animate={{ scale: 1 }}
              className="absolute bottom-2 right-2 text-yellow-400"
            >
              🎯 YOUR BET
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
};

export default Barn;
