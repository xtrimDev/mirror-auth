function ProgressBar({ progress, label }) {
    return (
      <div className="mb-4">
        <p className="text-[#00d4ff] text-lg font-semibold mb-2">{progress}%</p>
        <div className="w-full h-2 bg-[#0a1628] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#00d4ff] transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        {label && <p className="text-white/60 text-sm mt-2">{label}</p>}
      </div>
    );
  }

export default ProgressBar;