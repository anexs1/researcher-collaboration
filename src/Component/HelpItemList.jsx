import React from "react";
import FAQItem from "./FAQItem.jsx";
import TutorialItem from "./TutorialItem.jsx";
import { motion, AnimatePresence } from "framer-motion"; // For item animations

function HelpItemList({ items }) {
  if (!items || items.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-16 h-16 mx-auto text-slate-400 mb-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.182 16.318A4.5 4.5 0 0 0 18 12a4.5 4.5 0 0 0-3.818-4.318m-3.536 0M10.5 17.25h.008v.008h-.008v-.008Zm.36-3.822a.75.75 0 0 0-.18.018L9.25 13.9a.75.75 0 1 0 1.06 1.061l.516-.516a.75.75 0 0 0 .018-.18Zm.36-3.822L9.25 10.075a.75.75 0 0 0-1.06 1.06l.516.516a.75.75 0 0 0 .18.018h.445a.75.75 0 0 0 .18-.018l.516-.516a.75.75 0 0 0-1.06-1.06Z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9.75a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Zm0 0H12M12 17.25H12M6 12a6 6 0 1 1 12 0a6 6 0 0 1-12 0Z"
          />
        </svg>
        <p className="text-xl font-semibold text-slate-700 mb-2">
          No Articles Found
        </p>
        <p className="text-slate-500">
          We couldn't find any help articles matching your criteria. Try
          adjusting your search or selecting a different category.
        </p>
      </div>
    );
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: (i) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: i * 0.05, // Stagger animation
        duration: 0.3,
        ease: "easeOut",
      },
    }),
  };

  return (
    <div className="space-y-5">
      <AnimatePresence>
        {items.map((item, index) => (
          <motion.div
            key={item.id || `item-${index}`} // Ensure a unique key
            custom={index}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
            exit="hidden" // For future use if items can be removed dynamically
            layout // Animates layout changes if items are reordered/removed
          >
            {item.type === "faq" ? (
              <FAQItem item={item} />
            ) : item.type === "tutorial" ? (
              <TutorialItem item={item} />
            ) : null}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

export default HelpItemList;
