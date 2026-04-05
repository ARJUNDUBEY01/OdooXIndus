// components/ERPActionBar.tsx
// RevFlow — ERP style action bar and state tracking

import React from 'react';

interface ERPActionBarProps {
  states: string[];
  currentState: string;
  onAction?: (actionFn: string) => void;
  primaryActionText?: string;
  secondaryActions?: { label: string; action: string }[];
}

export default function ERPActionBar({
  states,
  currentState,
  onAction,
  primaryActionText = 'New',
  secondaryActions = [],
}: ERPActionBarProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0.75rem 1rem',
        background: 'var(--bg-secondary)', // slightly lighter or same as bg
        borderBottom: '1px solid var(--border)',
        marginBottom: '1.5rem',
      }}
    >
      {/* Left: Actions */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        <button
          className="btn-primary"
          style={{ padding: '0.4rem 1rem', fontSize: '0.875rem' }}
          onClick={() => onAction && onAction('primary')}
        >
          {primaryActionText}
        </button>

        {/* Small icon actions */}
        <div style={{ display: 'flex', gap: '4px', borderLeft: '1px solid var(--border)', paddingLeft: '0.75rem' }}>
          <button style={iconBtnStyle} onClick={() => onAction && onAction('delete')}>🗑️</button>
          <button style={iconBtnStyle} onClick={() => onAction && onAction('print')}>🖨️</button>
        </div>

        {secondaryActions.length > 0 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
            {secondaryActions.map(action => (
              <button
                key={action.action}
                className="btn-secondary"
                style={{ padding: '0.3rem 0.8rem', fontSize: '0.8rem' }}
                onClick={() => onAction && onAction(action.action)}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right: State Tracker */}
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {states.map((state, index) => {
          const isCurrent = state === currentState;
          const isPast = states.indexOf(state) < states.indexOf(currentState);
          
          return (
            <React.Fragment key={state}>
              <div
                style={{
                  padding: '4px 12px',
                  borderRadius: '16px',
                  fontSize: '0.75rem',
                  fontWeight: isCurrent ? 700 : 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  color: isCurrent ? '#fff' : (isPast ? 'var(--text-secondary)' : 'var(--text-muted)'),
                  background: isCurrent ? 'var(--gradient-1)' : 'transparent',
                  border: isCurrent ? 'none' : '1px solid var(--border)',
                }}
              >
                {state}
              </div>
              {index < states.length - 1 && (
                <div style={{ width: '20px', height: '1px', background: 'var(--border)', margin: '0 4px' }} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

const iconBtnStyle: React.CSSProperties = {
  background: 'transparent',
  border: '1px solid var(--border)',
  color: 'var(--text-secondary)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  height: '32px',
  width: '32px',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s',
};
