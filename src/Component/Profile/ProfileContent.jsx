import React from "react";
import ProfileSection from "./ProfileSection";
import ProfileFieldDisplay from "./ProfileFieldDisplay";
import ProfileFieldEdit from "./ProfileFieldEdit";

// Icon Map: If your fieldConfig in Profile.jsx passes icon names as strings,
// this map is used to resolve them to actual icon components.
// If fieldConfig passes the components directly (e.g., Icon: FaUser), this map is less critical
// but can serve as a fallback or for clarity.
import {
  FaUser,
  FaEnvelope,
  FaInfoCircle,
  FaUniversity,
  FaBuilding,
  FaBriefcase,
  FaUserMd,
  FaHospital,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
} from "react-icons/fa";

const iconMap = {
  FaUser,
  FaEnvelope,
  FaInfoCircle,
  FaUniversity,
  FaBuilding,
  FaBriefcase,
  FaUserMd,
  FaHospital,
  FaLinkedin,
  FaGithub,
  FaTwitter,
  FaGlobe,
};

// Helper to get nested value (can be moved to utils if used elsewhere)
const getNestedValue = (obj, path, defaultValue = "") => {
  if (!obj || typeof obj !== "object") return defaultValue;
  return (
    path
      .split(".")
      .reduce(
        (acc, part) => (acc && typeof acc === "object" ? acc[part] : undefined),
        obj
      ) ?? defaultValue
  );
};

const ProfileContent = React.memo(
  ({
    viewedUserOriginalData, // Used for displaying data when not editing
    profileFormData, // Used for populating form fields when editing
    isEditing,
    isSaving,
    handleFieldChange,
    fieldConfig, // This will be passed from Profile.jsx and will NOT contain skillsSection
  }) => {
    const renderField = (field) => {
      // Resolve Icon: Use directly if component, map from string if name
      const IconComponent =
        typeof field.Icon === "string" ? iconMap[field.Icon] : field.Icon;

      if (isEditing) {
        const editValue = getNestedValue(profileFormData, field.name);
        return (
          <ProfileFieldEdit
            key={`${field.name}-edit`}
            label={field.label}
            name={field.name}
            value={editValue}
            onChange={handleFieldChange}
            type={field.type || "text"}
            placeholder={field.placeholder}
            disabled={isSaving || !field.editable}
            Icon={IconComponent}
            rows={field.type === "textarea" ? 4 : undefined}
          />
        );
      } else {
        const displayValue = getNestedValue(viewedUserOriginalData, field.name);
        // Show field in view mode if it has a value,
        // or it's a non-editable basic info field (username/email),
        // or it's the bio field.
        const alwaysShowInView =
          field.name === "bio" ||
          fieldConfig.basicInfo.some(
            (f) => f.name === field.name && !f.editable
          );

        if (displayValue || alwaysShowInView) {
          return (
            <ProfileFieldDisplay
              key={`${field.name}-display`}
              label={field.label}
              value={displayValue}
              type={field.type} // Pass type for special rendering (e.g., URL, skills if it were present)
              Icon={IconComponent}
            />
          );
        }
        return null; // Don't render the field if it's empty and not designated to always show
      }
    };

    const renderSection = (title, fields, sectionKey) => {
      if (!fields || fields.length === 0) {
        // Added check for undefined/empty fields array
        return null;
      }
      // Map fields to their rendered components
      const renderedFields = fields.map(renderField).filter(Boolean);

      // Only render the section if there are fields to display, or if in edit mode (to show empty inputs)
      if (renderedFields.length > 0 || isEditing) {
        return (
          <ProfileSection
            title={title}
            key={sectionKey}
            sectionKey={sectionKey}
          >
            {/* Apply grid layout to the fields within this section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
              {/* Show inputs even if empty in edit mode by re-mapping if renderedFields is empty */}
              {renderedFields.length > 0
                ? renderedFields
                : isEditing
                ? fields.map(renderField)
                : null}
            </div>
            {isEditing && sectionKey === "basicInfo" && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-4">
                Username and Email are typically managed by system
                administrators.
              </p>
            )}
          </ProfileSection>
        );
      }
      // Optional: Placeholder for an entirely empty section in view mode
      if (
        !isEditing &&
        renderedFields.length === 0 &&
        sectionKey !== "basicInfo"
      ) {
        return (
          <ProfileSection
            title={title}
            key={`${sectionKey}-empty`}
            sectionKey={sectionKey}
          >
            <div className="grid grid-cols-1">
              <p className="text-sm text-slate-500 dark:text-slate-400 italic py-2">
                No {title.toLowerCase().replace(" & ", " or ")} information
                provided.
              </p>
            </div>
          </ProfileSection>
        );
      }
      return null;
    };

    return (
      <div className="space-y-10">
        {" "}
        {/* Increased spacing between sections */}
        {/* These sections will render based on the `profileFieldConfig` passed from Profile.jsx */}
        {/* If a section (e.g., skillsSection) is missing from fieldConfig, it won't be rendered here. */}
        {fieldConfig.basicInfo &&
          renderSection(
            "Basic Information",
            fieldConfig.basicInfo,
            "basicInfo"
          )}
        {fieldConfig.professionalInfo &&
          renderSection(
            "Professional & Academic Info",
            fieldConfig.professionalInfo,
            "professionalInfo"
          )}
        {/* The skillsSection line is now effectively removed because fieldConfig.skillsSection will be undefined */}
        {fieldConfig.socialLinks &&
          renderSection(
            "Social & Online Presence",
            fieldConfig.socialLinks,
            "socialLinks"
          )}
      </div>
    );
  }
);

export default ProfileContent;
