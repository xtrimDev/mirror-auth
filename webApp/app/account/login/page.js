'use client';

import { useState, useRef, useEffect } from 'react';
import { Camera, ThumbsUp, AlertCircle, Loader2 } from 'lucide-react';
import Link from 'next/link';

import useCamera from '@hooks/auth/useCamera'
import WireframePattern from '@components/WireframePattern';
import Card from '@components/Card';
import FaceIcon from '@components/FaceIcon';
import StepIndicator from '@components/StepIndicator';

import useFaceDetection from '@hooks/auth/useFaceDetection';
import CameraView from '@components/CameraView';
import ProgressBar from '@components/ProgressBar';

const authenticateFace = async function (imageData) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image: imageData,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Authentication failed');
    }

    return data;
  } catch (error) {
    console.error('Face authentication error:', error);
    throw error;
  }
}

export default function Login() {
  const [step, setStep] = useState('intro');
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImage, setCapturedImage] = useState(null);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const progressIntervalRef = useRef(null);
  const autoCaptureDoneRef = useRef(false);

  const camera = useCamera();

  const { faceDetected, facePosition, isFaceCentered } = useFaceDetection(
    camera.videoRef,
    step === 'scanning' && camera.videoReady
  );

  // Setup video when permission is granted
  useEffect(() => {
    if (camera.permissionStatus === 'granted' && step === 'scanning') {
      camera.setupVideo();
    }
  }, [camera.permissionStatus, step]);

  // Progress bar - only advances when face is CENTERED 
  useEffect(() => {
    if (step === 'scanning' && isFaceCentered && camera.videoReady) {
      // Start progress animation only when face is centered
      if (!progressIntervalRef.current) {
        progressIntervalRef.current = setInterval(() => {
          setScanProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressIntervalRef.current);
              progressIntervalRef.current = null;
              return 100;
            }
            return prev + 10;
          });
        }, 40); 
      }
    } else {
      // Reset progress if face is not centered
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setScanProgress(0);
    }
  }, [step, isFaceCentered, camera.videoReady]);

  // Auto-capture when scan is complete and face is centered
  useEffect(() => {
    if (
      step === 'scanning' &&
      isFaceCentered && 
      scanProgress >= 100 &&
      camera.videoReady &&
      !autoCaptureDoneRef.current
    ) {
      autoCaptureDoneRef.current = true;
      setTimeout(() => {
        captureFace();
      }, 500); 
    }
  }, [isFaceCentered, scanProgress, camera.videoReady, step]);

  // Cleanup progress interval on unmount
  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  // request permission and move to another step
  const handleSignIn = async () => {
    setStep('reqPermission');
    const stream = await camera.requestPermission();

    if (stream) {
      setStep('scanning');
      autoCaptureDoneRef.current = false;
      setScanProgress(0);
    }
  };

  const captureFace = async () => {
    if (!camera.videoReady) {
      camera.setError('Camera not ready. Please try again.');
      return;
    }

    // Check if face is centered (more strict check)
    if (!isFaceCentered) {
      camera.setError('Please center your face in the frame.');
      return;
    }

    setCapturedImage(null);

    const imageData = camera.captureImage();

    if (!imageData) {
      camera.setError('Failed to capture image. Please try again.');
      return;
    }

    setCapturedImage(imageData);

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    camera.stopCamera();

    setIsAuthenticating(true);
    setStep('authenticating');

    try {
      const data = await authenticateFace(imageData);

      // Authentication successful
      setStep('success');

      if (data.token) {
        localStorage.setItem('authToken', data.token);
      }

      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1500);

    } catch (error) {
      camera.setError(error.message || 'Face authentication failed. Please try again.');
      setStep('failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const retryRequest = async () => {
    // Clear captured image before retrying
    setCapturedImage(null);

    // Request permission again and restart scanning
    setStep('reqPermission');
    const stream = await camera.requestPermission();

    if (stream) {
      setStep('scanning');
      autoCaptureDoneRef.current = false;
      setScanProgress(0);
    }
  };

  const handleRetry = async () => {
    // Clear all states
    camera.setError(null);
    setCapturedImage(null);
    setScanProgress(0);
    autoCaptureDoneRef.current = false;
    setIsAuthenticating(false);
    camera.stopCamera();

    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }

    await retryRequest();
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white relative overflow-hidden">
      <WireframePattern />
      <main className="max-w-md mx-auto px-4 py-8 min-h-screen flex items-center justify-center">
        <div className="w-full">

          {/* Step 1: Introduction */}
          {step === 'intro' && (
            <Card>
              <StepIndicator currentStep={0} totalSteps={3} />

              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <FaceIcon className="w-20 h-20 text-[#00d4ff]" />
                </div>

                <h1 className="text-4xl font-bold mb-4 text-white">FaceID</h1>

                <p className="text-white/80 text-sm mb-6 leading-relaxed">
                  Sign in with your face. Look at your camera to authenticate securely.
                </p>

                <button
                  onClick={handleSignIn}
                  className="w-full py-4 bg-[#00d4ff] text-white font-semibold rounded-xl hover:bg-[#00b8e6] transition-all duration-200 active:scale-95"
                >
                  Sign In
                </button>

                <p className="text-white/60 text-xs mt-4">
                  Don't have an account?{' '}
                  <Link href="/account/signup" className="text-[#00d4ff] hover:underline">
                    Register here
                  </Link>
                </p>
              </div>
            </Card>
          )}

          {/* Camera permission requesting */}
          {camera.permissionStatus === 'requesting' && (
            <Card>
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative w-20 h-20">
                    <div className="absolute inset-0 border-4 border-[#00d4ff]/30 rounded-full"></div>
                    <div className="absolute inset-0 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
                    <Camera className="absolute inset-0 m-auto w-8 h-8 text-[#00d4ff]" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-white">Requesting Camera Access</h2>
                <p className="text-white/60 text-sm">Please allow camera permission in your browser</p>
              </div>
            </Card>
          )}

          {/* Camera permission denied */}
          {camera.permissionStatus === 'denied' && (
            <Card variant="error">
              <StepIndicator currentStep={0} totalSteps={3} />

              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">Camera Access Denied</h2>
                <p className="text-white/80 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                  {camera.error || 'Camera permission is required to continue with facial authentication.'}
                </p>

                <div className="bg-[#0a1628]/50 rounded-xl p-4 mb-6 text-left">
                  <p className="text-white/70 text-sm mb-3 font-semibold">To enable camera access:</p>
                  <ul className="text-white/60 text-sm space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-[#00d4ff] mt-1 font-bold">1.</span>
                      <span>Look for the camera icon <span className="inline-flex items-center justify-center w-5 h-5 bg-white/10 rounded text-xs">🎥</span> in your browser's address bar</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00d4ff] mt-1 font-bold">2.</span>
                      <span>Click it and select <strong className="text-white/80">"Allow"</strong> for camera access</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-[#00d4ff] mt-1 font-bold">3.</span>
                      <span>Click the button below to try again</span>
                    </li>
                  </ul>
                </div>

                <button
                  onClick={handleRetry}
                  className="w-full py-3 bg-[#00d4ff] text-white font-semibold rounded-xl hover:bg-[#00b8e6] transition-all duration-200 active:scale-95 shadow-lg shadow-[#00d4ff]/20"
                >
                  Try Again
                </button>
              </div>
            </Card>
          )}

          {/* Step 2: Face Scanning */}
          {step === 'scanning' && (
            <Card>
              <StepIndicator currentStep={1} totalSteps={3} />

              <div className="text-center">
                <div className="relative mb-6 flex justify-center">
                  <CameraView
                    videoRef={camera.videoRef}
                    videoReady={camera.videoReady}
                    error={camera.error}
                    onRetry={handleRetry}
                    faceDetected={faceDetected}
                    facePosition={facePosition}
                    setupVideo={camera.setupVideo}
                    showOverlay={true}
                  />
                </div>

                <ProgressBar
                  progress={scanProgress}
                  label={
                    isFaceCentered
                      ? "Face centered - Hold still..."
                      : faceDetected
                        ? "Center your face in the frame"
                        : "Position your face in the frame"
                  }
                />
              </div>
            </Card>
          )}

          {/* Step 3: Authenticating */}
          {step === 'authenticating' && (
            <Card>
              <StepIndicator currentStep={2} totalSteps={3} />

              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="relative w-48 h-48">
                    {capturedImage ? (
                      <>
                        <div className="absolute inset-0 border-4 border-[#00d4ff]/30 rounded-full"></div>
                        <div className="absolute inset-0 border-4 border-[#00d4ff] border-t-transparent rounded-full animate-spin"></div>
                        <img
                          src={capturedImage}
                          alt="Captured face"
                          className="absolute inset-2 w-[calc(100%-16px)] h-[calc(100%-16px)] rounded-full object-cover"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                      </>
                    ) : (
                      <div className="w-48 h-48 rounded-full bg-[#0a1628] flex items-center justify-center border-4 border-[#00d4ff]/30">
                        <Loader2 className="w-12 h-12 text-[#00d4ff] animate-spin" />
                      </div>
                    )}
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-2 text-white">Authenticating...</h2>
                <p className="text-white/60 text-sm">Please wait while we verify your identity</p>
              </div>
            </Card>
          )}

          {/* Step 4: Authentication Success */}
          {step === 'success' && (
            <Card variant="success">
              <StepIndicator currentStep={3} totalSteps={3} />

              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50 animate-pulse">
                    <ThumbsUp className="w-10 h-10 text-green-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">Authentication Successful!</h2>
                <p className="text-white/80 text-sm mb-6">Redirecting to your dashboard...</p>
              </div>
            </Card>
          )}

          {/* Authentication Failed */}
          {step === 'failed' && (
            <Card variant="error">
              <div className="text-center">
                <div className="mb-6 flex justify-center">
                  <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50 animate-pulse">
                    <AlertCircle className="w-10 h-10 text-red-400" />
                  </div>
                </div>

                <h2 className="text-2xl font-bold mb-3 text-white">Authentication Failed</h2>
                <p className="text-white/80 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                  {camera.error}
                </p>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={handleRetry}
                    className="w-full py-3 bg-[#00d4ff] text-white font-semibold rounded-xl hover:bg-[#00b8e6] transition-all duration-200 active:scale-95 shadow-lg shadow-[#00d4ff]/20"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}