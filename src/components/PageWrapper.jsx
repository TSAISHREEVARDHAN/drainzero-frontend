import React from 'react';
import { motion } from 'framer-motion';

const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.22, ease: 'easeInOut' }}
    style={{ minHeight: '100%' }}
  >
    {children}
  </motion.div>
);

export default PageWrapper;
