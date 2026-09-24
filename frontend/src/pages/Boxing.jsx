import {
  ArrowLeft,
  BookOpen,
  Video,
  Play,
  Upload,
  Brain,
  CheckCircle2,
  Shield,
  Target,
  RotateCcw,
  Hand,
  Camera,
  Square,
  RotateCw,
  Loader2,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Boxing.css";

function Boxing() {
  const navigate = useNavigate();

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);
  const [cameraError, setCameraError] = useState("");

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);

  /* =========================================
     VIDEO UPLOAD
  ========================================= */

  const handleVideoUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (!file.type.startsWith("video/")) {
      alert("Please upload a valid video file.");
      return;
    }

    setSelectedVideo(file);
    setRecordedVideo(null);
    setAnalysisResult(null);

    const url = URL.createObjectURL(file);
    setVideoPreview(url);
  };

  /* =========================================
     START CAMERA
  ========================================= */

  const startRecording = async () => {
    try {
      setCameraError("");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      cameraStreamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
        await videoRef.current.play();
      }

      recordedChunksRef.current = [];

      const recorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported("video/webm")
          ? "video/webm"
          : undefined,
      });

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: "video/webm",
        });

        const url = URL.createObjectURL(blob);

        setRecordedVideo(blob);
        setVideoPreview(url);
        setSelectedVideo(null);

        if (cameraStreamRef.current) {
          cameraStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          cameraStreamRef.current = null;
        }
      };

      recorder.start();
      setIsRecording(true);
      setAnalysisResult(null);
    } catch (error) {
      console.error(error);

      setCameraError(
        "Camera or microphone access was blocked. Please allow permission and try again."
      );
    }
  };

  /* =========================================
     STOP CAMERA
  ========================================= */

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

  /* =========================================
     RESET PRACTICE
  ========================================= */

  const resetPractice = () => {
    setSelectedVideo(null);
    setRecordedVideo(null);
    setVideoPreview(null);
    setAnalysisResult(null);

    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    setIsRecording(false);
  };

  /* =========================================
     AI ANALYSIS
  ========================================= */

  const analyzePerformance = async () => {
    const videoFile =
      selectedVideo ||
      (recordedVideo
        ? new File([recordedVideo], "boxing-practice.webm", {
            type: "video/webm",
          })
        : null);

    if (!videoFile) {
      alert("Please upload or record a video first.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisResult(null);

    try {
      /*
       * Connect this to the real FastAPI endpoint
       * when the boxing pose-analysis model is ready.
       *
       * Example:
       *
       * const formData = new FormData();
       * formData.append("video", videoFile);
       *
       * const response = await fetch(
       *   `${import.meta.env.VITE_API_URL}/analyze-boxing`,
       *   {
       *     method: "POST",
       *     body: formData,
       *   }
       * );
       *
       * const data = await response.json();
       */

      // Temporary MVP result.
      // This keeps the interface functional without
      // pretending that real AI analysis is already connected.
      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      setAnalysisResult({
        status: "ready",
        score: 86,
        feedback: [
          "Keep your guard hand closer to your chin.",
          "Return the lead hand faster after the jab.",
          "Maintain a stable stance during the punch.",
          "Keep your shoulders relaxed while extending.",
        ],
      });
    } catch (error) {
      console.error(error);

      setAnalysisResult({
        status: "error",
        message:
          "Unable to analyse the video. Please try again.",
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  /* =========================================
     CLEANUP
  ========================================= */

  useEffect(() => {
    return () => {
      if (cameraStreamRef.current) {
        cameraStreamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }

      if (videoPreview) {
        URL.revokeObjectURL(videoPreview);
      }
    };
  }, [videoPreview]);

  return (
    <div className="boxing-page">

      {/* =====================================
          BACK BUTTON
      ===================================== */}

      <button
        className="boxing-back"
        onClick={() => navigate("/martial-arts")}
      >
        <ArrowLeft size={20} />
        Back to Martial Arts
      </button>

      {/* =====================================
          HEADER
      ===================================== */}

      <section className="boxing-header">

        <span>
          MARTIAL ARTS / BOXING
        </span>

        <h1>
          Boxing Training
        </h1>

        <p>
          Learn boxing techniques step by step
          through lessons, demonstrations,
          live practice and video-based feedback.
        </p>

      </section>

      {/* =====================================
          LESSON
      ===================================== */}

      <section className="boxing-content">

        {/* TEXT LESSON */}

        <div className="boxing-lesson">

          <div className="lesson-title">

            <div className="lesson-icon">
              <BookOpen size={28} />
            </div>

            <div>

              <span>
                LESSON 01
              </span>

              <h2>
                The Jab
              </h2>

              <p>
                Master the fundamental straight punch.
              </p>

            </div>

          </div>

          <div className="jab-instructions">

            <div className="instruction">

              <span>01</span>

              <div>

                <h3>
                  Starting Stance
                </h3>

                <p>
                  Stand with your feet approximately
                  shoulder-width apart. Keep your knees
                  slightly bent and maintain a balanced
                  fighting stance.
                </p>

              </div>

            </div>

            <div className="instruction">

              <span>02</span>

              <div>

                <h3>
                  Guard Position
                </h3>

                <p>
                  Keep both hands close to your face.
                  Your rear hand should remain near your
                  chin while your lead hand is ready to
                  extend.
                </p>

              </div>

            </div>

            <div className="instruction">

              <span>03</span>

              <div>

                <h3>
                  Extend the Jab
                </h3>

                <p>
                  Extend your lead hand directly toward
                  the target. Keep the movement controlled
                  and avoid dropping your opposite hand.
                </p>

              </div>

            </div>

            <div className="instruction">

              <span>04</span>

              <div>

                <h3>
                  Shoulder Protection
                </h3>

                <p>
                  Allow the lead shoulder to move naturally
                  toward your chin while extending the punch.
                </p>

              </div>

            </div>

            <div className="instruction">

              <span>05</span>

              <div>

                <h3>
                  Recovery
                </h3>

                <p>
                  Quickly bring your hand back to the guard
                  position after the punch. Stay balanced
                  and ready for the next movement.
                </p>

              </div>

            </div>

          </div>

        </div>

        {/* ===================================
            VIDEO LESSON
        =================================== */}

        <div className="boxing-video-card">

          <div className="video-heading">

            <div className="video-heading-icon">
              <Video size={25} />
            </div>

            <div>

              <span>
                VIDEO LESSON
              </span>

              <h3>
                Jab Demonstration
              </h3>

            </div>

          </div>

          <div className="video-placeholder">

            <div className="video-placeholder-icon">
              <Play size={40} />
            </div>

            <h3>
              Jab Demonstration
            </h3>

            <p>
              Add your boxing lesson video to:
            </p>

            <code>
              public/lessons/boxing/jab.mp4
            </code>

            <span className="video-coming">
              LESSON VIDEO
            </span>

          </div>

          <div className="video-tip">

            <Video size={18} />

            <span>
              Watch the demonstration carefully
              before practising the technique.
            </span>

          </div>

        </div>

      </section>

      {/* =====================================
          KEY POINTS
      ===================================== */}

      <section className="key-points">

        <div className="key-points-header">

          <span>
            TECHNIQUE CHECKLIST
          </span>

          <h2>
            What to Focus On
          </h2>

        </div>

        <div className="key-points-grid">

          <div className="key-point">

            <Shield size={24} />

            <div>

              <h3>
                Guard
              </h3>

              <p>
                Keep your opposite hand protecting
                your face.
              </p>

            </div>

          </div>

          <div className="key-point">

            <Target size={24} />

            <div>

              <h3>
                Accuracy
              </h3>

              <p>
                Punch directly toward your target.
              </p>

            </div>

          </div>

          <div className="key-point">

            <RotateCcw size={24} />

            <div>

              <h3>
                Recovery
              </h3>

              <p>
                Return your hand quickly to your guard.
              </p>

            </div>

          </div>

          <div className="key-point">

            <Hand size={24} />

            <div>

              <h3>
                Control
              </h3>

              <p>
                Maintain balance throughout the movement.
              </p>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================
          AI PRACTICE
      ===================================== */}

      <section className="practice-section">

        <div className="practice-header">

          <div className="practice-icon">
            <Brain size={30} />
          </div>

          <div>

            <span>
              AI PRACTICE
            </span>

            <h2>
              Your Turn
            </h2>

            <p>
              Practise the jab using your camera
              or upload a recording.
            </p>

          </div>

        </div>

        {/* ===================================
            LIVE CAMERA
        =================================== */}

        <div className="live-practice">

          <div className="practice-option-header">

            <Camera size={24} />

            <div>

              <h3>
                Record Live
              </h3>

              <p>
                Use your camera to record your
                boxing practice.
              </p>

            </div>

          </div>

          <div className="camera-container">

            <video
              ref={videoRef}
              className="camera-preview"
              autoPlay
              playsInline
              muted
              style={{
                display:
                  isRecording ? "block" : "none",
              }}
            />

            {!isRecording && (
              <div className="camera-placeholder">

                <Camera size={42} />

                <p>
                  Camera preview will appear here
                </p>

              </div>
            )}

          </div>

          {cameraError && (
            <div className="camera-error">
              {cameraError}
            </div>
          )}

          <div className="record-controls">

            {!isRecording ? (

              <button
                className="record-button"
                onClick={startRecording}
              >
                <Camera size={18} />
                Start Recording
              </button>

            ) : (

              <button
                className="stop-record-button"
                onClick={stopRecording}
              >
                <Square size={18} />
                Stop Recording
              </button>

            )}

          </div>

        </div>

        {/* ===================================
            UPLOAD VIDEO
        =================================== */}

        <div className="upload-box">

          <div className="upload-icon">
            <Upload size={35} />
          </div>

          <h3>
            Upload Your Jab
          </h3>

          <p>
            Already have a recording?
            Upload your boxing practice video.
          </p>

          <label
            htmlFor="jab-upload"
            className="upload-jab-button"
          >

            <Upload size={18} />

            Upload Video

          </label>

          <input
            id="jab-upload"
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{
              display: "none",
            }}
          />

        </div>

        {/* ===================================
            VIDEO PREVIEW
        =================================== */}

        {videoPreview && (

          <div className="practice-video-result">

            <div className="result-heading">

              <Video size={22} />

              <div>

                <h3>
                  Practice Video
                </h3>

                <p>
                  Review your recording before analysis.
                </p>

              </div>

            </div>

            <video
              src={videoPreview}
              controls
              className="uploaded-video-preview"
            />

            <div className="video-actions">

              <button
                className="analyze-button"
                onClick={analyzePerformance}
                disabled={analysisLoading}
              >

                {analysisLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="spin"
                    />

                    Analysing...
                  </>
                ) : (
                  <>
                    <Brain size={18} />

                    Analyse My Technique
                  </>
                )}

              </button>

              <button
                className="reset-button"
                onClick={resetPractice}
                disabled={analysisLoading}
              >

                <X size={18} />

                Reset

              </button>

            </div>

          </div>

        )}

        {/* ===================================
            AI RESULT
        =================================== */}

        {analysisResult?.status === "ready" && (

          <div className="ai-analysis-result">

            <div className="analysis-result-header">

              <div className="analysis-success-icon">
                <CheckCircle2 size={26} />
              </div>

              <div>

                <span>
                  PRACTICE RESULT
                </span>

                <h3>
                  Boxing Technique Review
                </h3>

              </div>

              <div className="analysis-score">
                {analysisResult.score}%
              </div>

            </div>

            <div className="feedback-list">

              <h4>
                Feedback
              </h4>

              {analysisResult.feedback.map(
                (feedback, index) => (

                  <div
                    className="feedback-item"
                    key={index}
                  >

                    <CheckCircle2 size={18} />

                    <span>
                      {feedback}
                    </span>

                  </div>

                )
              )}

            </div>

            <div className="analysis-note">

              <Brain size={18} />

              <span>
                Connect the FastAPI boxing-analysis
                endpoint to replace this demonstration
                result with real pose-based analysis.
              </span>

            </div>

          </div>

        )}

        {analysisResult?.status === "error" && (

          <div className="ai-preview-result">

            <strong>
              Analysis failed
            </strong>

            <p>
              {analysisResult.message}
            </p>

          </div>

        )}

      </section>

    </div>
  );
}

export default Boxing;