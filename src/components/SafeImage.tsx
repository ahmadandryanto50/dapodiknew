import React, { useState, useEffect } from 'react';
import { formatImageUrl } from '../utils/imageUtils';

interface SafeImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src?: string | null;
  fallbackSrc?: string;
  fallbackNode?: React.ReactNode;
}

export const SafeImage: React.FC<SafeImageProps> = ({
  src,
  fallbackSrc = '/logo_smpn11palu.jpg',
  fallbackNode,
  alt = 'Gambar',
  className = '',
  onError,
  ...props
}) => {
  const [hasError, setHasError] = useState(false);
  const formattedSrc = formatImageUrl(src, fallbackSrc);

  useEffect(() => {
    setHasError(false);
  }, [src]);

  if (hasError || !src || src.trim() === '') {
    if (fallbackNode) {
      return <>{fallbackNode}</>;
    }
    return (
      <img
        src={fallbackSrc}
        alt={alt}
        className={className}
        referrerPolicy="no-referrer"
        {...props}
      />
    );
  }

  return (
    <img
      src={formattedSrc}
      alt={alt}
      className={className}
      referrerPolicy="no-referrer"
      onError={(e) => {
        setHasError(true);
        if (onError) onError(e);
      }}
      {...props}
    />
  );
};
