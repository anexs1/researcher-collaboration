// import React from "react";
// import {
//   FaUser,
//   FaEdit,
//   FaSave,
//   FaSpinner,
//   FaFileUpload,
//   FaGithub,
//   FaLinkedin,
//   FaTwitter,
// } from "react-icons/fa";
// import ErrorMessage from "../Common/ErrorMessage"; // Adjust path if necessary

// // Helper to render individual profile fields
// const renderProfileField = (
//   label,
//   name,
//   value,
//   type = "text",
//   isEditing,
//   onChange,
//   options = {}
// ) => {
//   const commonInputClasses = `mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100 disabled:text-gray-500`;
//   const displayValue =
//     value ||
//     (isEditing ? "" : <span className="text-gray-500 italic">Not set</span>);
//   const { Icon, isNested = false, section = "", isDisabled = false } = options;
//   const handleChange = isNested ? (e) => onChange(e, section) : onChange;

//   return (
//     <div key={name}>
//       <label
//         htmlFor={`profile-${name}`}
//         className="block text-sm font-medium text-gray-700 flex items-center"
//       >
//         {Icon && <Icon className="mr-2 h-4 w-4 text-gray-500" />}
//         {label}
//       </label>
//       {isEditing ? (
//         type === "textarea" ? (
//           <textarea
//             id={`profile-${name}`}
//             name={name}
//             value={value || ""}
//             onChange={handleChange}
//             rows="3"
//             className={commonInputClasses}
//             placeholder={`Enter your ${label.toLowerCase()}`}
//             disabled={isDisabled}
//           />
//         ) : (
//           <input
//             type={type}
//             id={`profile-${name}`}
//             name={name}
//             value={value || ""}
//             onChange={handleChange}
//             className={commonInputClasses}
//             placeholder={`Enter your ${label.toLowerCase()}`}
//             disabled={isDisabled}
//           />
//         )
//       ) : (
//         <p className="mt-1 text-sm text-gray-900 min-h-[38px] py-2 px-3 border border-transparent break-words">
//           {type === "url" && value ? (
//             <a
//               href={value.startsWith("http") ? value : `https://${value}`}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="text-blue-600 hover:underline"
//             >
//               {value}
//             </a>
//           ) : (
//             displayValue
//           )}
//         </p>
//       )}
//     </div>
//   );
// };

// export default function UserProfileCard({
//   profileData,
//   isEditing,
//   isSaving,
//   newProfileImage,
//   apiError,
//   fileInputRef,
//   onInputChange,
//   onNestedInputChange,
//   onImageChange,
//   triggerFileInput,
//   onSave,
//   onCancel,
//   onEditToggle,
// }) {
//   if (!profileData) {
//     return (
//       <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8 animate-pulse">
//         <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
//         <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
//         <div className="h-4 bg-gray-300 rounded w-5/6"></div>
//       </div>
//     );
//   }

//   const defaultAvatar = "/default-avatar.png";

//   return (
//     <div className="bg-white shadow-xl rounded-lg p-6 md:p-8 mb-8">
//       <div className="flex justify-between items-center mb-4 border-b pb-2">
//         <h2 className="text-xl font-semibold text-gray-700 flex items-center">
//           <FaUser className="mr-2" /> User Profile
//         </h2>
//         {!isEditing ? (
//           <button
//             onClick={onEditToggle}
//             className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//           >
//             <FaEdit className="mr-1 -ml-1 h-4 w-4" /> Edit Profile
//           </button>
//         ) : (
//           <div className="space-x-2">
//             <button
//               onClick={onSave}
//               disabled={isSaving}
//               className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
//             >
//               {isSaving ? (
//                 <FaSpinner className="animate-spin mr-1 -ml-1 h-4 w-4" />
//               ) : (
//                 <FaSave className="mr-1 -ml-1 h-4 w-4" />
//               )}
//               {isSaving ? "Saving..." : "Save"}
//             </button>
//             <button
//               onClick={onCancel}
//               disabled={isSaving}
//               className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//             >
//               Cancel
//             </button>
//           </div>
//         )}
//       </div>

//       {apiError && isEditing && (
//         <ErrorMessage message={apiError} isProfileError={true} />
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
//         {/* Profile Picture */}
//         <div className="md:col-span-1 flex flex-col items-center">
//           <label className="block text-sm font-medium text-gray-700 mb-2">
//             Profile Picture
//           </label>
//           <img
//             src={
//               newProfileImage
//                 ? URL.createObjectURL(newProfileImage)
//                 : profileData?.profilePicture || defaultAvatar
//             }
//             alt="Profile"
//             className="h-32 w-32 rounded-full object-cover mb-4 border border-gray-300 shadow-sm"
//             onError={(e) => {
//               e.target.onerror = null;
//               e.target.src = defaultAvatar;
//             }}
//           />
//           {isEditing && (
//             <>
//               <input
//                 type="file"
//                 accept="image/*"
//                 ref={fileInputRef}
//                 onChange={onImageChange}
//                 className="hidden"
//               />
//               <button
//                 type="button"
//                 onClick={triggerFileInput}
//                 className="inline-flex items-center px-3 py-1 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
//               >
//                 <FaFileUpload className="mr-2 h-4 w-4" />
//                 {newProfileImage ? "Change Image" : "Upload Image"}
//               </button>
//               {newProfileImage && (
//                 <span className="mt-2 text-xs text-gray-500 truncate w-full text-center">
//                   {newProfileImage.name}
//                 </span>
//               )}
//             </>
//           )}
//         </div>

//         {/* Profile Details */}
//         <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
//           {renderProfileField(
//             "First Name",
//             "firstName",
//             profileData?.firstName,
//             "text",
//             isEditing,
//             onInputChange
//           )}
//           {renderProfileField(
//             "Last Name",
//             "lastName",
//             profileData?.lastName,
//             "text",
//             isEditing,
//             onInputChange
//           )}
//           {renderProfileField(
//             "Username",
//             "username",
//             profileData?.username,
//             "text",
//             isEditing,
//             onInputChange,
//             { isDisabled: true }
//           )}
//           {renderProfileField(
//             "Email",
//             "email",
//             profileData?.email,
//             "email",
//             isEditing,
//             onInputChange,
//             { isDisabled: true }
//           )}

//           <div className="sm:col-span-2">
//             {renderProfileField(
//               "Bio",
//               "bio",
//               profileData?.bio,
//               "textarea",
//               isEditing,
//               onInputChange
//             )}
//           </div>

//           <div className="sm:col-span-2">
//             <h3 className="text-sm font-medium text-gray-700 mb-1">
//               Social Links
//             </h3>
//             {renderProfileField(
//               "GitHub",
//               "github",
//               profileData?.socialLinks?.github,
//               "url",
//               isEditing,
//               onNestedInputChange,
//               {
//                 Icon: FaGithub,
//                 isNested: true,
//                 section: "socialLinks",
//               }
//             )}
//             {renderProfileField(
//               "LinkedIn",
//               "linkedin",
//               profileData?.socialLinks?.linkedin,
//               "url",
//               isEditing,
//               onNestedInputChange,
//               {
//                 Icon: FaLinkedin,
//                 isNested: true,
//                 section: "socialLinks",
//               }
//             )}
//             {renderProfileField(
//               "Twitter",
//               "twitter",
//               profileData?.socialLinks?.twitter,
//               "url",
//               isEditing,
//               onNestedInputChange,
//               {
//                 Icon: FaTwitter,
//                 isNested: true,
//                 section: "socialLinks",
//               }
//             )}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
