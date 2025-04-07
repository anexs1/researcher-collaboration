export const LoadingSkeleton = ({
  height = "h-4",
  width = "w-full",
  className = "",
}) => {
  return (
    <div
      className={`bg-gray-300 rounded animate-pulse ${height} ${width} ${className}`}
    ></div>
  );
};
export default LoadingSkeleton;
