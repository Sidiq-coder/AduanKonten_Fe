import { useState } from 'react';

export function ImageWithFallback({ src, alt, className = "", style, ...props }) {
  const [hasError, setHasError] = useState(false);

  const handleError = () => {
    setHasError(true);
  };

  if (hasError) {
    return (
      <div className={`inline-block bg-gray-200 ${className}`} style={style}>
        <div className="flex items-center justify-center w-full h-full">
          <span className="text-gray-500 text-xs">Failed to load image</span>
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      onError={handleError}
      {...props}
    />
  );
}
