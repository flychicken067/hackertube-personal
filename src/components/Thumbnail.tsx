interface ThumbnailProps {
  vid: string;
  title: string;
  className?: string;
}

export function Thumbnail({ vid, title, className }: ThumbnailProps) {
  const [step, setStep] = useState(0);
  const sources = [
    `https://i.ytimg.com/vi/${vid}/hq2.jpg`,
    `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`,
    './thumb-placeholder.svg',
  ];

  return (
    <img
      className={className}
      src={sources[step]}
      alt={title}
      loading="lazy"
      decoding="async"
      onError={() => setStep((current) => Math.min(current + 1, sources.length - 1))}
    />
  );
}
import { useState } from 'react';

