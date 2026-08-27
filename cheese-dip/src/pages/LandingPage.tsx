import { Link } from "react-router-dom";
import { useAuthSession } from "../features/auth";
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, useReducedMotion } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { LogIn, UserPlus, MessageCircle, Sparkles, ArrowRight, Activity, Sun, Moon } from 'lucide';
import { IconButton, Button } from '@radix-ui/themes';
import { useState } from 'react';
import { useTheme } from 'next-themes';
import './LandingPage.css';

export const LandingPage = () => {
  const { user } = useAuthSession();
  const [hoveredBtn, setHoveredBtn] = useState<string | null>(null);
  const { theme, setTheme, resolvedTheme } = useTheme();
  const reduce = useReducedMotion();

  const isDark = theme === 'dark' || resolvedTheme === 'dark';

  return (
    <div className="landing-container">
      <IconButton 
        className="theme-toggle"
          variant="soft"
          radius="full"
          color="gray"
          onClick={() => setTheme(isDark ? 'light' : 'dark')}
          aria-label="Toggle Theme"
        >
          <MorphIcon 
            icon={isDark ? Sun : Moon} 
            size={20} 
            spring="bouncy"
            aria-hidden="true"
          />
        </IconButton>

      <div className="hero-split">
        <motion.div 
          className="hero-content"
          initial={reduce ? false : { opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.h1 
            className="hero-title"
            initial={reduce ? false : { scale: 0.98 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <MorphIcon icon={Sparkles} size={40} color="var(--ruby-9)" aria-hidden="true" />
            Meoww
          </motion.h1>
          
          <motion.p 
            className="hero-subtitle"
            initial={reduce ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            Connect with people instantly. A modern realtime chat experience designed to feel natural and fluid.
          </motion.p>
          
          <motion.div 
            className="hero-actions"
            initial={reduce ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Tooltip.Provider delayDuration={200}>
              {user ? (
                <Tooltip.Root>
                  <Tooltip.Trigger asChild>
                    <Button asChild size="4" variant="solid" color="ruby" style={{ cursor: "pointer", borderRadius: "9999px" }}>
                      <Link 
                        to="/chat" 
                        onMouseEnter={() => setHoveredBtn('chat')}
                        onMouseLeave={() => setHoveredBtn(null)}
                      >
                        <span>Enter Chat</span>
                        <MorphIcon 
                          icon={hoveredBtn === 'chat' ? ArrowRight : MessageCircle} 
                          size={20} 
                          spring="snappy"
                          aria-hidden="true"
                        />
                      </Link>
                    </Button>
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
                      <Button asChild size="4" variant="solid" color="ruby" style={{ cursor: "pointer", borderRadius: "9999px" }}>
                        <Link 
                          to="/signup" 
                          onMouseEnter={() => setHoveredBtn('signup')}
                          onMouseLeave={() => setHoveredBtn(null)}
                        >
                          <span>Get Started</span>
                          <MorphIcon 
                            icon={hoveredBtn === 'signup' ? Activity : UserPlus} 
                            size={20} 
                            spring="bouncy"
                            aria-hidden="true"
                          />
                        </Link>
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="tooltip-content" sideOffset={5}>
                        Create a new account
                        <Tooltip.Arrow className="tooltip-arrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>

                  <Tooltip.Root>
                    <Tooltip.Trigger asChild>
                      <Button asChild size="4" variant="surface" color="gray" style={{ cursor: "pointer", borderRadius: "9999px" }}>
                        <Link 
                          to="/login" 
                          onMouseEnter={() => setHoveredBtn('login')}
                          onMouseLeave={() => setHoveredBtn(null)}
                        >
                          <MorphIcon 
                            icon={hoveredBtn === 'login' ? ArrowRight : LogIn} 
                            size={20} 
                            spring="snappy"
                            aria-hidden="true"
                          />
                          <span>Login</span>
                        </Link>
                      </Button>
                    </Tooltip.Trigger>
                    <Tooltip.Portal>
                      <Tooltip.Content className="tooltip-content" sideOffset={5}>
                        Welcome back!
                        <Tooltip.Arrow className="tooltip-arrow" />
                      </Tooltip.Content>
                    </Tooltip.Portal>
                  </Tooltip.Root>
                </>
              )}
            </Tooltip.Provider>
          </motion.div>
        </motion.div>

        <motion.div 
          className="hero-visual"
          initial={reduce ? false : { opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="hero-visual-inner">
             {/* Using the generated hero image */}
             <img src="/hero_fluid_glass.webp" alt="Abstract fluid glass shape representing natural chat flow" className="hero-image" fetchPriority="high" width="500" height="500" />
          </div>
        </motion.div>
      </div>
    </div>
  );
};
