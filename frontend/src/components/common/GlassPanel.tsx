import React from 'react';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  elevated?: boolean;
  className?: string;
}

export const GlassPanel: React.FC<GlassPanelProps> = ({
  children,
  elevated = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`rounded-2xl transition-all duration-300 ${
        elevated ? 'glass-panel-elevated' : 'glass-panel'
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
