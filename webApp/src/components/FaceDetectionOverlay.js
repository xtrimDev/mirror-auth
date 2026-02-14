function FaceDetectionOverlay({ faceDetected, facePosition, videoWidth, videoHeight }) {
  if (!facePosition || !videoWidth || !videoHeight) return null;

  const scaleX = 192 / videoWidth;
  const scaleY = 192 / videoHeight;
  
  const boxX = (facePosition.x - facePosition.width / 2) * scaleX;
  const boxY = (facePosition.y - facePosition.height / 2) * scaleY;
  const boxWidth = facePosition.width * scaleX;
  const boxHeight = facePosition.height * scaleY;

  return (
    <div className="absolute inset-0 pointer-events-none">
      <div
        className={`absolute border-2 rounded-xl transition-all duration-300 ${
          faceDetected ? 'border-green-400' : 'border-yellow-400'
        }`}
        style={{
          left: `${boxX}px`,
          top: `${boxY}px`,
          width: `${boxWidth}px`,
          height: `${boxHeight}px`,
          transform: 'scaleX(-1)'
        }}
      >
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-inherit rounded-tl-lg" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-inherit rounded-tr-lg" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-inherit rounded-bl-lg" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-inherit rounded-br-lg" />
      </div>
      
      {faceDetected && (
        <div
          className="absolute w-full h-0.5 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"
          style={{
            left: `${boxX}px`,
            top: `${boxY + boxHeight / 2}px`,
            width: `${boxWidth}px`
          }}
        />
      )}
    </div>
  );
}

export default FaceDetectionOverlay;