export default function DashboardCard({ label, value, unit, description }) {
  return (
    <div className="card">
      <div className="card-header">
        <span>{label}</span>
        <span className="unit">{unit}</span>
      </div>
      <div className="card-value">{value}</div>
      <p className="card-description">{description}</p>
    </div>
  );
}
