export default function DashboardCard({ label, Icon, value, unit, description }) {
  return (
    <div className="card">
      <div className="card-header">
        <div className="label-with-icon">
          {Icon ? <Icon className="card-label-icon" /> : null}
          <span>{label}</span>
        </div>
        <span className="unit">{unit}</span>
      </div>
      <div className="card-value">{value}</div>
      <p className="card-description">{description}</p>
    </div>
  );
}
