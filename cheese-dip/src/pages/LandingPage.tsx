import { Link } from "react-router-dom";
import { useAuthSession } from "../features/auth";
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { LogIn, UserPlus, MessageCircle, Sparkles, ArrowRight, Activity, Sun, Moon } from 'lucide';
import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import './LandingPage.css';

export const LandingPage = () => {
  const { user } = useAuthSession();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setMounted(true), []);

  const isDark = mounted && (theme === 'dark' || resolvedTheme === 'dark');

  return (
    <div className="landing-container">
      <div className="glow"></div>

      {mounted && (
        <button 
          className="theme-toggle" 
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle Theme"
        >
          <MorphIcon 
            icon={isDark ? Sun : Moon} 
            size={20} 
            spring="bouncy"
          />
        </button>
      )}
      
      <motion.div 
        className="content"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <motion.h1 
          className="title"
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <MorphIcon icon={Sparkles} size={48} color="var(--ruby-9)" />
          Meoww
        </motion.h1>
        
        <motion.p 
          className="subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          Connect with people instantly. A modern realtime chat experience designed to feel natural and fluid.
        </motion.p>
        
        <motion.div 
          className="actions"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <Tooltip.Provider delayDuration={200}>
            {user ? (
              <Tooltip.Root>
                <Tooltip.Trigger asChild>
                  <Link 
                    to="/chat" 
                    className="btn btn-primary"
                    onMouseEnter={() => setHoveredBtn('chat')}
                    onMouseLeave={() => setHoveredBtn(null)}
                  >
                    <span>Enter Chat</span>
                    <MorphIcon 
                      icon={hoveredBtn === 'chat' ? ArrowRight : MessageCircle} 
                      size={20} 
                      spring="snappy"
                    />
                  </Link>
                </Tooltip.Trigger>
                <Tooltip.Portal>
                  <Tooltip.Content className="tooltip-content" sideOffset={5}>
                    Jump right back in, {user.name}!
                    <Tooltip.Arrow className="tooltip-arrow" />
                  </Tooltip.Content>
                </Tooltip.Portal>
              </Tooltip.Root>
            ) : (
              <>
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Link 
                      to="/login" 
                      className="btn btn-secondary"
                      onMouseEnter={() => setHoveredBtn('login')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      <MorphIcon 
                        icon={hoveredBtn === 'login' ? ArrowRight : LogIn} 
                        size={20} 
                        spring="snappy"
                      />
                      <span>Login</span>
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Welcome back!
                      <Tooltip.Arrow className="tooltip-arrow" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>

                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Link 
                      to="/signup" 
                      className="btn btn-primary"
                      onMouseEnter={() => setHoveredBtn('signup')}
                      onMouseLeave={() => setHoveredBtn(null)}
                    >
                      <span>Get Started</span>
                      <MorphIcon 
                        icon={hoveredBtn === 'signup' ? Activity : UserPlus} 
                        size={20} 
                        spring="bouncy"
                      />
                    </Link>
                  </Tooltip.Trigger>
                  <Tooltip.Portal>
                    <Tooltip.Content className="tooltip-content" sideOffset={5}>
                      Create a new account
                      <Tooltip.Arrow className="tooltip-arrow" />
                    </Tooltip.Content>
                  </Tooltip.Portal>
                </Tooltip.Root>
              </>
            )}
          </Tooltip.Provider>
        </motion.div>
      </motion.div>
    </div>
  );
};
