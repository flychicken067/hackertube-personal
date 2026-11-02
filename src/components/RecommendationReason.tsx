export function RecommendationReason({ children }: { children: string }) {
  return <p className="recommendation-reason"><span aria-hidden="true">✦</span>{children}</p>;
}
