import {
  ArrowLeft,
  Music2,
  BookOpen,
  Mic2,
  Upload,
  Square,
  Loader2,
  CheckCircle2,
  RotateCcw,
  Sparkles,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";

import "./MusicLearn.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";

/*
============================================================
LESSONS
============================================================

The existing lesson videos are also used as the reference
audio for AI comparison.

This means you do NOT need additional reference files right now.

Later, if you add dedicated reference audio files, simply add:

referenceAudio: "/lessons/music/pitch-basics.mp3"

to the corresponding lesson.
*/

const lessons = [
  {
    id: 1,
    title: "Pitch Basics",
    level: "BEGINNER",
    description:
      "Learn how high and low sounds work. Understand pitch and practise controlling your voice.",
    video: "/lessons/music/pitch-basics.mp4",
    referenceAudio: null,
  },
  {
    id: 2,
    title: "Rhythm Basics",
    level: "BEGINNER",
    description:
      "Learn how rhythm and timing work in music. Practise keeping a steady beat.",
    video: "/lessons/music/rhythm-basics.mp4",
    referenceAudio: null,
  },
  {
    id: 3,
    title: "Voice Control",
    level: "BEGINNER",
    description:
      "Learn basic voice control techniques and practise producing a steady sound.",
    video: "/lessons/music/voice-control.mp4",
    referenceAudio: null,
  },
];

// A lightweight browser-only fallback. This is a practice estimate, not an AI
// comparison against the lesson reference. It lets learners get useful feedback
// even when the hosted backend is sleeping or temporarily unreachable.
async function createLocalPracticeEstimate(audioBlob) {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Your browser does not support local audio analysis.");
  }

  const context = new AudioContextClass();
  try {
    const decoded = await context.decodeAudioData(await audioBlob.arrayBuffer());
    const channel = decoded.getChannelData(0);
    const sampleRate = decoded.sampleRate;
    const duration = decoded.duration || 0;
    const frameSize = Math.max(1024, Math.floor(sampleRate * 0.05));
    const hopSize = Math.max(512, Math.floor(sampleRate * 0.025));
    const rmsValues = [];
    let activeFrames = 0;

    for (let start = 0; start + frameSize < channel.length; start += hopSize) {
      let sum = 0;
      for (let i = 0; i < frameSize; i++) {
        const value = channel[start + i];
        sum += value * value;
      }
      const rms = Math.sqrt(sum / frameSize);
      rmsValues.push(rms);
      if (rms > 0.012) activeFrames++;
    }

    if (!rmsValues.length) {
      throw new Error("The recording was too short to analyse. Please record for at least 2–3 seconds.");
    }

    const voicedRatio = activeFrames / rmsValues.length;
    const activeRms = rmsValues.filter((value) => value > 0.012);
    const mean = activeRms.length
      ? activeRms.reduce((sum, value) => sum + value, 0) / activeRms.length
      : 0;
    const variance = activeRms.length
      ? activeRms.reduce((sum, value) => sum + ((value - mean) ** 2), 0) / activeRms.length
      : 0;
    const coefficientOfVariation = mean > 0 ? Math.sqrt(variance) / mean : 1;
    const volumeConsistency = Math.max(0, Math.min(100, 100 - coefficientOfVariation * 55));
    const voiceActivity = Math.max(0, Math.min(100, voicedRatio * 100));
    const score = Math.round(Math.max(0, Math.min(100, voiceActivity * 0.65 + volumeConsistency * 0.35)));

    const feedback = [];
    if (duration < 3) feedback.push("Try recording for at least 5–10 seconds so there is more audio to review.");
    if (voiceActivity < 20) feedback.push("Your recording sounds very quiet or contains long pauses. Move closer to the microphone and check its input level.");
    else feedback.push("Your recording contains audible voice activity. Keep the microphone at a consistent distance.");
    if (volumeConsistency < 55) feedback.push("Try keeping your voice volume steadier from beginning to end.");
    else feedback.push("Your volume was reasonably consistent in this recording.");
    feedback.push("This is a local recording check only. Reference pitch and note matching require the SkillSensAI backend.");

    return {
      success: true,
      isLocalEstimate: true,
      overall_score: score,
      pitch_accuracy: null,
      note_match: null,
      stability: Math.round(volumeConsistency * 10) / 10,
      average_pitch_error_cents: null,
      voice_activity: Math.round(voiceActivity * 10) / 10,
      volume_consistency: Math.round(volumeConsistency * 10) / 10,
      duration_seconds: Math.round(duration * 10) / 10,
      feedback,
    };
  } finally {
    await context.close().catch(() => {});
  }
}

function MusicLearn() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(lessons[0]);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [recordedAudio, setRecordedAudio] = useState(null);
  const [uploadedAudio, setUploadedAudio] = useState(null);

  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [error, setError] = useState("");

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }

      if (streamRef.current) {
        streamRef.current
          .getTracks()
          .forEach((track) => track.stop());
      }
    };
  }, []);

  /*
  ============================================================
  START RECORDING
  ============================================================
  */

  const startRecording = async () => {
    try {
      setError("");
      setAnalysis(null);
      setRecordedAudio(null);
      setUploadedAudio(null);

      if (
        !navigator.mediaDevices ||
        !navigator.mediaDevices.getUserMedia
      ) {
        setError(
          "Your browser does not support microphone recording."
        );
        return;
      }

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      /*
      Prefer a browser-supported audio MIME type.
      */

      let recorderOptions = {};

      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {
        recorderOptions = {
          mimeType: "audio/webm;codecs=opus",
        };
      } else if (
        MediaRecorder.isTypeSupported("audio/webm")
      ) {
        recorderOptions = {
          mimeType: "audio/webm",
        };
      }

      const recorder = new MediaRecorder(
        stream,
        recorderOptions
      );

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const mimeType =
          recorder.mimeType || "audio/webm";

        const blob = new Blob(
          chunksRef.current,
          {
            type: mimeType,
          }
        );

        const audioUrl =
          URL.createObjectURL(blob);

        setRecordedAudio({
          blob,
          url: audioUrl,
          name: "my-recording.webm",
        });

        if (streamRef.current) {
          streamRef.current
            .getTracks()
            .forEach((track) => track.stop());

          streamRef.current = null;
        }
      };

      recorder.onerror = (event) => {
        console.error(
          "MediaRecorder error:",
          event
        );

        setError(
          "Something went wrong while recording. Please try again."
        );

        setIsRecording(false);
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((previous) => {
          return previous + 1;
        });
      }, 1000);
    } catch (err) {
      console.error(err);

      setError(
        "Microphone access was blocked. Please allow microphone permission and try again."
      );
    }
  };

  /*
  ============================================================
  STOP RECORDING
  ============================================================
  */

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    setIsRecording(false);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  /*
  ============================================================
  UPLOAD AUDIO
  ============================================================
  */

  const handleAudioUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setError("");
    setAnalysis(null);
    setRecordedAudio(null);

    if (uploadedAudio?.url) {
      URL.revokeObjectURL(uploadedAudio.url);
    }

    const audioUrl =
      URL.createObjectURL(file);

    setUploadedAudio({
      file,
      url: audioUrl,
      name: file.name,
    });

    /*
    Allow the same file to be selected again later.
    */
    event.target.value = "";
  };

  /*
  ============================================================
  GET CURRENT USER AUDIO
  ============================================================
  */

  const getCurrentAudio = () => {
    if (recordedAudio) {
      return recordedAudio.blob;
    }

    if (uploadedAudio) {
      return uploadedAudio.file;
    }

    return null;
  };

  /*
  ============================================================
  GET REFERENCE FILE
  ============================================================
  
  If a dedicated referenceAudio exists, use it.

  Otherwise use the lesson video.

  The backend already supports video/audio conversion through
  FFmpeg, so this keeps your current project structure intact.
  */

  const getReferenceFile = async () => {
    const referencePath =
      selectedLesson.referenceAudio ||
      selectedLesson.video;

    const referenceResponse =
      await fetch(referencePath);

    if (!referenceResponse.ok) {
      throw new Error(
        "The lesson reference could not be loaded."
      );
    }

    const referenceBlob =
      await referenceResponse.blob();

    const extension =
      selectedLesson.referenceAudio
        ? "mp3"
        : "mp4";

    return new File(
      [referenceBlob],
      `lesson-${selectedLesson.id}-reference.${extension}`,
      {
        type:
          referenceBlob.type ||
          "audio/mpeg",
      }
    );
  };

  /*
  ============================================================
  ANALYZE PERFORMANCE
  ============================================================

  IMPORTANT:

  We no longer calculate a score from pitch RANGE.

  Instead:

  Lesson reference
          +
  User recording
          ↓
  /compare-song-voice
          ↓
  Real pitch comparison
          ↓
  Score + feedback
  */

  const analyzeRecording = async () => {
    const audio = getCurrentAudio();

    if (!audio) {
      setError(
        "Please record your voice or upload an audio file first."
      );
      return;
    }

    try {
      setLoading(true);
      setError("");
      setAnalysis(null);

      /*
      Load lesson reference.
      */

      const referenceFile =
        await getReferenceFile();

      const formData = new FormData();

      /*
      Existing backend expects:

      song
      voice
      */

      formData.append(
        "song",
        referenceFile,
        referenceFile.name
      );

      formData.append(
        "voice",
        audio,
        audio.name || "recording.webm"
      );

      const response = await fetch(
        `${API_URL}/compare-song-voice`,
        {
          method: "POST",
          body: formData,
        }
      );

      let data = null;

      try {
        data = await response.json();
      } catch {
        throw new Error(
          "The backend returned an invalid response."
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.detail ||
            "Analysis failed."
        );
      }

      if (!data.success) {
        throw new Error(
          "The backend could not analyse the recording."
        );
      }

      /*
      The score now comes directly from the backend.
      */

      setAnalysis(data);
    } catch (err) {
      console.error(
        "Music analysis error:",
        err
      );

      // If the hosted backend is unavailable, still give the learner a useful
      // browser-only result instead of ending with an error-only screen.
      try {
        const localEstimate = await createLocalPracticeEstimate(audio);
        setAnalysis(localEstimate);
        setError(
          "Backend analysis was unavailable, so this is a local practice estimate. It does not compare your voice with the lesson reference."
        );
      } catch (localErr) {
        console.error("Local recording estimate failed:", localErr);
        setError(
          localErr?.message ||
            err?.message ||
            "Unable to analyse the recording. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  /*
  ============================================================
  RESET PRACTICE
  ============================================================
  */

  const resetPractice = () => {
    if (recordedAudio?.url) {
      URL.revokeObjectURL(
        recordedAudio.url
      );
    }

    if (uploadedAudio?.url) {
      URL.revokeObjectURL(
        uploadedAudio.url
      );
    }

    setRecordedAudio(null);
    setUploadedAudio(null);
    setAnalysis(null);
    setError("");
    setRecordingTime(0);

    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) => track.stop());

      streamRef.current = null;
    }

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    mediaRecorderRef.current = null;
  };

  /*
  ============================================================
  CONTINUE TO NEXT LESSON
  ============================================================
  */

  const continueToNextLesson = () => {
    const currentIndex = lessons.findIndex(
      (lesson) => lesson.id === selectedLesson.id
    );

    if (currentIndex < 0) {
      setError("Unable to find the current lesson. Please select a lesson and try again.");
      return;
    }

    const nextLesson = lessons[currentIndex + 1];

    if (!nextLesson) {
      navigate("/music");
      return;
    }

    // Clear the previous lesson's recording and analysis.
    resetPractice();

    // Select the next lesson so its title, video, and practice
    // section render from the same existing lessons array.
    setSelectedLesson(nextLesson);

    // Bring the new lesson content into view.
    window.requestAnimationFrame(() => {
      const lessonSection = document.querySelector(
        ".selected-lesson-section"
      );

      if (lessonSection) {
        lessonSection.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        window.scrollTo({
          top: 0,
          behavior: "smooth",
        });
      }
    });
  };

  /*
  ============================================================
  FORMAT TIME
  ============================================================
  */

  const formatTime = (seconds) => {
    const mins = Math.floor(
      seconds / 60
    );

    const secs = seconds % 60;

    return `${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  };

  /*
  ============================================================
  CURRENT AUDIO
  ============================================================
  */

  const currentAudio =
    recordedAudio?.url ||
    uploadedAudio?.url ||
    null;

  /*
  ============================================================
  SCORE LABEL
  ============================================================
  */

  const getScoreMessage = (score) => {
    if (score >= 90) {
      return "Excellent Performance!";
    }

    if (score >= 80) {
      return "Great Progress!";
    }

    if (score >= 70) {
      return "Good Work!";
    }

    if (score >= 50) {
      return "Keep Practising!";
    }

    return "Let's Practise This Again!";
  };

  return (
    <div className="music-learn-page">
      {/* BACK BUTTON */}

      <button
        className="music-learn-back"
        onClick={() =>
          navigate("/music")
        }
      >
        <ArrowLeft size={20} />

        Back to Music
      </button>

      {/* HEADER */}

      <section className="music-learn-header">
        <div className="music-learn-icon">
          <Music2 size={38} />
        </div>

        <span className="music-learn-label">
          SKILLSENSAI MUSIC
        </span>

        <h1>
          Learn From <span>Scratch</span>
        </h1>

        <p>
          Build your musical foundation step by
          step with guided lessons and
          AI-assisted practice.
        </p>
      </section>

      <main className="music-learn-container">
        {/* LESSONS */}

        <section className="lesson-section">
          <div className="section-heading">
            <div>
              <span>
                YOUR LEARNING PATH
              </span>

              <h2>
                Music Fundamentals
              </h2>
            </div>

            <BookOpen size={28} />
          </div>

          <div className="lesson-list">
            {lessons.map((lesson) => (
              <button
                key={lesson.id}
                className={`lesson-card ${
                  selectedLesson.id ===
                  lesson.id
                    ? "selected-lesson-card"
                    : ""
                }`}
                onClick={() => {
                  setSelectedLesson(
                    lesson
                  );

                  resetPractice();
                }}
              >
                <div className="lesson-number">
                  {lesson.id}
                </div>

                <div className="lesson-card-content">
                  <span>
                    {lesson.level}
                  </span>

                  <h3>
                    {lesson.title}
                  </h3>

                  <p>
                    {lesson.description}
                  </p>
                </div>

                {selectedLesson.id ===
                  lesson.id && (
                  <div className="lesson-active-dot" />
                )}
              </button>
            ))}
          </div>
        </section>

        {/* SELECTED LESSON */}

        <section
          key={`lesson-${selectedLesson.id}`}
          className="selected-lesson-section"
        >
          <div className="selected-lesson-header">
            <div>
              <span>
                LESSON{" "}
                {selectedLesson.id}
              </span>

              <h2>
                {selectedLesson.title}
              </h2>
            </div>

            <div className="lesson-progress-label">
              STEP {selectedLesson.id} /{" "}
              {lessons.length}
            </div>
          </div>

          {/* VIDEO */}

          <div className="lesson-video-container">
            <video
              className="lesson-video"
              controls
              key={selectedLesson.video}
            >
              <source
                src={
                  selectedLesson.video
                }
                type="video/mp4"
              />

              Your browser does not support
              video playback.
            </video>
          </div>

          <div className="lesson-description">
            <h3>
              About this lesson
            </h3>

            <p>
              {selectedLesson.description}
            </p>
          </div>
        </section>

        {/* PRACTICE */}

        <section
          key={`practice-${selectedLesson.id}`}
          className="practice-section"
        >
          <div className="practice-header">
            <div>
              <span>
                PRACTICE
              </span>

              <h2>
                Try It Yourself
              </h2>

              <p>
                Record your voice live or
                upload a recording and let
                SkillSensAI compare your
                performance with the lesson.
              </p>
            </div>

            <Mic2 size={34} />
          </div>

          <div className="practice-card">
            <div className="practice-options">
              {/* RECORD */}

              {!isRecording ? (
                <button
                  className="practice-option learn-record-button"
                  onClick={
                    startRecording
                  }
                >
                  <div className="practice-option-icon">
                    <Mic2 size={30} />
                  </div>

                  <div className="practice-option-content">
                    <h3>
                      Start Recording
                    </h3>

                    <p>
                      Record your voice
                      directly using
                      your microphone.
                    </p>
                  </div>
                </button>
              ) : (
                <button
                  className="practice-option learn-stop-button"
                  onClick={
                    stopRecording
                  }
                >
                  <div className="practice-option-icon">
                    <Square size={26} />
                  </div>

                  <div className="practice-option-content">
                    <h3>
                      Stop Recording
                    </h3>

                    <p>
                      Recording:{" "}
                      {formatTime(
                        recordingTime
                      )}
                    </p>
                  </div>
                </button>
              )}

              {/* UPLOAD */}

              <label className="practice-option learn-upload-label">
                <div className="practice-option-icon">
                  <Upload size={30} />
                </div>

                <div className="practice-option-content">
                  <h3>
                    Choose Audio
                  </h3>

                  <p>
                    Upload an existing
                    voice recording.
                  </p>
                </div>

                <input
                  type="file"
                  accept="audio/*"
                  onChange={
                    handleAudioUpload
                  }
                />
              </label>
            </div>

            {/* RECORDING STATUS */}

            {isRecording && (
              <div className="learn-recording-status">
                <div className="learn-recording-dot" />

                Recording your voice...

                <strong>
                  {formatTime(
                    recordingTime
                  )}
                </strong>
              </div>
            )}

            {/* AUDIO */}

            {currentAudio && (
              <div className="learn-audio-preview">
                <div>
                  <span>
                    YOUR RECORDING
                  </span>

                  <strong>
                    {recordedAudio?.name ||
                      uploadedAudio?.name}
                  </strong>
                </div>

                <audio
                  controls
                  src={currentAudio}
                />
              </div>
            )}

            {/* ANALYZE */}

            {currentAudio &&
              !analysis && (
                <button
                  className="learn-analyze-button"
                  onClick={
                    analyzeRecording
                  }
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2
                        size={20}
                        className="spin"
                      />

                      Analysing...
                    </>
                  ) : (
                    <>
                      <Sparkles
                        size={20}
                      />

                      Analyse My
                      Performance
                    </>
                  )}
                </button>
              )}

            {/* ERROR */}

            {error && (
              <div className="music-learn-error">
                {error}
              </div>
            )}

            {/* RESULT */}

            {analysis && (
              <div className="learn-analysis-result">
                <div className="learn-result-header">
                  <div className="learn-result-icon">
                    <CheckCircle2
                      size={25}
                    />
                  </div>

                  <div>
                    <span>
                      {analysis.isLocalEstimate
                        ? "LOCAL PRACTICE ESTIMATE"
                        : "AI PRACTICE RESULT"}
                    </span>

                    <h3>
                      {analysis.isLocalEstimate
                        ? "Recording Check Complete"
                        : "Analysis Complete"}
                    </h3>
                  </div>
                </div>

                <div className="learn-score-section">
                  <div className="learn-score-circle">
                    <strong>
                      {Math.round(
                        Number(
                          analysis.overall_score ||
                            0
                        )
                      )}
                      %
                    </strong>

                    <span>
                      Score
                    </span>
                  </div>

                  <div className="learn-score-info">
                    <h3>
                      {getScoreMessage(
                        Number(
                          analysis.overall_score ||
                            0
                        )
                      )}
                    </h3>

                    <p>
                      {analysis.isLocalEstimate
                        ? "The backend could not be reached, so this estimate checks voice activity and volume consistency in your recording. It is not a pitch or note-match score."
                        : "Your performance was compared with the pitch extracted from the selected lesson."}
                    </p>
                  </div>
                </div>

                <div className="learn-stats-grid">
                  {analysis.isLocalEstimate ? (
                    <>
                      <div className="learn-stat">
                        <span>Voice Activity</span>
                        <strong>{Number(analysis.voice_activity || 0).toFixed(1)}%</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Volume Consistency</span>
                        <strong>{Number(analysis.volume_consistency || 0).toFixed(1)}%</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Recording Length</span>
                        <strong>{Number(analysis.duration_seconds || 0).toFixed(1)}s</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Analysis Type</span>
                        <strong>Local</strong>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="learn-stat">
                        <span>Pitch Accuracy</span>
                        <strong>{Number(analysis.pitch_accuracy || 0).toFixed(1)}%</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Note Match</span>
                        <strong>{Number(analysis.note_match || 0).toFixed(1)}%</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Stability</span>
                        <strong>{Number(analysis.stability || 0).toFixed(1)}%</strong>
                      </div>
                      <div className="learn-stat">
                        <span>Pitch Error</span>
                        <strong>{Number(analysis.average_pitch_error_cents || 0).toFixed(1)}¢</strong>
                      </div>
                    </>
                  )}
                </div>

                <div className="learn-feedback">
                  <div className="learn-feedback-title">
                    <Sparkles size={19} />

                    AI Feedback
                  </div>

                  <ul className="learn-feedback-list">
                    {Array.isArray(
                      analysis.feedback
                    ) &&
                    analysis.feedback.length >
                      0 ? (
                      analysis.feedback.map(
                        (
                          message,
                          index
                        ) => (
                          <li
                            key={index}
                            className="learn-feedback-item"
                          >
                            {message}
                          </li>
                        )
                      )
                    ) : (
                      <>
                        <li className="learn-feedback-item">
                          Your recording
                          was successfully
                          processed.
                        </li>

                        <li className="learn-feedback-item">
                          Continue
                          practising and
                          compare your
                          results as you
                          improve.
                        </li>
                      </>
                    )}
                  </ul>
                </div>

                <div className="learn-result-actions">
                  <button
                    className="learn-reset-button"
                    onClick={
                      resetPractice
                    }
                  >
                    <RotateCcw size={18} />

                    Practise Again
                  </button>

                  <button
                    className="learn-continue-button"
                    onClick={
                      continueToNextLesson
                    }
                  >
                    {selectedLesson.id === lessons.length
                      ? "Finish Learning"
                      : "Continue"}

                    <ArrowLeft
                      size={18}
                      style={{
                        transform: "rotate(180deg)",
                      }}
                    />
                  </button>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* TIP */}

        <section className="learning-tip">
          <Sparkles size={22} />

          <div>
            <strong>
              AI Learning Tip
            </strong>

            <p>
              Practise slowly and
              consistently. SkillSensAI is
              designed to help you improve at
              your own pace.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default MusicLearn;
