import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Flex, Card, Heading, Text } from "@radix-ui/themes";

export const AuthShell = ({ children }: { children: ReactNode }) => {
  return (
    <Flex 
      className="page-container"
      align="center"
      justify="center"
      style={{ overflow: "hidden" }}
    >
      <div 
        style={{
          position: "absolute",
          width: "600px",
          height: "600px",
          background: "radial-gradient(circle, var(--ruby-a3) 0%, rgba(0, 0, 0, 0) 70%)",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          pointerEvents: "none"
        }}
      />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ width: "100%", maxWidth: "420px", zIndex: 1 }}
      >
        {children}
      </motion.div>
    </Flex>
  );
};

export const AuthHeading = ({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) => {
  return (
    <Flex direction="column" gap="2" mb="6" align="center">
      <Heading size="7" weight="bold" style={{ 
        background: "linear-gradient(to right, var(--ruby-9), var(--ruby-11))",
        WebkitBackgroundClip: "text",
        WebkitTextFillColor: "transparent"
      }}>
        {title}
      </Heading>
      {subtitle && (
        <Text size="3" color="gray">
          {subtitle}
        </Text>
      )}
    </Flex>
  );
};

export const AuthCard = ({ children }: { children: ReactNode }) => {
  return (
    <Card size="4" style={{ 
      boxShadow: "0 8px 32px var(--ruby-a3)", 
      border: "1px solid var(--gray-a4)",
      backgroundColor: "var(--color-panel-solid)"
    }}>
      {children}
    </Card>
  );
};
