interface DurationPresetsProps {
  currentDuration: number;
  onSelect: (seconds: number) => void;
  disabled: boolean;
}

const PRESETS = [
  { label: '5m', seconds: 5 * 60 },
  { label: '10m', seconds: 10 * 60 },
  { label: '15m', seconds: 15 * 60 },
  { label: '20m', seconds: 20 * 60 },
  { label: '25m', seconds: 25 * 60 },
];

export function DurationPresets({
  currentDuration,
  onSelect,
  disabled,
}: DurationPresetsProps) {
  return (
    <div className="duration-presets" role="group" aria-label="Duration presets">
      {PRESETS.map(({ label, seconds }) => (
        <button
          key={seconds}
          className={`preset-pill ${currentDuration === seconds ? 'preset-pill--active' : ''}`}
          onClick={() => onSelect(seconds)}
          disabled={disabled}
          aria-pressed={currentDuration === seconds}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
