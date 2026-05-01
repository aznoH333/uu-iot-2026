import { Link } from 'react-router-dom';

interface BrandProps {
  className?: string;
  asLink?: boolean;
}

export function Brand({ className = '', asLink = true }: BrandProps) {
  const content = (
    <>
      <svg className="brand-icon" width="24" height="20" viewBox="0 0 32 26" fill="none" aria-hidden="true">
        <path d="M16 0L30 7L16 14L2 7L16 0Z" fill="currentColor" />
        <path d="M5 15L16 21L27 15" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span>AI Assistant</span>
    </>
  );

  if (!asLink) {
    return <div className={`brand ${className}`}>{content}</div>;
  }

  return <Link to="/devices" className={`brand ${className}`}>{content}</Link>;
}
