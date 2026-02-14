import { useState, useEffect } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';

function CameraView({ 
  videoRef, 
  videoReady, 
  error, 
  onRetry, 
  faceDetected,
  facePosition,
  showOverlay = true,
  setupVideo
}) {
  const [videoDimensions, setVideoDimensions] = useState({ width: 0, height: 0 });

  // Call setupVideo when videoRef is ready
  useEffect(() => {
    if (videoRef.current && setupVideo && !videoReady) {
      setupVideo();
    }
  }, [videoRef, setupVideo, videoReady]);

  // Update dimensions when video is ready
  useEffect(() => {
    if (videoRef.current && videoReady) {
      const updateDimensions = () => {
        setVideoDimensions({
          width: videoRef.current.videoWidth,
          height: videoRef.current.videoHeight
        });
      };

      updateDimensions();

      const video = videoRef.current;
      video.addEventListener('loadedmetadata', updateDimensions);

      return () => {
        video.removeEventListener('loadedmetadata', updateDimensions);
      };
    }
  }, [videoReady, videoRef]);

  return (
    <div className="relative w-48 h-48 rounded-full overflow-hidden border-4 border-[#00d4ff]/50 bg-black shadow-xl shadow-[#00d4ff]/20">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full object-cover"
        style={{ transform: 'scaleX(-1)' }}
      />
      
      {/* Loading State */}
      {!videoReady && !error && (
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a1628] to-black flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin mx-auto mb-2" />
            <p className="text-white/60 text-xs">Initializing camera...</p>
          </div>
        </div>
      )}
      
      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-black/95 flex flex-col items-center justify-center p-4">
          <AlertCircle className="w-12 h-12 text-red-400 mb-3" />
          <p className="text-white/80 text-xs text-center mb-4 leading-relaxed">
            {error}
          </p>
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-[#00d4ff] text-white text-xs font-semibold rounded-lg hover:bg-[#00b8e6] transition-all duration-200 active:scale-95 shadow-lg shadow-[#00d4ff]/30"
          >
            Try Again
          </button>
        </div>
      )}
      
      {/* Face Detection Rectangle */}
      {videoReady && showOverlay && faceDetected && facePosition && videoDimensions.width > 0 && (
        <div className="absolute inset-0 pointer-events-none">
          <svg
            width="100%"
            height="100%"
            viewBox={`0 0 ${videoDimensions.width} ${videoDimensions.height}`}
            className="absolute inset-0"
            preserveAspectRatio="none"
            style={{ transform: 'scaleX(-1)' }}
          >
            {/* Face detection rectangle */}
            <rect
              x={facePosition.x}
              y={facePosition.y}
              width={facePosition.width}
              height={facePosition.height}
              fill="none"
              stroke="#00d4ff"
              strokeWidth="5"
              className="animate-pulse"
            />
            
            {/* Corner accents */}
            <line
              x1={facePosition.x}
              y1={facePosition.y}
              x2={facePosition.x + 20}
              y2={facePosition.y}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={facePosition.x}
              y1={facePosition.y}
              x2={facePosition.x}
              y2={facePosition.y + 20}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            
            <line
              x1={facePosition.x + facePosition.width}
              y1={facePosition.y}
              x2={facePosition.x + facePosition.width - 20}
              y2={facePosition.y}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={facePosition.x + facePosition.width}
              y1={facePosition.y}
              x2={facePosition.x + facePosition.width}
              y2={facePosition.y + 20}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            
            <line
              x1={facePosition.x}
              y1={facePosition.y + facePosition.height}
              x2={facePosition.x + 20}
              y2={facePosition.y + facePosition.height}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={facePosition.x}
              y1={facePosition.y + facePosition.height}
              x2={facePosition.x}
              y2={facePosition.y + facePosition.height - 20}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            
            <line
              x1={facePosition.x + facePosition.width}
              y1={facePosition.y + facePosition.height}
              x2={facePosition.x + facePosition.width - 20}
              y2={facePosition.y + facePosition.height}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <line
              x1={facePosition.x + facePosition.width}
              y1={facePosition.y + facePosition.height}
              x2={facePosition.x + facePosition.width}
              y2={facePosition.y + facePosition.height - 20}
              stroke="#00d4ff"
              strokeWidth="5"
              strokeLinecap="round"
            />

            {/* "Face Detected" label */}
            <rect
              x={facePosition.x}
              y={facePosition.y - 30}
              width="120"
              height="25"
              fill="#00d4ff"
              rx="4"
            />
            <text
              x={facePosition.x + 60}
              y={facePosition.y - 12}
              textAnchor="middle"
              fill="white"
              fontSize="14"
              fontWeight="bold"
              fontFamily="system-ui, -apple-system, sans-serif"
            >
              Face Detected
            </text>
          </svg>
        </div>
      )}
      
      {/* Face Guide Overlay (only show when no face detected) */}
      {videoReady && showOverlay && !faceDetected && (
        <div className="absolute inset-0 pointer-events-none">
          <svg 
            width="100%" 
            height="100%" 
            viewBox="0 0 200 200" 
            className="text-white/30"
            preserveAspectRatio="xMidYMid meet"
          >
            {/* Face outline guide */}
            <circle 
              cx="100" 
              cy="70" 
              r="20" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Smile guide */}
            <path 
              d="M 60 130 Q 60 110 100 110 Q 140 110 140 130" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeDasharray="4 2"
            />
            {/* Left eye */}
            <line 
              x1="85" 
              y1="90" 
              x2="90" 
              y2="90" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            {/* Right eye */}
            <line 
              x1="110" 
              y1="90" 
              x2="115" 
              y2="90" 
              stroke="currentColor" 
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      )}
    </div>
  );
}

export default CameraView;