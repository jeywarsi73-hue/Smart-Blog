import React, { useState } from 'react';
import { BookOpen } from 'lucide-react';

interface EditorialImageProps {
  src?: string;
  alt: string;
  className?: string;
  containerClassName?: string;
}

export const EditorialImage: React.FC<EditorialImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  containerClassName = '',
}) => {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`bg-[#EFEAE0] border border-stone-200 flex flex-col items-center justify-center p-6 text-center ${containerClassName}`}
        role="img"
        aria-label={alt}
      >
        <BookOpen className="w-7 h-7 text-stone-400 mb-2" strokeWidth={1.5} />
        <span className="font-editorial text-sm text-stone-500 max-w-xs line-clamp-2">{alt}</span>
      </div>
    );
  }

  return (
    <div className={`overflow-hidden bg-[#EFEAE0] ${containerClassName}`}>
      <img
        src={src}
        alt={alt}
        referrerPolicy="no-referrer"
        onError={() => setFailed(true)}
        className={className}
      />
    </div>
  );
};
