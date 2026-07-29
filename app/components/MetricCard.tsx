export function MetricCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail: string;
  tone?: "positive";
}) {
  return (
    <article className={`metric-card ${tone ?? ""}`}>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
      <span>{detail}</span>
    </article>
  );
}
