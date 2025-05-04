import React from "react";

const ProfileSection = React.memo(({ title, children }) => {
  // Render section only if it has children to display
  if (!React.Children.count(children)) {
    return null;
  }

  return (
    <section
      className="bg-white p-5 sm:p-6 rounded-xl shadow-md border border-gray-200 mb-6 last:mb-0 dark:bg-gray-800 dark:border-gray-700"
      aria-labelledby={`section-title-${title.replace(/\s+/g, "-")}`}
    >
      <h2
        id={`section-title-${title.replace(/\s+/g, "-")}`}
        className="text-lg sm:text-xl font-semibold text-gray-700 mb-4 border-b border-gray-200 pb-3 dark:text-white dark:border-gray-600"
      >
        {title}
      </h2>
      {/* Use space-y for consistent vertical spacing between fields */}
      <div className="space-y-4">{children}</div>
    </section>
  );
});

export default ProfileSection;
