function FaceIcon({ className = "w-20 h-20" }) {
    return (
      <svg viewBox="0 0 100 100" className={className}>
        <circle cx="50" cy="35" r="12" fill="none" stroke="currentColor" strokeWidth="2"/>
        <path d="M 30 65 Q 30 55 50 55 Q 70 55 70 65" fill="none" stroke="currentColor" strokeWidth="2"/>
      </svg>
    );
  }

export default FaceIcon;