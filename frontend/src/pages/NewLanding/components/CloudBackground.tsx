//@ts-nocheck

import { motion } from "framer-motion";

export function CloudBackground() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 2 }}
      >
        {[...Array(5)].map((_, i) => (
          <motion.img
            key={i}
            src="/images/cloud.svg"
            className="absolute"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              width: `${50 + Math.random() * 100}px`,
              opacity: 0.1 + Math.random() * 0.2,
            }}
            animate={{
              x: [0, Math.random() * 100 - 50],
              y: [0, Math.random() * 50 - 25],
            }}
            transition={{
              repeat: Number.POSITIVE_INFINITY,
              repeatType: "reverse",
              duration: 20 + Math.random() * 10,
            }}
          />
        ))}
      </motion.div>
    </div>
  );
}
