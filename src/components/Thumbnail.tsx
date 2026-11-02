import { useEffect, useState } from 'react';

interface ThumbnailProps {
  vid: string;
  title: string;
  className?: string;
  mode?: 'frame' | 'upload';
}

export function Thumbnail({ vid, title, className, mode = 'frame' }: ThumbnailProps) {
  const [step, setStep] = useState(0);
  const frame = `https://i.ytimg.com/vi/${vid}/hq2.jpg`;
  const upload = `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`;
  const sources = mode === 'frame' ? [
    frame,
    upload,
    './thumb-placeholder.svg',
  ] : [
    upload,
    frame,
    './thumb-placeholder.svg',
  ];

  useEffect(() => setStep(0), [mode, vid]);

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
