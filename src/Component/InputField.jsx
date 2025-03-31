import React from "react";

const InputField = ({
  type,
  id,
  name = id, // Default name to id if not provided
  value,
  onChange,
  placeholder,
  formColor = "blue",
  required = false,
  minLength,
  ...props
}) => {
  return (
    <div className="relative">
      <input
        type={type}
        id={id}
        name={name}
        value={value}
        onChange={onChange}
        required={required}
        minLength={minLength}
        className={`block w-full p-3 mt-2 text-gray-900 placeholder-transparent border rounded-md focus:outline-none focus:ring-2 focus:ring-${formColor} focus:border-${formColor} appearance-none bg-transparent peer`}
        placeholder={placeholder}
        {...props}
      />
      <label
        htmlFor={id}
        className="absolute top-0 left-0 -mt-2 ml-3 text-gray-500 text-sm transition-all duration-300 pointer-events-none peer-placeholder-shown:text-base peer-placeholder-shown:mt-0 peer-placeholder-shown:ml-3 peer-focus:-mt-2 peer-focus:ml-3 peer-focus:text-sm"
      >
        {placeholder}
      </label>
    </div>
  );
};

export default InputField;
