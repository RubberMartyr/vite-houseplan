import { useEffect, useState } from 'react';

type RoomInfoCardProps = {
  roomName: string | null;
  levelName?: string | null;
};

const TRANSITION_MS = 220;

export function RoomInfoCard({ roomName, levelName }: RoomInfoCardProps) {
  const [isMounted, setIsMounted] = useState(Boolean(roomName));
  const [isVisible, setIsVisible] = useState(Boolean(roomName));

  useEffect(() => {
    if (roomName) {
      setIsMounted(true);
      requestAnimationFrame(() => setIsVisible(true));
      return;
    }

    setIsVisible(false);
    const timeoutId = window.setTimeout(() => {
      setIsMounted(false);
    }, TRANSITION_MS);

    return () => window.clearTimeout(timeoutId);
  }, [roomName]);

  if (!isMounted || !roomName) {
    return null;
  }

  return (
    <aside
      style={{
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 12,
        minWidth: 188,
        padding: '12px 14px',
        borderRadius: 14,
        background: 'rgba(14, 22, 34, 0.62)',
        border: '1px solid rgba(164, 205, 255, 0.32)',
        boxShadow: '0 14px 28px rgba(4, 9, 16, 0.35)',
        backdropFilter: 'blur(12px)',
        color: '#f3f7ff',
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(-8px)',
        transition: `opacity ${TRANSITION_MS}ms ease, transform ${TRANSITION_MS}ms ease`,
        pointerEvents: 'none',
      }}
    >
      <div style={{ fontSize: 11, letterSpacing: 1.1, textTransform: 'uppercase', opacity: 0.72 }}>Selected</div>
      <div style={{ marginTop: 6, fontSize: 18, fontWeight: 700 }}>{roomName}</div>
      {levelName ? <div style={{ marginTop: 3, fontSize: 12, opacity: 0.8 }}>{levelName}</div> : null}
    </aside>
  );
}
