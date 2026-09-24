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
  Loader2,
  X,
} from "lucide-react";

import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Boxing.css";

function Boxing() {
  const navigate = useNavigate();

  const lessons = [
    {
      id: 1,
      title: "The Jab",
      description: "Master the fundamental straight punch.",
      video: "/lessons/boxing/jab.mp4",
      steps: [
        {
          title: "Starting Stance",
          text: "Stand with your feet approximately shoulder-width apart. Keep your knees slightly bent and maintain a balanced fighting stance.",
        },
        {
          title: "Guard Position",
          text: "Keep both hands close to your face. Your rear hand should remain near your chin while your lead hand is ready to extend.",
        },
        {
          title: "Extend the Jab",
          text: "Extend your lead hand directly toward the target. Keep the movement controlled and avoid dropping your opposite hand.",
        },
        {
          title: "Shoulder Protection",
          text: "Allow the lead shoulder to move naturally toward your chin while extending the punch.",
        },
        {
          title: "Recovery",
          text: "Quickly bring your hand back to the guard position after the punch. Stay balanced and ready for the next movement.",
        },
      ],
    },

    {
      id: 2,
      title: "The Cross",
      description: "Learn the powerful rear-hand straight punch.",
      video: "/lessons/boxing/cross.mp4",
      steps: [
        {
          title: "Starting Stance",
          text: "Begin in a balanced boxing stance with your hands protecting your face.",
        },
        {
          title: "Rotate the Body",
          text: "Rotate your rear shoulder and hip as you drive the punch forward.",
        },
        {
          title: "Extend the Punch",
          text: "Extend the rear hand straight toward the target while maintaining control.",
        },
        {
          title: "Protect the Face",
          text: "Keep your lead hand near your face while the rear hand is extended.",
        },
        {
          title: "Return to Guard",
          text: "Bring the punching hand back quickly and return to your original stance.",
        },
      ],
    },

    {
      id: 3,
      title: "The Hook",
      description: "Learn the basic horizontal hook punch.",
      video: "/lessons/boxing/hook.mp4",
      steps: [
        {
          title: "Boxing Stance",
          text: "Start from a stable boxing stance with your hands raised.",
        },
        {
          title: "Bend the Arm",
          text: "Keep the punching arm bent while preparing the hook.",
        },
        {
          title: "Rotate the Body",
          text: "Rotate your hips and shoulders together to generate controlled power.",
        },
        {
          title: "Move Horizontally",
          text: "Move the fist across the target in a controlled horizontal path.",
        },
        {
          title: "Recover",
          text: "Return your hand to the guard position immediately after the punch.",
        },
      ],
    },

    {
      id: 4,
      title: "The Uppercut",
      description: "Learn the basic upward punching movement.",
      video: "/lessons/boxing/uppercut.mp4",
      steps: [
        {
          title: "Stable Stance",
          text: "Maintain a balanced stance with your knees slightly bent.",
        },
        {
          title: "Lower the Hand",
          text: "Keep the movement compact instead of dropping the hand excessively.",
        },
        {
          title: "Drive Upward",
          text: "Use controlled leg and hip movement to drive the punch upward.",
        },
        {
          title: "Keep the Guard",
          text: "Keep the opposite hand protecting your face throughout the movement.",
        },
        {
          title: "Return",
          text: "Bring the punching hand back to your guard position.",
        },
      ],
    },

    {
      id: 5,
      title: "Basic Footwork",
      description: "Build balance and movement with basic boxing footwork.",
      video: "/lessons/boxing/footwork.mp4",
      steps: [
        {
          title: "Ready Position",
          text: "Start with your feet in a comfortable boxing stance.",
        },
        {
          title: "Small Steps",
          text: "Move using small controlled steps rather than crossing your feet.",
        },
        {
          title: "Forward Movement",
          text: "Step forward while maintaining your stance and balance.",
        },
        {
          title: "Backward Movement",
          text: "Move backward while keeping your guard and stance stable.",
        },
        {
          title: "Stay Balanced",
          text: "Keep your feet under control and remain ready to punch or defend.",
        },
      ],
    },
  ];

  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);

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

  const selectLesson = (lesson) => {
    if (isRecording) {
      alert("Please stop the current recording before changing lessons.");
      return;
    }

    resetPractice();
    setSelectedLesson(lesson);
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

    if (videoPreview) {
      URL.revokeObjectURL(videoPreview);
    }

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

      const mimeType = MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp8,opus"
      )
        ? "video/webm;codecs=vp8,opus"
        : "video/webm";

      const recorder = new MediaRecorder(stream, {
        mimeType,
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

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);
  };

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

  const analyzePerformance = async () => {
    const videoFile =
      selectedVideo ||
      (recordedVideo
        ? new File(
            [recordedVideo],
            `boxing-${selectedLesson.title
              .toLowerCase()
              .replace(/\s+/g, "-")}.webm`,
            {
              type: "video/webm",
            }
          )
        : null);

    if (!videoFile) {
      alert("Please upload or record a video first.");
      return;
    }

    setAnalysisLoading(true);
    setAnalysisResult(null);

    try {
      /*
       * Temporary MVP analysis result.
       *
       * Later this can be replaced with:
       *
       * POST /analyze-boxing
       *
       * using MediaPipe/OpenCV pose analysis.
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 1500)
      );

      setAnalysisResult({
        status: "ready",
        score: 86,
        feedback: [
          "Keep your guard hand closer to your chin.",
          "Maintain a stable stance during the movement.",
          "Return your hand to the guard position quickly.",
          "Keep your movements controlled and balanced.",
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
      <button
        className="boxing-back"
        onClick={() => navigate("/martial-arts")}
      >
        <ArrowLeft size={20} />
        Back to Martial Arts
      </button>

      <section className="boxing-header">
        <span>MARTIAL ARTS / BOXING</span>

        <h1>Boxing Training</h1>

        <p>
          Learn boxing techniques step by step through
          lessons, demonstrations, live practice and
          video-based feedback.
        </p>
      </section>

      {/* LESSON SELECTOR */}

      <section className="boxing-lessons-selector">
        <div className="boxing-selector-header">
          <span>TRAINING PROGRAM</span>

          <h2>Choose a Lesson</h2>

          <p>
            Select a technique to learn and practise.
          </p>
        </div>

        <div className="boxing-lessons-grid">
          {lessons.map((lesson) => (
            <button
              key={lesson.id}
              className={`boxing-lesson-select ${
                selectedLesson.id === lesson.id
                  ? "active"
                  : ""
              }`}
              onClick={() => selectLesson(lesson)}
            >
              <span className="boxing-lesson-number">
                {lesson.id}
              </span>

              <div>
                <strong>{lesson.title}</strong>
                <small>{lesson.description}</small>
              </div>

              {selectedLesson.id === lesson.id && (
                <CheckCircle2 size={19} />
              )}
            </button>
          ))}
        </div>
      </section>

      {/* SELECTED LESSON */}

      <section className="boxing-content">
        <div className="boxing-lesson">
          <div className="lesson-title">
            <div className="lesson-icon">
              <BookOpen size={28} />
            </div>

            <div>
              <span>
                LESSON {String(selectedLesson.id).padStart(2, "0")}
              </span>

              <h2>{selectedLesson.title}</h2>

              <p>{selectedLesson.description}</p>
            </div>
          </div>

          <div className="jab-instructions">
            {selectedLesson.steps.map((step, index) => (
              <div
                className="instruction"
                key={step.title}
              >
                <span>
                  {String(index + 1).padStart(2, "0")}
                </span>

                <div>
                  <h3>{step.title}</h3>

                  <p>{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* VIDEO LESSON */}

        <div className="boxing-video-card">
          <div className="video-heading">
            <div className="video-heading-icon">
              <Video size={25} />
            </div>

            <div>
              <span>VIDEO LESSON</span>

              <h3>
                {selectedLesson.title} Demonstration
              </h3>
            </div>
          </div>

          <div className="video-placeholder">
            <div className="video-placeholder-icon">
              <Play size={40} />
            </div>

            <h3>{selectedLesson.title}</h3>

            <p>Add your lesson video to:</p>

            <code>{`public${selectedLesson.video}`}</code>

            <span className="video-coming">
              LESSON VIDEO
            </span>
          </div>

          <div className="video-tip">
            <Video size={18} />

            <span>
              Watch the demonstration carefully before
              practising the technique.
            </span>
          </div>
        </div>
      </section>

      {/* KEY POINTS */}

      <section className="key-points">
        <div className="key-points-header">
          <span>TECHNIQUE CHECKLIST</span>

          <h2>What to Focus On</h2>
        </div>

        <div className="key-points-grid">
          <div className="key-point">
            <Shield size={24} />

            <div>
              <h3>Guard</h3>

              <p>
                Keep your hands protecting your face.
              </p>
            </div>
          </div>

          <div className="key-point">
            <Target size={24} />

            <div>
              <h3>Accuracy</h3>

              <p>
                Perform the movement toward the intended
                target.
              </p>
            </div>
          </div>

          <div className="key-point">
            <RotateCcw size={24} />

            <div>
              <h3>Recovery</h3>

              <p>
                Return smoothly to your ready position.
              </p>
            </div>
          </div>

          <div className="key-point">
            <Hand size={24} />

            <div>
              <h3>Control</h3>

              <p>
                Maintain balance throughout the movement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* AI PRACTICE */}

      <section className="practice-section">
        <div className="practice-header">
          <div className="practice-icon">
            <Brain size={30} />
          </div>

          <div>
            <span>AI PRACTICE</span>

            <h2>Your Turn</h2>

            <p>
              Practise {selectedLesson.title.toLowerCase()}
              using your camera or upload a recording.
            </p>
          </div>
        </div>

        {/* LIVE CAMERA */}

        <div className="live-practice">
          <div className="practice-option-header">
            <Camera size={24} />

            <div>
              <h3>Record Live</h3>

              <p>
                Use your camera to record your boxing
                practice.
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
                display: isRecording ? "block" : "none",
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

        {/* UPLOAD */}

        <div className="upload-box">
          <div className="upload-icon">
            <Upload size={35} />
          </div>

          <h3>Upload Your Practice</h3>

          <p>
            Already have a recording? Upload your boxing
            practice video.
          </p>

          <label
            htmlFor="boxing-upload"
            className="upload-jab-button"
          >
            <Upload size={18} />
            Upload Video
          </label>

          <input
            id="boxing-upload"
            type="file"
            accept="video/*"
            onChange={handleVideoUpload}
            style={{ display: "none" }}
          />
        </div>

        {/* VIDEO PREVIEW */}

        {videoPreview && (
          <div className="practice-video-result">
            <div className="result-heading">
              <Video size={22} />

              <div>
                <h3>Practice Video</h3>

                <p>
                  {selectedLesson.title} — review your
                  recording before analysis.
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

        {/* RESULT */}

        {analysisResult?.status === "ready" && (
          <div className="ai-analysis-result">
            <div className="analysis-result-header">
              <div className="analysis-success-icon">
                <CheckCircle2 size={26} />
              </div>

              <div>
                <span>PRACTICE RESULT</span>

                <h3>
                  {selectedLesson.title} Review
                </h3>
              </div>

              <div className="analysis-score">
                {analysisResult.score}%
              </div>
            </div>

            <div className="feedback-list">
              <h4>Feedback</h4>

              {analysisResult.feedback.map(
                (feedback, index) => (
                  <div
                    className="feedback-item"
                    key={index}
                  >
                    <CheckCircle2 size={18} />

                    <span>{feedback}</span>
                  </div>
                )
              )}
            </div>

            <div className="analysis-note">
              <Brain size={18} />

              <span>
                This is currently a prototype feedback
                result. Real pose-based AI analysis can be
                connected to the backend later.
              </span>
            </div>
          </div>
        )}

        {analysisResult?.status === "error" && (
          <div className="ai-preview-result">
            <strong>Analysis failed</strong>

            <p>{analysisResult.message}</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default Boxing;
