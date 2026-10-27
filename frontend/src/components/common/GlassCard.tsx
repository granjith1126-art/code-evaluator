import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className = '',
  glow = false,
  ...props
}) => {
  return (
    <div
      className={`glass-card rounded-2xl p-5 ${
        glow ? 'border-indigo-500/40 shadow-indigo-500/10 shadow-lg' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
