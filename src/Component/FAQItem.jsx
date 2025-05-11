import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

function FAQItem({ item }) {
  const [isOpen, setIsOpen] = useState(false);

  const answerVariants = {
    hidden: {
      opacity: 0,
      height: 0,
      marginTop: 0,
      paddingTop: 0,
      paddingBottom: 0,
    },
    visible: {
      opacity: 1,
      height: "auto",
      marginTop: "1rem", // Match with py-4 on question if needed
      paddingTop: "1rem", // Tailwind's p-4 is 1rem
      paddingBottom: "1rem",
      transition: { duration: 0.3, ease: "easeInOut" },
    },
  };

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden transition-shadow duration-300 hover:shadow-xl">
      <button
        onClick={() => setIsOpen(!isOpen)}
        type="button"
        className="w-full flex justify-between items-center p-5 sm:p-6 text-left text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-expanded={isOpen}
        aria-controls={`faq-answer-${item.id}`}
      >
        <span className="text-lg font-semibold group-hover:text-blue-600 transition-colors">
          {item.title}
        </span>
        <motion.span
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-blue-600"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="m19.5 8.25-7.5 7.5-7.5-7.5"
            />
          </svg>
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            id={`faq-answer-${item.id}`}
            variants={answerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="px-5 sm:px-6 border-t border-slate-200 overflow-hidden" // paddingBottom is handled by motion variants
          >
            {/* If content is markdown, use a markdown renderer. For plain text: */}
            <div className="prose prose-slate max-w-none text-slate-600 leading-relaxed">
              <p>{item.content}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default FAQItem;
