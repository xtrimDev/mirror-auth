function StepIndicator({ currentStep, totalSteps }) {
    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2">
        {Array.from({ length: totalSteps }).map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentStep ? 'bg-[#00d4ff]' : 'bg-[#00d4ff]/30'
            }`}
          />
        ))}
      </div>
    );
  }

export default StepIndicator;