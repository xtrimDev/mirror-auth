import { useState, useRef, useEffect, useCallback } from 'react';

function useCamera() {
  const [permissionStatus, setPermissionStatus] = useState('idle');
  const [videoReady, setVideoReady] = useState(false);
  const [error, setError] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const videoSetupDoneRef = useRef(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    videoSetupDoneRef.current = false;
    setVideoReady(false);
  }, []);

  const requestPermission = useCallback(async () => {
    setPermissionStatus('requesting');
    setError(null);
    setVideoReady(false);
    videoSetupDoneRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        }
      });

      streamRef.current = stream;
      setPermissionStatus('granted');
      return stream;
    } catch (err) {
      console.error('Error accessing camera:', err);
      setPermissionStatus('denied');
      
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access to continue.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera found. Please connect a camera and try again.');
      } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
        setError('Camera is already in use by another application.');
      } else {
        setError('Failed to access camera. Please try again.');
      }
      return null;
    }
  }, []);

  const setupVideo = useCallback(() => {
    if (!streamRef.current || !videoRef.current || videoSetupDoneRef.current) {
      return;
    }

    const video = videoRef.current;
    const stream = streamRef.current;
    
    video.srcObject = stream;
    videoSetupDoneRef.current = true;
    
    const handleCanPlay = () => {
      const playPromise = video.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            setVideoReady(true);
          })
          .catch(err => {
            if (err.name !== 'AbortError') {
              console.error('Video play error:', err);
              setError('Failed to start video. Please try again.');
            }
          });
      }
    };

    // Use event listener instead of timeout for more reliable playback
    video.addEventListener('canplay', handleCanPlay, { once: true });
    
    // Fallback timeout in case canplay doesn't fire
    const timeoutId = setTimeout(() => {
      video.removeEventListener('canplay', handleCanPlay);
      handleCanPlay();
    }, 1000);

    // Cleanup function
    return () => {
      clearTimeout(timeoutId);
      video.removeEventListener('canplay', handleCanPlay);
    };
  }, []);

  const captureImage = useCallback(() => {
    if (!videoRef.current || !videoReady) {
      console.warn('Video not ready for capture');
      return null;
    }

    const video = videoRef.current;
    
    // Check if video has valid dimensions
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.warn('Video dimensions not available');
      return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext('2d');
    if (!context) {
      console.error('Failed to get canvas context');
      return null;
    }
    
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    return canvas.toDataURL('image/png');
  }, [videoReady]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  return {
    videoRef,
    permissionStatus,
    videoReady,
    error,
    requestPermission,
    setupVideo,
    stopCamera,
    captureImage,
    setError
  };
}

export default useCamera;