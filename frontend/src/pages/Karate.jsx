```jsx
import {
  ArrowLeft,
  Shield,
  Play,
  Upload,
  Video,
  CheckCircle2,
  Brain,
  Camera,
  Square,
  RotateCcw,
  Target,
  Footprints,
  Hand,
  Loader2,
  X,
  Clock,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Karate.css";

function Karate() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(null);

  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordedVideo, setRecordedVideo] = useState(null);

  const [cameraError, setCameraError] = useState("");
  const [recordingTime, setRecordingTime] = useState(0);

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);

  const videoRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const recordedChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);

  const lessons = [
    {
      id: 1,
      title: "Basic Karate Stance",
      description:
        "Learn the correct stance, balance and body position.",
      video: "/lessons/karate/basic-stance.mp4",
    },
    {
      id: 2,
      title: "Straight Punch",
      description:
        "Learn the basic karate straight punch with proper technique.",
      video: "/lessons/karate/straight-punch.mp4",
    },
    {
      id: 3,
      title: "Front Kick",
      description:
        "Learn the basic front kick and correct leg movement.",
      video: "/lessons/karate/front-kick.mp4",
    },
    {
      id: 4,
      title: "Basic Block",
      description:
        "Learn a fundamental karate blocking technique.",
      video: "/lessons/karate/basic-block.mp4",
    },
  ];

  const formatRecordingTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
      remainingSeconds
    ).padStart(2, "0")}`;
  };

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

  const startRecording = async () => {
    try {
      setCameraError("");

      if (!navigator.mediaDevices?.getUserMedia) {
        setCameraError(
          "Camera recording is not supported by this browser."
        );
        return;
      }

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

      let recorder;

      if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("video/webm;codecs=vp9")
      ) {
        recorder = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9",
        });
      } else if (
        typeof MediaRecorder !== "undefined" &&
        MediaRecorder.isTypeSupported("video/webm")
      ) {
        recorder = new MediaRecorder(stream, {
          mimeType: "video/webm",
        });
      } else {
        recorder = new MediaRecorder(stream);
      }

      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, {
          type: recorder.mimeType || "video/webm",
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

        if (videoRef.current) {
          videoRef.current.srcObject = null;
        }
      };

      recorder.onerror = () => {
        setCameraError(
          "Something went wrong while recording. Please try again."
        );

        setIsRecording(false);

        if (recordingTimerRef.current) {
          clearInterval(recordingTimerRef.current);
          recordingTimerRef.current = null;
        }
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);
      setAnalysisResult(null);

      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((time) => time + 1);
      }, 1000);
    } catch (error) {
      console.error(error);

      setCameraError(
        "Camera or microphone access was blocked. Please allow permission and try again."
      );

      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    setIsRecording(false);
  };

  const resetPractice = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }

      mediaRecorderRef.current = null;
    }

    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    if (cameraStreamRef.current) {
      cameraStreamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      cameraStreamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

    setSelectedVideo(null);
    setRecordedVideo(null);
    setVideoPreview(null);
    setAnalysisResult(null);
    setRecordingTime(0);
    setCameraError("");
    setIsRecording(false);
  };

  const analyzePerformance = async () => {
    const videoToAnalyze =
      selectedVideo ||
      (recordedVideo
        ? new File(
            [recordedVideo],
            "karate-practice.webm",
            {
              type: "video/webm",
            }
          )
        : null);

    if (!videoToAnalyze) {
      alert("Please upload or record a video first.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisResult(null);

    try {
      /*
       * Future real FastAPI endpoint:
       *
       * const formData = new FormData();
       * formData.append("video", videoToAnalyze);
       *
       * const response = await fetch(
       *   `${import.meta.env.VITE_API_URL}/analyze-karate`,
       *   {
       *     method: "POST",
       *     body: formData,
       *   }
       * );
       *
       * const data = await response.json();
       */

      /*
       * Current competition prototype result.
       * Real pose-based AI analysis can be connected later.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      setAnalysisResult({
        status: "ready",

        score: 88,

        feedback: [
          "Maintain a stronger and more stable stance.",
          "Keep your hands closer to the correct guard position.",
          "Focus on controlled movement throughout the technique.",
          "Return smoothly to your starting position.",
        ],

        technique: [
          {
            name: "Stance Stability",
            status: "good",
            value: "Good",
          },
          {
            name: "Body Balance",
            status: "good",
            value: "Good",
          },
          {
            name: "Hand Position",
            status: "improve",
            value: "Improve",
          },
          {
            name: "Movement Control",
            status: "good",
            value: "Good",
          },
          {
            name: "Recovery Position",
            status: "improve",
            value: "Improve",
          },
        ],

        summary:
          "Your overall Karate movement is developing well. Focus on maintaining a strong stance, correct hand position and controlled recovery after each technique.",
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

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }

      if (mediaRecorderRef.current) {
        if (mediaRecorderRef.current.state !== "inactive") {
          mediaRecorderRef.current.stop();
        }
      }

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
    <div className="karate-page">
      <button
        className="karate-back-button"
        onClick={() => navigate("/martial-arts")}
      >
        <ArrowLeft size={20} />
        Back to Martial Arts
      </button>

      <section className="karate-header">
        <div className="karate-header-icon">
          <Shield size={42} />
        </div>

        <span className="karate-label">
          SKILLSENSAI MARTIAL ARTS
        </span>

        <h1>
          Learn <span>Karate</span>
        </h1>

        <p>
          Learn fundamental karate techniques through guided
          lessons and practise them with AI-powered feedback.
        </p>
      </section>

      <section className="karate-lessons">
        <div className="karate-section-title">
          <h2>Karate Lessons</h2>

          <p>
            Follow the lessons step by step and practise each
            technique.
          </p>
        </div>

        <div className="karate-lesson-grid">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`karate-lesson-card ${
                selectedLesson?.id === lesson.id
                  ? "selected"
                  : ""
              }`}
              onClick={() => setSelectedLesson(lesson)}
            >
              <div className="karate-lesson-number">
                {lesson.id}
              </div>

              <div className="karate-lesson-content">
                <h3>{lesson.title}</h3>

                <p>{lesson.description}</p>
              </div>

              <Play size={20} />
            </button>
          ))}
        </div>
      </section>

      {selectedLesson && (
        <section className="karate-video-section">
          <div className="karate-section-title">
            <h2>{selectedLesson.title}</h2>

            <p>{selectedLesson.description}</p>
          </div>

          <div className="karate-video-container">
            <video
              className="karate-lesson-video"
              controls
              src={selectedLesson.video}
            >
              Your browser does not support video playback.
            </video>
          </div>
        </section>
      )}

      <section className="karate-practice">
        <div className="karate-section-title">
          <h2>Practice Your Technique</h2>

          <p>
            Record yourself or upload a video of your practice.
          </p>
        </div>

        <div className="karate-practice-grid">
          <div className="karate-practice-card karate-live-card">
            <div className="karate-practice-icon">
              <Camera size={30} />
            </div>

            <h3>Record Live</h3>

            <p>
              Use your camera to record your karate technique.
              Position your full body inside the camera frame.
            </p>

            <div className="karate-camera-container">
              {isRecording && (
                <div className="karate-recording-status">
                  <span className="karate-recording-dot"></span>

                  <span>RECORDING</span>

                  <Clock size={15} />

                  <strong>
                    {formatRecordingTime(recordingTime)}
                  </strong>
                </div>
              )}

              <video
                ref={videoRef}
                className="karate-camera-preview"
                autoPlay
                playsInline
                muted
                style={{
                  display: isRecording
                    ? "block"
                    : "none",
                }}
              />

              {!isRecording && (
                <div className="karate-camera-placeholder">
                  <Camera size={40} />

                  <h4>Camera Ready</h4>

                  <p>
                    Make sure your full body and
                    movement are visible.
                  </p>
                </div>
              )}
            </div>

            {cameraError && (
              <div className="karate-camera-error">
                {cameraError}
              </div>
            )}

            {!isRecording ? (
              <button
                className="karate-action-button"
                onClick={startRecording}
              >
                <Camera size={18} />
                Start Practice Recording
              </button>
            ) : (
              <button
                className="karate-action-button recording"
                onClick={stopRecording}
              >
                <Square size={18} />
                Stop Recording

                <span>
                  {formatRecordingTime(recordingTime)}
                </span>
              </button>
            )}
          </div>

          <div className="karate-practice-card">
            <div className="karate-practice-icon">
              <Upload size={30} />
            </div>

            <h3>Upload Video</h3>

            <p>
              Upload a video of your karate practice for
              analysis.
            </p>

            <label
              htmlFor="karate-video-upload"
              className="karate-action-button"
            >
              <Upload size={18} />
              Choose Video
            </label>

            <input
              id="karate-video-upload"
              type="file"
              accept="video/*"
              onChange={handleVideoUpload}
              hidden
            />

            {selectedVideo && (
              <div className="karate-upload-success">
                <CheckCircle2 size={18} />

                <span>
                  {selectedVideo.name}
                </span>
              </div>
            )}
          </div>
        </div>

        {videoPreview && (
          <div className="karate-practice-result">
            <div className="karate-result-heading">
              <Video size={22} />

              <div>
                <h3>Practice Video</h3>

                <p>
                  Review your recording before AI analysis.
                </p>
              </div>
            </div>

            <video
              src={videoPreview}
              controls
              className="karate-uploaded-video-preview"
            />

            <div className="karate-video-actions">
              <button
                className="karate-analyze-button"
                onClick={analyzePerformance}
                disabled={analysisLoading}
              >
                {analysisLoading ? (
                  <>
                    <Loader2
                      size={18}
                      className="karate-spin"
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
                className="karate-reset-button"
                onClick={resetPractice}
                disabled={analysisLoading}
              >
                <RotateCcw size={18} />

                Reset
              </button>
            </div>
          </div>
        )}

        {analysisResult?.status === "ready" && (
          <div className="karate-analysis-result">
            <div className="karate-analysis-header">
              <div className="karate-analysis-success">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <span>PRACTICE RESULT</span>

                <h3>
                  Karate Technique Review
                </h3>
              </div>

              <div className="karate-analysis-score">
                {analysisResult.score}%
              </div>
            </div>

            <div className="karate-feedback-list">
              <h4>Feedback</h4>

              {analysisResult.feedback.map(
                (feedback, index) => (
                  <div
                    className="karate-feedback-item"
                    key={index}
                  >
                    <CheckCircle2 size={18} />

                    <span>{feedback}</span>
                  </div>
                )
              )}
            </div>

            <div className="karate-technique-breakdown">
              <h4>Technique Breakdown</h4>

              <div className="karate-technique-grid">
                {analysisResult.technique.map(
                  (item, index) => (
                    <div
                      className={`karate-technique-item ${item.status}`}
                      key={index}
                    >
                      <div className="karate-technique-left">
                        {item.status === "good" ? (
                          <CheckCircle2 size={18} />
                        ) : (
                          <Target size={18} />
                        )}

                        <span>
                          {item.name}
                        </span>
                      </div>

                      <strong>
                        {item.value}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>

            <div className="karate-improvement-summary">
              <Brain size={20} />

              <div>
                <strong>
                  AI Improvement Tip
                </strong>

                <p>
                  {analysisResult.summary}
                </p>
              </div>
            </div>

            <div className="karate-analysis-note">
              <Brain size={18} />

              <span>
                This is a prototype analysis result.
                Real pose-based AI analysis will be
                connected to the SkillSensAI AI backend
                in a future version.
              </span>
            </div>
          </div>
        )}

        {analysisResult?.status === "error" && (
          <div className="karate-analysis-error">
            <strong>Analysis failed</strong>

            <p>{analysisResult.message}</p>
          </div>
        )}
      </section>

      <section className="karate-ai-section">
        <Shield size={28} />

        <div>
          <h3>AI-Powered Technique Analysis</h3>

          <p>
            SkillSensAI analyses your practice workflow
            and provides personalised technique feedback.
            Real pose-based movement analysis will be
            connected in the next development stage.
          </p>
        </div>
      </section>
    </div>
  );
}

export default Karate;
```
