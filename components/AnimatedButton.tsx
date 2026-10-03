import React from 'react';
import { motion, HTMLMotionProps } from 'motion/react';
import { useAnimation } from '../src/AnimationContext';

interface AnimatedButtonProps extends HTMLMotionProps<"button"> {}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  className, 
  ...props 
}) => {
  const { ios27Animations, currentTransition } = useAnimation();
  
  return (
    <motion.button
      whileTap={ios27Animations ? { scale: 0.95, filter: 'brightness(0.9)' } : { scale: 0.98 }}
      transition={ios27Animations ? currentTransition : { duration: 0.1 }}
      className={className}
      {...props as any}
    >
      {children}
    </motion.button>
  );
};
