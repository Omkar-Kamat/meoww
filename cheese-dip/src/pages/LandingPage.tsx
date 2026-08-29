import { Link } from "react-router-dom";
import { useAuthSession } from "../features/auth";
import * as Tooltip from '@radix-ui/react-tooltip';
import { motion, useReducedMotion } from 'framer-motion';
import { MorphIcon } from 'morphicons/react';
import { LogIn, UserPlus, MessageCircle, Sparkles, ArrowRight, Activity, Sun, Moon, Shield, Zap, Globe } from 'lucide';
import { IconButton, Button, Container, Section, Flex, Heading, Text, Grid, Card, Box } from '@radix-ui/themes';
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
      {/* Navigation Bar */}
      <Flex asChild align="center" justify="between" className="navbar">
        <header>
          <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            <Flex align="center" gap="2">
              <MorphIcon icon={Sparkles} size={24} color="var(--ruby-9)" aria-hidden="true" />
              <Text weight="bold" size="4" style={{ letterSpacing: '-0.02em' }}>Meoww</Text>
            </Flex>
          </Link>
          <Flex align="center" gap="4">
            <IconButton 
              variant="ghost"
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
            {!user && (
              <Button asChild variant="soft" color="ruby" radius="full">
                <Link to="/login">Sign In</Link>
              </Button>
            )}
          </Flex>
        </header>
      </Flex>

      {/* Hero Section */}
      <Section size="3" className="hero-section">
        <Container size="4">
          <Grid columns={{ initial: '1', md: '2' }} gap="7" align="center">
            <motion.div 
              initial={reduce ? false : { opacity: 0, x: -24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <Flex direction="column" gap="4" align="start">
                <Heading size={{ initial: '8', md: '9' }} style={{ letterSpacing: '-0.05em', lineHeight: 1.1 }}>
                  Connect with people <span className="text-gradient">instantly.</span>
                </Heading>
                
                <Text size="5" color="gray" style={{ maxWidth: '480px', lineHeight: 1.5 }}>
                  A modern realtime chat experience designed to feel natural, fluid, and secure. Built for teams and communities.
                </Text>
                
                <Flex gap="4" mt="4" wrap="wrap">
                  <Tooltip.Provider delayDuration={200}>
                    {user ? (
                      <Button asChild size="4" variant="solid" color="ruby" radius="medium" style={{ cursor: "pointer" }}>
                        <Link 
                          to="/chat" 
                          onMouseEnter={() => setHoveredBtn('chat')}
                          onMouseLeave={() => setHoveredBtn(null)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
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
                    ) : (
                      <>
                        <Button asChild size="4" variant="solid" color="ruby" radius="medium" style={{ cursor: "pointer" }}>
                          <Link 
                            to="/signup" 
                            onMouseEnter={() => setHoveredBtn('signup')}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
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
                        <Button asChild size="4" variant="surface" color="gray" radius="medium" style={{ cursor: "pointer" }}>
                          <Link 
                            to="/login" 
                            onMouseEnter={() => setHoveredBtn('login')}
                            onMouseLeave={() => setHoveredBtn(null)}
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}
                          >
                            <span>Login</span>
                            <MorphIcon 
                              icon={hoveredBtn === 'login' ? ArrowRight : LogIn} 
                              size={20} 
                              spring="snappy"
                              aria-hidden="true"
                            />
                          </Link>
                        </Button>
                      </>
                    )}
                  </Tooltip.Provider>
                </Flex>
              </Flex>
            </motion.div>

            <motion.div 
              initial={reduce ? false : { opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            >
              <Box className="hero-visual-inner" style={{ padding: 0, border: '1px solid var(--gray-a4)' }}>
                <img 
                  src="/hero.png" 
                  alt="Meoww Chat Interface Preview" 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                />
              </Box>
            </motion.div>
          </Grid>
        </Container>
      </Section>

      {/* Bento Grid Features Section */}
      <Section size="3">
        <Container size="4">
          <Flex direction="column" gap="6">
            <Flex direction="column" gap="3" align="center" style={{ textAlign: 'center' }}>
              <Heading size="7">Built for modern communication</Heading>
              <Text size="4" color="gray" style={{ maxWidth: '600px' }}>
                Everything you need to stay connected, without the clutter. Designed with a focus on speed, privacy, and aesthetics.
              </Text>
            </Flex>

            <Grid columns={{ initial: '1', md: '3' }} gap="4" className="bento-grid">
              <Card size="3" className="bento-card col-span-md-2" variant="surface" style={{ position: 'relative', overflow: 'hidden' }}>
                <Flex direction="column" gap="3" height="100%" style={{ position: 'relative', zIndex: 1 }}>
                  <Flex align="center" justify="center" className="bento-icon-wrapper" style={{ background: 'var(--ruby-a3)' }}>
                    <MorphIcon icon={Zap} size={24} color="var(--ruby-11)" />
                  </Flex>
                  <Heading size="5">Realtime Sync</Heading>
                  <Text size="3" color="gray">
                    Messages are delivered instantly using WebSockets. No polling, no delays. Experience fluid conversations that keep up with your thoughts.
                  </Text>
                </Flex>
              </Card>

              <Card size="3" className="bento-card" variant="surface" style={{ position: 'relative', overflow: 'hidden' }}>
                <Flex direction="column" gap="3" height="100%" style={{ position: 'relative', zIndex: 1 }}>
                  <Flex align="center" justify="center" className="bento-icon-wrapper" style={{ background: 'var(--cyan-a3)' }}>
                    <MorphIcon icon={Globe} size={24} color="var(--cyan-11)" />
                  </Flex>
                  <Heading size="5">Anywhere</Heading>
                  <Text size="3" color="gray">
                    Access your chats from any device. Fully responsive design that works beautifully on mobile, tablet, and desktop.
                  </Text>
                </Flex>
              </Card>

              <Card size="3" className="bento-card" variant="surface" style={{ position: 'relative', overflow: 'hidden' }}>
                <Flex direction="column" gap="3" height="100%" style={{ position: 'relative', zIndex: 1 }}>
                  <Flex align="center" justify="center" className="bento-icon-wrapper" style={{ background: 'var(--gray-a3)' }}>
                    <MorphIcon icon={Moon} size={24} color="var(--gray-12)" />
                  </Flex>
                  <Heading size="5">Dark Mode</Heading>
                  <Text size="3" color="gray">
                    A gorgeous dark mode that's easy on the eyes. Seamlessly integrates with your system preferences.
                  </Text>
                </Flex>
              </Card>

              <Card size="3" className="bento-card col-span-md-2" variant="surface" style={{ position: 'relative', overflow: 'hidden' }}>
                <Flex direction="column" gap="3" height="100%" style={{ position: 'relative', zIndex: 1 }}>
                  <Flex align="center" justify="center" className="bento-icon-wrapper" style={{ background: 'var(--tomato-a3)' }}>
                    <MorphIcon icon={Shield} size={24} color="var(--tomato-11)" />
                  </Flex>
                  <Heading size="5">Privacy First</Heading>
                  <Text size="3" color="gray">
                    Your data is yours. Secure authentication via email OTP ensures that only you have access to your account and messages.
                  </Text>
                </Flex>
              </Card>
            </Grid>
          </Flex>
        </Container>
      </Section>
    </div>
  );
};
