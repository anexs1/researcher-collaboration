import React from "react";

const ProfileSection = React.memo(({ title, children, sectionKey }) => {
  // sectionKey is added for more robust keying if needed, title can be used if unique
  const titleId = `section-title-${(sectionKey || title)
    .replace(/\s+/g, "-")
    .toLowerCase()}`;

  // Render section only if it has children with actual content to display (filter out null/undefined children)
  const validChildren = React.Children.toArray(children).filter(Boolean);
  if (validChildren.length === 0) {
    return null;
  }

  return (
    <section
      className="mb-8 last:mb-0" // Removed redundant card styling as parent ProfileContent wrapper handles it
      aria-labelledby={titleId}
    >
      <h2
        id={titleId}
        className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 mb-5 pb-3 border-b border-slate-200 dark:border-slate-700"
      >
        {title}
      </h2>
      {/* Children will determine their own layout (e.g., grid from ProfileContent) */}
      {children}
    </section>
  );
});

export default ProfileSection;
