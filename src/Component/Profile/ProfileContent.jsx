import React from "react";
import ProfileSection from "./ProfileSection"; // Assuming path
import ProfileFieldDisplay from "./ProfileFieldDisplay"; // Assuming path
import ProfileFieldEdit from "./ProfileFieldEdit"; // Assuming path
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

// Helper to get nested value (can be moved to utils)
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

// Map icon names from config to actual components
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

const ProfileContent = React.memo(
  ({
    viewedUser,
    profileFormData,
    isEditing,
    isSaving,
    handleFieldChange,
    fieldConfig,
  }) => {
    const renderField = (field) => {
      const IconComponent =
        typeof field.Icon === "string" ? iconMap[field.Icon] : field.Icon; // Map string name to component if needed
      const value = isEditing
        ? getNestedValue(profileFormData, field.name)
        : getNestedValue(viewedUser, field.name);

      return isEditing ? (
        <ProfileFieldEdit
          key={`${field.name}-edit`}
          label={field.label}
          name={field.name}
          value={value}
          onChange={handleFieldChange}
          type={field.type}
          placeholder={field.placeholder}
          disabled={isSaving || !field.editable}
          Icon={IconComponent} // Pass component
          rows={field.type === "textarea" ? 4 : undefined} // Example rows
        />
      ) : (
        // Only render display field if it has a value or if it's the bio field (always show bio section)
        (value || field.name === "bio") && (
          <ProfileFieldDisplay
            key={`${field.name}-display`}
            label={field.label}
            value={value}
            type={field.type}
            Icon={IconComponent} // Pass component
          />
        )
      );
    };

    const renderSection = (title, fields) => {
      const content = fields.map(renderField).filter(Boolean); // Render fields and remove nulls (empty display fields)

      // Only render section if editing OR if there's content to display
      if (isEditing || content.length > 0) {
        return (
          <ProfileSection title={title} key={title}>
            {content}
            {/* Add hint for non-editable fields in basic info when editing */}
            {isEditing && title === "Basic Information" && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 pl-1">
                Username and Email cannot be changed here.
              </p>
            )}
          </ProfileSection>
        );
      }
      // Add placeholder message if section is empty in view mode
      if (!isEditing && content.length === 0 && title !== "Basic Information") {
        // Exclude basic info placeholder generally
        return (
          <ProfileSection title={title} key={title}>
            <p className="text-sm text-gray-500 dark:text-gray-400 italic">
              No {title.toLowerCase()} information provided.
            </p>
          </ProfileSection>
        );
      }
      return null;
    };

    return (
      <div className="space-y-6">
        {renderSection("Basic Information", fieldConfig.basicInfo)}
        {renderSection(
          "Professional & Academic Info",
          fieldConfig.professionalInfo
        )}
        {renderSection("Social & Online Presence", fieldConfig.socialLinks)}
      </div>
    );
  }
);

export default ProfileContent;
