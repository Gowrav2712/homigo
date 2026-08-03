import React, {useState, useRef, useEffect} from 'react';
import * as faceapi from 'face-api.js';
import {
  Box, Button, CircularProgress, Typography, Alert, IconButton, LinearProgress
} from '@mui/material';
import {Camera, Cameraswitch} from '@mui/icons-material';
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FileUploadIcon from '@mui/icons-material/FileUpload';

// Threshold: lower = stricter match. 0.5 is strict, 0.6 is standard industry threshold
const FACE_MATCH_THRESHOLD = 0.55;
const MODELS_URL = '/models';

const PhotoMatching = (
  {formData, setFormData, setCurrentStep, handleFinalSubmit, isSubmitting, error, setError}
) => {
  const [cameraStream, setCameraStream] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [cameraError, setCameraError] = useState(null);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [modelsLoading, setModelsLoading] = useState(true);
  const [verifyStep, setVerifyStep] = useState('');

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const uploadPhotoRef = useRef(null);

  // Load face-api.js models on mount
  useEffect(() => {
    const loadModels = async () => {
      try {
        setModelsLoading(true);
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
          faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODELS_URL),
          faceapi.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error('Failed to load face-api models:', err);
        setCameraError('Failed to load face verification models. Please refresh the page.');
      } finally {
        setModelsLoading(false);
      }
    };
    loadModels();
  }, []);

  // Start camera once models are loaded
  useEffect(() => {
    if (modelsLoaded) {
      startCamera();
    }
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modelsLoaded]);

  const stopCameraStream = () => {
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach(track => track.stop());
      cameraStreamRef.current = null;
      setCameraStream(null);
    }
  };

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {facingMode: 'user', width: {ideal: 640}, height: {ideal: 480}}
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      cameraStreamRef.current = stream;
      setCameraStream(stream);
    } catch (err) {
      console.error('Error accessing camera:', err);
      setCameraError('Unable to access camera. Please allow camera permission and try again.');
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const context = canvas.getContext('2d');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const photoData = canvas.toDataURL('image/jpeg', 0.95);
    setCapturedPhoto(photoData);
    setVerificationResult(null);
    stopCameraStream();
  };

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setVerificationResult(null);
    setVerifyStep('');
    startCamera();
  };

  // Allow user to re-upload profile photo directly from Step 2 on mismatch
  const handleReuploadPhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return;
    if (file.size > 5 * 1024 * 1024) {
      setVerificationResult({
        success: false,
        matched: false,
        error: 'File too large. Please upload an image smaller than 5MB.'
      });
      return;
    }
    // Update parent formData photo
    setFormData(prev => ({...prev, photo: file}));
    // Reset verification so user tries again with new photo
    setVerificationResult(null);
    setCapturedPhoto(null);
    setVerifyStep('');
    // Restart camera for new selfie
    startCamera();
    // Clear the input so same file can be re-selected
    e.target.value = '';
  };

  // Load an image element from a src URL
  const loadImageElement = (src) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // Get 128D face descriptor from an image using face-api.js
  const getFaceDescriptor = async (imgElement, label) => {
    const detectionOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 416,
      scoreThreshold: 0.4
    });

    const detection = await faceapi
      .detectSingleFace(imgElement, detectionOptions)
      .withFaceLandmarks(true)
      .withFaceDescriptor();

    if (!detection) {
      return {descriptor: null, label};
    }
    return {descriptor: detection.descriptor, label};
  };

  const handleVerify = async () => {
    if (!capturedPhoto || !formData.photo) {
      setVerificationResult({
        success: false,
        matched: false,
        error: 'Both photos are required for verification.'
      });
      return;
    }

    if (!modelsLoaded) {
      setVerificationResult({
        success: false,
        matched: false,
        error: 'Face models are still loading. Please wait a moment and try again.'
      });
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);

    try {
      const uploadedImgUrl = formData.photo instanceof File
        ? URL.createObjectURL(formData.photo)
        : formData.photo;

      // Step 1: Load both images
      setVerifyStep('Loading images...');
      const [uploadedImg, capturedImg] = await Promise.all([
        loadImageElement(uploadedImgUrl),
        loadImageElement(capturedPhoto)
      ]);

      // Step 2: Detect face in uploaded profile photo
      setVerifyStep('Detecting face in your profile photo...');
      const uploadedResult = await getFaceDescriptor(uploadedImg, 'uploaded');

      if (!uploadedResult.descriptor) {
        setVerificationResult({
          success: false,
          matched: false,
          error: 'No face detected in your uploaded profile photo. Please go back and upload a clear, well-lit photo of your face.'
        });
        setIsVerifying(false);
        setVerifyStep('');
        return;
      }

      // Step 3: Detect face in live capture
      setVerifyStep('Detecting face in live capture...');
      const capturedResult = await getFaceDescriptor(capturedImg, 'captured');

      if (!capturedResult.descriptor) {
        setVerificationResult({
          success: false,
          matched: false,
          error: 'No face detected in your live capture. Please ensure your face is clearly visible, well-lit, and facing the camera directly.'
        });
        setIsVerifying(false);
        setVerifyStep('');
        return;
      }

      // Step 4: Compute euclidean distance between 128D face descriptors
      setVerifyStep('Comparing faces...');
      const distance = faceapi.euclideanDistance(
        uploadedResult.descriptor,
        capturedResult.descriptor
      );

      console.log(`Face distance: ${distance.toFixed(4)} (threshold: ${FACE_MATCH_THRESHOLD})`);

      const matched = distance < FACE_MATCH_THRESHOLD;
      const confidence = Math.max(0, Math.round((1 - distance) * 100));

      setVerifyStep('');
      if (matched) {
        setVerificationResult({
          success: true,
          matched: true,
          distance,
          confidence,
          message: `Identity verified! Match confidence: ${confidence}%. Click Register to complete your account.`
        });
      } else {
        setVerificationResult({
          success: false,
          matched: false,
          distance,
          confidence,
          error: `Face does not match your profile photo (similarity: ${confidence}%). Please retake your photo or go back and upload a clearer profile picture.`
        });
      }

    } catch (err) {
      console.error('Face verification error:', err);
      setVerificationResult({
        success: false,
        matched: false,
        error: 'Verification failed due to an error. Please retake the photo and try again.'
      });
      setVerifyStep('');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleBack = () => {
    stopCameraStream();
    setCurrentStep('1');
  };

  const getMiddleButtonProps = () => {
    if (!cameraStream && !capturedPhoto) {
      return {onClick: startCamera, children: 'Start Camera', startIcon: <Camera/>};
    }
    if (cameraStream && !capturedPhoto) {
      return {onClick: capturePhoto, children: 'Capture Photo', startIcon: <Camera/>};
    }
    return {onClick: retakePhoto, children: 'Retake Photo', startIcon: <Cameraswitch/>};
  };

  return (
    <Box sx={{width: '100%'}}>
      {/* Header */}
      <Typography variant="h5" sx={{fontWeight: 600, mb: 0.5}}>
        Live Face Verification
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
        We use AI face recognition to verify your identity matches your profile photo — similar to how banking apps work.
      </Typography>

      {/* Model loading indicator */}
      {modelsLoading && (
        <Box sx={{mb: 2}}>
          <Typography variant="body2" color="text.secondary" sx={{mb: 1}}>
            Loading face recognition AI models...
          </Typography>
          <LinearProgress />
        </Box>
      )}

      {/* Camera error */}
      {cameraError && (
        <Alert severity="error" sx={{mb: 2}}>
          {cameraError}
        </Alert>
      )}

      {/* Photos side by side */}
      <Box sx={{
        display: 'grid',
        gridTemplateColumns: {xs: '1fr', sm: '1fr 1fr'},
        gap: 2,
        mb: 3
      }}>
        {/* LEFT — Uploaded profile photo (always visible) */}
        <Box>
          <Box sx={{
            border: '2px solid',
            borderColor: verificationResult?.matched ? 'success.main' : 'divider',
            borderRadius: 2,
            overflow: 'hidden',
            aspectRatio: '4/3',
            position: 'relative',
            transition: 'border-color 0.3s',
            mb: 1
          }}>
            <Typography variant="caption" sx={{
              position: 'absolute', top: 8, left: 8,
              bgcolor: 'rgba(0,0,0,0.65)', color: 'white',
              px: 1, py: 0.5, borderRadius: 1, zIndex: 2, fontSize: '0.7rem'
            }}>
              📁 Uploaded Profile Photo
            </Typography>
            <img
              src={formData.photo instanceof File ? URL.createObjectURL(formData.photo) : formData.photo}
              alt="Uploaded profile"
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          </Box>

          {/* Always-visible Change Photo button */}
          <Button
            fullWidth
            variant="outlined"
            size="small"
            startIcon={<FileUploadIcon/>}
            onClick={() => uploadPhotoRef.current?.click()}
            disabled={isVerifying || isSubmitting}
            sx={{
              borderStyle: 'dashed',
              py: 0.8,
              fontSize: '0.8rem',
              color: 'text.secondary',
              borderColor: 'divider',
              '&:hover': {
                borderColor: 'primary.main',
                color: 'primary.main',
                borderStyle: 'dashed',
                bgcolor: 'primary.50'
              }
            }}
          >
            Change Profile Photo
          </Button>
        </Box>

        {/* RIGHT — Live camera / captured photo */}
        <Box sx={{
          border: '2px solid',
          borderColor: verificationResult?.matched ? 'success.main' : 'divider',
          borderRadius: 2,
          overflow: 'hidden',
          aspectRatio: '4/3',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'action.hover',
          position: 'relative',
          transition: 'border-color 0.3s'
        }}>
          {capturedPhoto && (
            <Typography variant="caption" sx={{
              position: 'absolute', top: 8, left: 8,
              bgcolor: 'rgba(0,0,0,0.65)', color: 'white',
              px: 1, py: 0.5, borderRadius: 1, zIndex: 2, fontSize: '0.7rem'
            }}>
              📷 Live Camera Capture
            </Typography>
          )}
          {!cameraStream && !capturedPhoto && !modelsLoading && (
            <Typography color="text.secondary" variant="body2" sx={{textAlign: 'center', px: 2}}>
              {modelsLoaded ? 'Camera ready\nClick Start Camera below' : 'Loading AI models...'}
            </Typography>
          )}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: '100%', height: '100%', objectFit: 'cover',
              display: cameraStream && !capturedPhoto ? 'block' : 'none',
              transform: 'scaleX(-1)'
            }}
          />
          {capturedPhoto && (
            <img
              src={capturedPhoto}
              alt="Captured"
              style={{width: '100%', height: '100%', objectFit: 'cover'}}
            />
          )}
        </Box>
      </Box>

      {/* Hidden file input — always mounted */}
      <input
        ref={uploadPhotoRef}
        type="file"
        accept="image/*"
        style={{display: 'none'}}
        onChange={handleReuploadPhoto}
      />

      {/* Verification progress */}
      {isVerifying && verifyStep && (
        <Box sx={{mb: 2, display: 'flex', alignItems: 'center', gap: 1}}>
          <CircularProgress size={16}/>
          <Typography variant="body2" color="text.secondary">{verifyStep}</Typography>
        </Box>
      )}

      {/* Result alert */}
      {verificationResult && (
        <Alert
          severity={verificationResult.matched ? 'success' : 'error'}
          icon={verificationResult.matched ? <CheckCircleOutlineIcon/> : <ErrorOutlineIcon/>}
          sx={{mb: 2}}
          onClose={() => setVerificationResult(null)}
        >
          {verificationResult.matched
            ? verificationResult.message
            : verificationResult.error}
        </Alert>
      )}



      <canvas ref={canvasRef} style={{display: 'none'}}/>

      {/* Action buttons */}
      <Box sx={{display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, mt: 1}}>
        <IconButton onClick={handleBack} color="primary" title="Back to registration details">
          <ArrowBackIcon/>
        </IconButton>

        <Button
          variant="contained"
          color="primary"
          disabled={modelsLoading || (!cameraStream && !capturedPhoto && modelsLoaded && !cameraError)}
          {...getMiddleButtonProps()}
        />

        <Button
          variant="contained"
          color={verificationResult?.matched ? 'success' : 'primary'}
          onClick={verificationResult?.matched ? handleFinalSubmit : handleVerify}
          disabled={!capturedPhoto || isVerifying || isSubmitting || modelsLoading}
          sx={{minWidth: 130}}
        >
          {isVerifying ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{mr: 1}}/>
              Verifying...
            </>
          ) : isSubmitting ? (
            <>
              <CircularProgress size={20} color="inherit" sx={{mr: 1}}/>
              Registering...
            </>
          ) : verificationResult?.matched ? (
            '✓ Register'
          ) : (
            'Verify Face'
          )}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{mt: 2}} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
};

export default PhotoMatching;
