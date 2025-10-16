import React, { ReactNode } from 'react';
import { motion } from 'framer-motion';

const PageWrapper = ({ children }: { children: ReactNode }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
      style={{ padding: 20 }}
    >
      {children}
    </motion.div>
  );
};

export default PageWrapper;
