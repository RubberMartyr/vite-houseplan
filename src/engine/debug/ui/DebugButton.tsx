type Props = {
  isOpen: boolean;
  onClick: () => void;
};

export function DebugButton({ isOpen, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Toggle debug dashboard"
      title="Debug dashboard"
      style={{
        position: 'absolute',
        top: 20,
        right: 20,
        width: 58,
        height: 58,
        borderRadius: '50%',
        border: `1px solid ${isOpen ? 'rgba(191, 219, 254, 0.85)' : 'rgba(191, 219, 254, 0.35)'}`,
        background: isOpen ? 'rgba(30, 58, 138, 0.95)' : 'rgba(17, 24, 39, 0.9)',
        color: '#f9fafb',
        fontSize: 24,
        fontWeight: 700,
        cursor: 'pointer',
        boxShadow: '0 10px 24px rgba(0, 0, 0, 0.35)',
        zIndex: 2000,
        transition: 'transform 150ms ease, filter 150ms ease, border-color 150ms ease',
      }}
      onMouseEnter={(event) => {
        event.currentTarget.style.transform = 'scale(1.07)';
        event.currentTarget.style.filter = 'brightness(1.12)';
      }}
      onMouseLeave={(event) => {
        event.currentTarget.style.transform = 'scale(1)';
        event.currentTarget.style.filter = 'brightness(1)';
      }}
    >
      🛠
    </button>
  );
}
