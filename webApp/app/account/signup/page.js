'use client'

import { useState, useRef, useEffect } from 'react';
import { Camera, ThumbsUp, AlertCircle, Loader2, User, Mail, Building, CheckCircle, Phone } from 'lucide-react';
import Link from 'next/link';

import useCamera from '@hooks/auth/useCamera'
import WireframePattern from '@components/WireframePattern';
import Card from '@components/Card';
import StepIndicator from '@components/StepIndicator';

import useFaceDetection from '@hooks/auth/useFaceDetection';
import CameraView from '@components/CameraView';
import ProgressBar from '@components/ProgressBar';

// Helper function to convert base64 to Blob
function base64ToBlob(base64) {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
}

function Signup() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    mobileNumber: ''
  });

  const [formErrors, setFormErrors] = useState({});
  const [scanProgress, setScanProgress] = useState(0);
  const [capturedImages, setCapturedImages] = useState([]);
  const [captureCount, setCaptureCount] = useState(0);
  const [isRegistering, setIsRegistering] = useState(false);
  const [waitingForNextCapture, setWaitingForNextCapture] = useState(false);
  const progressIntervalRef = useRef(null);
  const autoCaptureDoneRef = useRef(false);

  const camera = useCamera();
  const { faceDetected, facePosition, isFaceCentered } = useFaceDetection(
    camera.videoRef,
    currentStep === 1 && camera.videoReady && !waitingForNextCapture
  );

  useEffect(() => {
    if (currentStep === 1) {
      camera.setupVideo();
    }
  }, [currentStep]);

  // Auto-capture effect for Signup - only when face is centered
  useEffect(() => {
    if (
      currentStep === 1 &&
      isFaceCentered &&
      scanProgress >= 100 &&
      camera.videoReady &&
      !autoCaptureDoneRef.current &&
      !waitingForNextCapture &&
      captureCount < 3
    ) {
      autoCaptureDoneRef.current = true;
      setTimeout(() => {
        handleCapture();
      }, 500); 
    }
  }, [isFaceCentered, scanProgress, camera.videoReady, currentStep, captureCount, waitingForNextCapture]);

  // Progress control - only increment when face is centered, reset if not visible
  useEffect(() => {
    if (currentStep !== 1 || !camera.videoReady || waitingForNextCapture) return;

    if (isFaceCentered) {
      // Start or resume progress when face is centered
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
      // Reset progress to 0 when face is not centered
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setScanProgress(0); // Reset to 0
    }

    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
    };
  }, [isFaceCentered, currentStep, camera.videoReady, waitingForNextCapture]);

  useEffect(() => {
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
      }
    };
  }, []);

  const validateForm = () => {
    const errors = {};

    if (!formData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }

    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    }

    if (!formData.mobileNumber.trim()) {
      errors.mobileNumber = 'Mobile Number is required';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setCurrentStep(-1);
    const stream = await camera.requestPermission();
    if (stream) {
      setCurrentStep(1);
      setCaptureCount(0);
      setCapturedImages([]);
      setWaitingForNextCapture(false);
      autoCaptureDoneRef.current = false;
      setScanProgress(0);
    }
  };

  const handleCapture = () => {
    // Only capture if face is centered
    if (!isFaceCentered) {
      return;
    }

    const imageData = camera.captureImage();
    if (!imageData) return;

    const newCapturedImages = [...capturedImages, imageData];
    setCapturedImages(newCapturedImages);
    const newCaptureCount = captureCount + 1;
    setCaptureCount(newCaptureCount);

    if (newCaptureCount === 3) {
      // All 3 photos captured - make API call with all images
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }
      setScanProgress(100);
      camera.stopCamera();
      handleRegistration(newCapturedImages); 
    } else {
      // Stop camera after each capture
      camera.stopCamera();
      setWaitingForNextCapture(true);

      // Reset for next capture
      setScanProgress(0);
      autoCaptureDoneRef.current = false;

      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = null;
      }

      // Wait 1 second then restart camera for next capture
      setTimeout(async () => {
        const stream = await camera.requestPermission();
        if (stream) {
          setWaitingForNextCapture(false);
          camera.setupVideo();
        }
      }, 1000);
    }
  };

  const handleRegistration = async (images) => {
    setIsRegistering(true);

    try {
      const formDataPayload = new FormData();
      formDataPayload.append("fullName", formData.fullName);
      formDataPayload.append("email", formData.email);
      formDataPayload.append("mobileNumber", formData.mobileNumber);
      formDataPayload.append("timestamp", new Date().toISOString());

      // Append all 3 captured images to the FormData
      images.forEach((img, index) => {
        const blob = base64ToBlob(img);
        const file = new File([blob], `face_${index + 1}.jpg`, { type: blob.type });
        formDataPayload.append("faceImages", file);
      });

      console.log(`Making API call with ${images.length} images`);

      const response = await fetch("/api/auth/register", {
        method: "POST",
        body: formDataPayload
      });

      // Check if response is JSON
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Non-JSON response:", text);
        throw new Error(`Server error: Expected JSON but got ${contentType}. Check server logs.`);
      }

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Registration failed');
      }

      // Success
      camera.setError(null);
      setCurrentStep(2);

    } catch (err) {
      console.error("Registration error:", err);
      camera.setError(err.message || "Registration failed. Please try again.");

      // Reset to allow retry
      setCapturedImages([]);
      setCaptureCount(0);
      setScanProgress(0);
      setWaitingForNextCapture(false);
      autoCaptureDoneRef.current = false;

      // Restart camera
      setTimeout(async () => {
        const stream = await camera.requestPermission();
        if (stream) {
          camera.setupVideo();
        }
      }, 1000);
    } finally {
      setIsRegistering(false);
    }
  };

  const retryRequest = async () => {
    // Clear captured image before retrying
    setCapturedImages([]);
    setCurrentStep(-1)

    // Request permission again and restart scanning
    const stream = await camera.requestPermission();

    if (stream) {
      setCurrentStep(1);
      autoCaptureDoneRef.current = false;
      setScanProgress(0);
    }
  };

  const handleRetry = async () => {
    camera.setError(null);
    setCapturedImages([]);
    setCaptureCount(0);
    setScanProgress(0);
    setWaitingForNextCapture(false);
    autoCaptureDoneRef.current = false;
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
          {/* Step 0: Registration Form */}
          {currentStep === 0 && (
            <Card>
              <StepIndicator currentStep={0} totalSteps={3} />

              <div className="text-center mb-6">
                <div className="mb-4 flex justify-center">
                  <div className="w-16 h-16 rounded-full bg-[#00d4ff]/20 flex items-center justify-center">
                    <User className="w-8 h-8 text-[#00d4ff]" />
                  </div>
                </div>
                <h1 className="text-3xl font-bold mb-2">Create Account</h1>
                <p className="text-white/60 text-sm">Register with FaceID authentication</p>
              </div>

              <form onSubmit={handleFormSubmit} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Full Name</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="text"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a1628] border border-[#00d4ff]/30 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                      placeholder="Vladimir Putin"
                    />
                  </div>
                  {formErrors.fullName && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.fullName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full bg-[#0a1628] border border-[#00d4ff]/30 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                      placeholder="gmail@putin.com"
                    />
                  </div>
                  {formErrors.email && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Mobile Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
                    <input
                      type="tel"
                      pattern="[0-9]{10}"
                      name="mobileNumber"
                      value={formData.mobileNumber}
                      onChange={handleInputChange}
                      minLength={10}
                      maxLength={10}
                      className="w-full bg-[#0a1628] border border-[#00d4ff]/30 rounded-lg py-3 pl-10 pr-4 text-white focus:outline-none focus:border-[#00d4ff] transition-colors"
                      placeholder="7894561230"
                    />
                  </div>
                  {formErrors.mobileNumber && (
                    <p className="text-red-400 text-xs mt-1">{formErrors.mobileNumber}</p>
                  )}
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-[#00d4ff] text-white font-semibold rounded-xl hover:bg-[#00b8e6] transition-all duration-200 active:scale-95 mt-6"
                >
                  Continue to FaceID Setup
                </button>

                <p className="text-white/60 text-xs text-center mt-4">
                  Already have an account?{' '}
                  <Link href='/account/login' className="text-[#00d4ff] hover:underline cursor-pointer">
                    Sign in here
                  </Link>
                </p>
              </form>
            </Card>
          )}

          {/* Camera permission requesting */}
          {camera.permissionStatus === 'requesting' && !waitingForNextCapture && (
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
          {camera.permissionStatus === 'denied' && !waitingForNextCapture && (
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

          {/* Step 1: Face Capture */}
          {currentStep === 1 && (
            <Card>
              <StepIndicator currentStep={1} totalSteps={3} />

              <div className="text-center">
                <div className="mb-4">
                  <h2 className="text-2xl font-bold mb-1">Face Registration</h2>
                  <p className="text-white/60 text-sm">
                    Capture {captureCount + 1} of 3 photos
                  </p>
                </div>

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

                {/* Capture Progress Indicators */}
                {capturedImages.length > 0 && (
                  <div className="flex justify-center gap-3 mb-4">
                    {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Capture ${idx + 1}`}
                          className="w-14 h-14 rounded-full object-cover border-2 border-green-400 shadow-lg shadow-green-400/30"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-green-400 flex items-center justify-center">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-green-400 text-xs whitespace-nowrap">✓ Captured</span>
                        </div>
                      </div>
                    ))}
                    {Array.from({ length: 3 - capturedImages.length }).map((_, idx) => (
                      <div
                        key={`empty-${idx}`}
                        className="relative w-14 h-14 rounded-full border-2 border-[#00d4ff]/30 border-dashed flex items-center justify-center bg-[#0a1628]/50"
                      >
                        {waitingForNextCapture && idx === 0 ? (
                          <div className="flex flex-col items-center">
                            <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
                          </div>
                        ) : (
                          <span className="text-[#00d4ff]/30 text-xs font-bold">{capturedImages.length + idx + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Status Message */}
                {waitingForNextCapture && (
                  <div className="mb-4 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-lg p-3">
                    <p className="text-[#00d4ff] text-sm flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Preparing for next capture...
                    </p>
                  </div>
                )}

                <ProgressBar
                  progress={scanProgress}
                  label={
                    waitingForNextCapture
                      ? "Get ready for next photo..."
                      : isFaceCentered
                        ? "Face centered - Hold still..."
                        : faceDetected
                          ? "Center your face in the frame"
                          : "Position your face in the frame"
                  }
                />

                {/* Registration Processing */}
                {isRegistering && (
                  <div className="mt-6 bg-[#00d4ff]/10 border border-[#00d4ff]/30 rounded-xl p-4">
                    <div className="flex items-center justify-center gap-3 mb-2">
                      <Loader2 className="w-6 h-6 text-[#00d4ff] animate-spin" />
                      <span className="text-white font-semibold">Processing Registration...</span>
                    </div>
                    <p className="text-white/60 text-xs text-center">
                      Please wait while we securely process your face data
                    </p>
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Step 2: Success */}
          {currentStep === 2 && (
            <Card variant="success">
              <StepIndicator currentStep={2} totalSteps={3} />

              <div className="text-center">
                {/* Success Animation */}
                <div className="mb-6 flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50 animate-pulse">
                      <ThumbsUp className="w-12 h-12 text-green-400" />
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-green-400/30 animate-ping"></div>
                  </div>
                </div>

                <h2 className="text-3xl font-bold mb-2 text-white">Registration Complete!</h2>
                <p className="text-white/80 text-sm mb-6">Your FaceID has been successfully registered</p>

                {/* Captured Images Display */}
                <div className="mb-6">
                  <p className="text-white/60 text-xs mb-3 font-semibold">Registered Face Photos:</p>
                  <div className="flex justify-center gap-3 mb-4">
                    {capturedImages.map((img, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={img}
                          alt={`Capture ${idx + 1}`}
                          className="w-20 h-20 rounded-full object-cover border-2 border-green-400 shadow-lg shadow-green-400/20 transition-transform group-hover:scale-110"
                          style={{ transform: 'scaleX(-1)' }}
                        />
                        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-green-400 flex items-center justify-center border-2 border-[#0a1628]">
                          <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-green-400 text-xs whitespace-nowrap font-semibold">Photo {idx + 1}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* User Information */}
                <div className="text-left bg-gradient-to-br from-[#0a1628]/80 to-[#0a1628]/40 backdrop-blur-sm rounded-xl p-5 mb-6 border border-[#00d4ff]/20">
                  <p className="text-white/70 text-xs mb-3 font-semibold uppercase tracking-wider">Account Details</p>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center flex-shrink-0">
                        <User className="w-4 h-4 text-[#00d4ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/50 text-xs">Full Name</p>
                        <p className="text-white font-semibold truncate">{formData.fullName}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center flex-shrink-0">
                        <Mail className="w-4 h-4 text-[#00d4ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/50 text-xs">Email Address</p>
                        <p className="text-white font-semibold truncate text-sm">{formData.email}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#00d4ff]/20 flex items-center justify-center flex-shrink-0">
                        <Phone className="w-4 h-4 text-[#00d4ff]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-white/50 text-xs">Mobile Number</p>
                        <p className="text-white font-semibold">{formData.mobileNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Security Notice */}
                <div className="mb-6 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
                  <p className="text-green-400 text-xs flex items-center justify-center gap-2">
                    <CheckCircle className="w-4 h-4" />
                    Your face data is encrypted and securely stored
                  </p>
                </div>

                {/* Action Button */}
                <button
                  onClick={() => window.location.href = '/account/login'}
                  className="w-full py-4 bg-gradient-to-r from-[#00d4ff] to-[#00ff88] text-white font-semibold rounded-xl hover:shadow-lg hover:shadow-[#00d4ff]/50 transition-all duration-200 active:scale-95 mb-3"
                >
                  Continue to Login →
                </button>

                <p className="text-white/40 text-xs">
                  You can now sign in using your face
                </p>
              </div>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

export default Signup;