'use client';

interface StatusBarProps {
  status: string;
}

const steps = [
  { key: 'Order Placed', label: 'Order Placed', icon: '📋' },
  { key: 'Packed', label: 'Packed', icon: '📦' },
  { key: 'Out for Delivery', label: 'Out for Delivery', icon: '🚚' },
  { key: 'Delivered', label: 'Delivered', icon: '✅' },
];

export default function OrderStatusBar({ status }: StatusBarProps) {
  const currentIndex = steps.findIndex((s) => s.key === status);

  return (
    <div className="status-progress">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div className="status-step" key={step.key}>
            <div className="status-dot-container">
              <div className={`status-dot ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}>
                {isCompleted ? '✓' : step.icon}
              </div>
              {index < steps.length - 1 && (
                <div className={`status-line ${isCompleted ? 'completed' : ''}`} />
              )}
            </div>
            <div className="status-text">
              <h4 style={{ color: isActive ? 'var(--primary)' : isCompleted ? 'var(--success)' : 'var(--text-muted)' }}>
                {step.label}
              </h4>
              <p>
                {isCompleted ? 'Completed' : isActive ? 'In Progress...' : 'Pending'}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
