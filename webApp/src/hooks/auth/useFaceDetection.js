import { useState, useRef, useEffect, useCallback } from "react";
import * as faceapi from 'face-api.js';

function useFaceDetection(videoRef, isActive) {
  const [faceDetected, setFaceDetected] = useState(false);
  const [facePosition, setFacePosition] = useState(null);
  const [isFaceCentered, setIsFaceCentered] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const intervalRef = useRef(null);
  const isInitializedRef = useRef(false);
  const modelsLoadedRef = useRef(false);
  const isMobileRef = useRef(false);

  const cleanup = useCallback(() => {
    setFaceDetected(false);
    setFacePosition(null);
    setIsFaceCentered(false);
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Detect if user is on mobile device
  const isMobile = useCallback(() => {
    if (typeof window === 'undefined') return false;
    
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
      navigator.userAgent
    ) || window.innerWidth <= 768;
  }, []);

  useEffect(() => {
    if (!isActive || !videoRef.current) {
      cleanup();
      return;
    }

    let isMounted = true;

    // Check if mobile device
    isMobileRef.current = isMobile();

    const loadModels = async () => {
      if (!isMounted) return;
      
      // If models already loaded, skip
      if (modelsLoadedRef.current && isInitializedRef.current) {
        return;
      }

      try {
        setIsLoading(true);
        
        // Load face detection models from CDN
        const MODEL_URL = 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'; // You can also use a CDN: 'https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model'
        
        // Load only the TinyFaceDetector model (smallest and fastest)
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        
        // Alternatively, you can use SSD MobileNet for better accuracy:
        // await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        
        // Or use MTCNN for best accuracy (slower):
        // await faceapi.nets.mtcnn.loadFromUri(MODEL_URL);

        modelsLoadedRef.current = true;
        isInitializedRef.current = true;
        setIsLoading(false);
      } catch (err) {
        console.error('Error loading face-api.js models:', err);
        setError('Failed to load face detection models. Make sure models are in /public/models folder.');
        setIsLoading(false);
        throw err;
      }
    };

    const detectFace = async () => {
      if (!isMounted || !modelsLoadedRef.current) return;

      const video = videoRef.current;
      if (!video || video.readyState !== video.HAVE_ENOUGH_DATA) {
        return;
      }

      // Check for valid video dimensions
      if (video.videoWidth === 0 || video.videoHeight === 0) {
        return;
      }

      try {
        // Mobile-optimized settings
        const inputSize = isMobileRef.current ? 320 : 416; // Lower on mobile for better performance
        const scoreThreshold = 0.6; // Higher confidence threshold for better accuracy

        // Detect faces using TinyFaceDetector with optimized settings
        const detections = await faceapi.detectAllFaces(
          video,
          new faceapi.TinyFaceDetectorOptions({
            inputSize: inputSize,
            scoreThreshold: scoreThreshold
          })
        );

        // For SSD MobileNet (alternative, better accuracy but slower):
        // const detections = await faceapi.detectAllFaces(
        //   video,
        //   new faceapi.SsdMobilenetv1Options({
        //     minConfidence: 0.6
        //   })
        // );

        if (detections.length > 0) {
          // Get the first detected face
          const detection = detections[0];
          const box = detection.box;
          
          // Calculate face center
          const faceCenterX = box.x + box.width / 2;
          const faceCenterY = box.y + box.height / 2;
          
          // Calculate video center
          const centerX = video.videoWidth / 2;
          const centerY = video.videoHeight / 2;

          // Define tolerance for "centered" detection
          // Slightly more tolerant on mobile due to hand shake
          const toleranceMultiplier = isMobileRef.current ? 0.18 : 0.15;
          const toleranceX = video.videoWidth * toleranceMultiplier;
          const toleranceY = video.videoHeight * toleranceMultiplier;

          // Check if face is centered
          const centered =
            Math.abs(faceCenterX - centerX) < toleranceX &&
            Math.abs(faceCenterY - centerY) < toleranceY;

          setFaceDetected(true);
          setIsFaceCentered(centered);
          setFacePosition({
            x: box.x,
            y: box.y,
            width: box.width,
            height: box.height,
          });
        } else {
          setFaceDetected(false);
          setIsFaceCentered(false);
          setFacePosition(null);
        }
      } catch (err) {
        console.error('Face detection error:', err);
        // Don't set error state here as it might be temporary
      }
    };

    const start = async () => {
      if (!isMounted) return;
      
      setIsLoading(true);
      setError(null);

      try {
        await loadModels();
        
        if (!isMounted) return;

        // Start detection loop with mobile-optimized interval
        // Slower interval on mobile to reduce CPU/battery usage
        const detectionInterval = isMobileRef.current ? 200 : 150;
        intervalRef.current = setInterval(detectFace, detectionInterval);
        setIsLoading(false);
      } catch (err) {
        console.error('Failed to start face detection:', err);
        if (isMounted) {
          setError(err.message || 'Failed to initialize face detection');
          setIsLoading(false);
        }
      }
    };

    start();

    return () => {
      isMounted = false;
      cleanup();
    };
  }, [isActive, videoRef, cleanup]);

  return { 
    faceDetected, 
    facePosition, 
    isFaceCentered,
    isLoading,
    error
  };
}

export default useFaceDetection;