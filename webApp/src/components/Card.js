function Card({ children, variant = 'default' }) {
    const borderColor = variant === 'error' ? 'border-red-500/30' : 'border-[#00d4ff]/20';
    
    return (
      <div className={`w-full bg-[#0f1e3a] rounded-3xl p-8 relative border ${borderColor}`}>
        {children}
      </div>
    );
  }

export default Card;