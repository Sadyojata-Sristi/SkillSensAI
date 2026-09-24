import {
  ArrowLeft,
  Music2,
  Upload,
  Mic2,
  Sparkles,
  Loader2,
  CheckCircle2,
  BarChart3,
  Play,
  BookOpen,
  Trophy,
  RotateCcw,
  Square,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useRef, useEffect } from "react";

import "./MusicLearn.css";


const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";


const musicLessons = [
  {
    id: 1,
    title: "Pitch Basics",
    description:
      "Understand high and low pitch and learn how your voice moves between notes.",
    duration: "5 min",
    video: "/lessons/music/pitch-basics.mp4",
    topics: [
      "High & low pitch",
      "Matching notes",
      "Basic vocal control",
    ],
  },
  {
    id: 2,
    title: "Rhythm Basics",
    description:
      "Learn how beats, timing and rhythm work together when singing or performing music.",
    duration: "6 min",
    video: "/lessons/music/rhythm-basics.mp4",
    topics: [
      "Beat",
      "Tempo",
      "Timing",
    ],
  },
  {
    id: 3,
    title: "Voice Control",
    description:
      "Practice breathing, voice stability and controlled movement between notes.",
    duration: "7 min",
    video: "/lessons/music/voice-control.mp4",
    topics: [
      "Breathing",
      "Voice stability",
      "Note control",
    ],
  },
];


function MusicLearn() {

  const navigate = useNavigate();

  // ------------------------------------------
  // LESSON STATE
  // ------------------------------------------

  const [selectedLesson, setSelectedLesson] =
    useState(musicLessons[0]);

  const [completedLessons, setCompletedLessons] =
    useState(() => {

      try {

        const saved =
          localStorage.getItem(
            "skillsensai_music_lessons"
          );

        if (saved) {
          return JSON.parse(saved);
        }

      } catch (error) {

        console.error(
          "Unable to load music progress:",
          error
        );

      }

      return [];
    });


  // ------------------------------------------
  // RECORDING STATE
  // ------------------------------------------

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingUrl, setRecordingUrl] =
    useState(null);

  const [recordingFile, setRecordingFile] =
    useState(null);

  const [recordingTime, setRecordingTime] =
    useState(0);


  // ------------------------------------------
  // UPLOAD STATE
  // ------------------------------------------

  const [uploadedFile, setUploadedFile] =
    useState(null);

  const [uploadedUrl, setUploadedUrl] =
    useState(null);


  // ------------------------------------------
  // ANALYSIS STATE
  // ------------------------------------------

  const [analysis, setAnalysis] =
    useState(null);

  const [analysisLoading, setAnalysisLoading] =
    useState(false);

  const [analysisError, setAnalysisError] =
    useState("");


  // ------------------------------------------
  // REFS
  // ------------------------------------------

  const mediaRecorderRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const timerRef =
    useRef(null);


  // ------------------------------------------
  // SAVE PROGRESS
  // ------------------------------------------

  useEffect(() => {

    localStorage.setItem(
      "skillsensai_music_lessons",
      JSON.stringify(completedLessons)
    );

  }, [completedLessons]);


  // ------------------------------------------
  // FORMAT TIME
  // ------------------------------------------

  const formatTime = (seconds) => {

    const minutes =
      Math.floor(seconds / 60);

    const secs =
      seconds % 60;

    return (
      String(minutes).padStart(2, "0") +
      ":" +
      String(secs).padStart(2, "0")
    );
  };


  // ------------------------------------------
  // ANALYZE RECORDING
  // ------------------------------------------

  const analyzePractice = async (file) => {

    if (!file) {
      return;
    }

    setAnalysis(null);
    setAnalysisError("");
    setAnalysisLoading(true);

    try {

      const formData =
        new FormData();

      formData.append(
        "file",
        file,
        file.name || "voice-recording.webm"
      );


      const response =
        await axios.post(
          `${API_BASE_URL}/analyze-voice`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      // ----------------------------------------
      // BACKEND ERROR
      // ----------------------------------------

      if (!response.data.success) {

        throw new Error(
          response.data.error ||
          "Unable to analyse the recording."
        );
      }


      const pitchData =
        response.data.pitch || [];


      // ----------------------------------------
      // CHECK PITCH
      // ----------------------------------------

      if (pitchData.length < 3) {

        throw new Error(
          "No clear pitch was detected. Please speak or sing for a few seconds."
        );
      }


      // ----------------------------------------
      // CALCULATE PITCH STATISTICS
      // ----------------------------------------

      const mean =
        pitchData.reduce(
          (sum, value) =>
            sum + Number(value),
          0
        ) / pitchData.length;


      const variance =
        pitchData.reduce(
          (sum, value) =>
            sum +
            Math.pow(
              Number(value) - mean,
              2
            ),
          0
        ) / pitchData.length;


      const deviation =
        Math.sqrt(variance);


      const minimum =
        Math.min(...pitchData);


      const maximum =
        Math.max(...pitchData);


      const range =
        maximum - minimum;


      // ----------------------------------------
      // STABILITY SCORE
      // ----------------------------------------

      const stability =
        Math.max(
          0,
          Math.min(
            100,
            100 -
              (
                deviation /
                Math.max(mean, 1)
              ) *
                500
          )
        );


      // ----------------------------------------
      // CONTROL SCORE
      // ----------------------------------------

      const control =
        Math.max(
          0,
          Math.min(
            100,
            100 -
              (
                range /
                Math.max(mean, 1)
              ) *
                100
          )
        );


      // ----------------------------------------
      // OVERALL SCORE
      // ----------------------------------------

      const overall =
        Math.round(
          stability * 0.6 +
          control * 0.4
        );


      // ----------------------------------------
      // FEEDBACK
      // ----------------------------------------

      const feedback = [];


      if (stability >= 80) {

        feedback.push(
          "Your pitch remained fairly stable during the recording."
        );

      } else if (stability >= 60) {

        feedback.push(
          "Your pitch was reasonably stable, but you can work on holding notes more consistently."
        );

      } else {

        feedback.push(
          "Your pitch moved quite a bit. Try practising longer, steady notes."
        );
      }


      if (control >= 80) {

        feedback.push(
          "Good control over your vocal pitch."
        );

      } else if (control >= 60) {

        feedback.push(
          "Your voice shows developing pitch control. Try slower note transitions."
        );

      } else {

        feedback.push(
          "Try starting with comfortable notes and move between pitches slowly."
        );
      }


      if (range > 300) {

        feedback.push(
          "You explored a wide pitch range. Work on smooth transitions between high and low notes."
        );

      } else {

        feedback.push(
          "Try gradually expanding your comfortable vocal range."
        );
      }


      feedback.push(
        "Keep your microphone at a comfortable distance and practise in a quiet environment."
      );


      // ----------------------------------------
      // SAVE ANALYSIS
      // ----------------------------------------

      setAnalysis({
        overall,
        stability: Math.round(
          stability
        ),
        control: Math.round(
          control
        ),
        mean: Math.round(mean),
        minimum: Math.round(minimum),
        maximum: Math.round(maximum),
        duration:
          response.data.duration,
        pitchPoints:
          response.data.pitch_points,
        feedback,
      });


      // ----------------------------------------
      // COMPLETE LESSON
      // ----------------------------------------

      if (
        !completedLessons.includes(
          selectedLesson.id
        )
      ) {

        setCompletedLessons(
          (previous) => [
            ...previous,
            selectedLesson.id,
          ]
        );
      }

    } catch (error) {

      console.error(
        "Voice analysis error:",
        error
      );


      setAnalysisError(
        error.response?.data?.error ||
        error.message ||
        "Unable to analyse your recording."
      );

    } finally {

      setAnalysisLoading(false);

    }
  };


  // ------------------------------------------
  // START RECORDING
  // ------------------------------------------

  const startRecording = async () => {

    try {

      setAnalysis(null);
      setAnalysisError("");
      setRecordingUrl(null);
      setRecordingFile(null);
      setRecordingTime(0);

      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );


      const recorder =
        new MediaRecorder(stream);


      mediaRecorderRef.current =
        recorder;


      audioChunksRef.current =
        [];


      recorder.ondataavailable =
        (event) => {

          if (
            event.data &&
            event.data.size > 0
          ) {

            audioChunksRef.current.push(
              event.data
            );

          }
        };


      recorder.onstop =
        async () => {

          const audioBlob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  recorder.mimeType ||
                  "audio/webm",
              }
            );


          const file =
            new File(
              [audioBlob],
              "music-practice.webm",
              {
                type:
                  audioBlob.type ||
                  "audio/webm",
              }
            );


          const url =
            URL.createObjectURL(
              audioBlob
            );


          setRecordingUrl(url);

          setRecordingFile(file);


          // Stop microphone
          stream
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );


          // Automatically analyze
          await analyzePractice(
            file
          );
        };


      recorder.start();

      setIsRecording(true);


      timerRef.current =
        setInterval(() => {

          setRecordingTime(
            (previous) =>
              previous + 1
          );

        }, 1000);

    } catch (error) {

      console.error(
        "Microphone error:",
        error
      );

      setAnalysisError(
        "Microphone access was denied or unavailable. Please allow microphone access and try again."
      );
    }
  };


  // ------------------------------------------
  // STOP RECORDING
  // ------------------------------------------

  const stopRecording = () => {

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {

      mediaRecorderRef.current.stop();

    }


    setIsRecording(false);


    if (timerRef.current) {

      clearInterval(
        timerRef.current
      );

      timerRef.current = null;
    }
  };


  // ------------------------------------------
  // UPLOAD AUDIO
  // ------------------------------------------

  const handleUpload = (event) => {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }


    setUploadedFile(file);

    setUploadedUrl(
      URL.createObjectURL(file)
    );

    setAnalysis(null);
    setAnalysisError("");


    // Automatically analyze uploaded audio
    analyzePractice(file);
  };


  // ------------------------------------------
  // RESET PRACTICE
  // ------------------------------------------

  const resetPractice = () => {

    setRecordingUrl(null);
    setRecordingFile(null);

    setUploadedFile(null);
    setUploadedUrl(null);

    setAnalysis(null);
    setAnalysisError("");

    setRecordingTime(0);
  };


  // ------------------------------------------
  // LESSON PROGRESS
  // ------------------------------------------

  const progress =
    Math.round(
      (
        completedLessons.length /
        musicLessons.length
      ) * 100
    );


  return (
    <div className="music-learn-page">

      {/* -------------------------------- */}
      {/* BACK */}
      {/* -------------------------------- */}

      <button
        className="music-back-button"
        onClick={() =>
          navigate("/music")
        }
      >
        <ArrowLeft size={20} />
        Back to Music
      </button>


      {/* -------------------------------- */}
      {/* HEADER */}
      {/* -------------------------------- */}

      <section className="music-header">

        <div className="music-header-icon">
          <Music2 size={42} />
        </div>

        <span className="music-label">
          BEGINNER MUSIC PATH
        </span>

        <h1>
          Learn From <span>Scratch</span>
        </h1>

        <p>
          Learn the fundamentals of music
          and practise your voice with
          AI-assisted feedback.
        </p>

      </section>


      {/* -------------------------------- */}
      {/* PROGRESS */}
      {/* -------------------------------- */}

      <section className="music-progress-section">

        <div className="music-progress-header">

          <span>
            Learning Progress
          </span>

          <span>
            {completedLessons.length}
            {" / "}
            {musicLessons.length}
            {" lessons"}
          </span>

        </div>

        <div className="music-progress-track">

          <div
            className="music-progress-fill"
            style={{
              width:
                `${progress}%`,
            }}
          />

        </div>

      </section>


      {/* -------------------------------- */}
      {/* LESSONS */}
      {/* -------------------------------- */}

      <section className="music-lessons-section">

        <div className="section-title-row">

          <BookOpen size={22} />

          <h2>
            Choose a Lesson
          </h2>

        </div>


        <div className="music-lessons-grid">

          {musicLessons.map(
            (lesson) => {

              const completed =
                completedLessons.includes(
                  lesson.id
                );

              const selected =
                selectedLesson.id ===
                lesson.id;


              return (
                <button
                  key={lesson.id}
                  className={
                    `music-lesson-card ${
                      selected
                        ? "music-lesson-selected"
                        : ""
                    }`
                  }
                  onClick={() => {

                    setSelectedLesson(
                      lesson
                    );

                    resetPractice();

                  }}
                >

                  <div className="music-lesson-number">

                    {completed ? (
                      <CheckCircle2
                        size={22}
                      />
                    ) : (
                      lesson.id
                    )}

                  </div>


                  <div className="music-lesson-content">

                    <h3>
                      {lesson.title}
                    </h3>

                    <p>
                      {lesson.description}
                    </p>

                    <span>
                      {lesson.duration}
                    </span>

                  </div>

                </button>
              );
            }
          )}

        </div>

      </section>


      {/* -------------------------------- */}
      {/* LESSON VIDEO */}
      {/* -------------------------------- */}

      <section className="music-learning-section">

        <div className="section-title-row">

          <Play size={22} />

          <h2>
            {selectedLesson.title}
          </h2>

        </div>


        <div className="music-learning-video">

          <video
            controls
            src={selectedLesson.video}
          />

        </div>


        <div className="music-topics">

          <h3>
            What you'll learn
          </h3>

          <div>

            {selectedLesson.topics.map(
              (topic) => (
                <span key={topic}>
                  ✓ {topic}
                </span>
              )
            )}

          </div>

        </div>

      </section>


      {/* -------------------------------- */}
      {/* PRACTICE */}
      {/* -------------------------------- */}

      <section className="music-practice-section">

        <div className="section-title-row">

          <Mic2 size={22} />

          <h2>
            Practice
          </h2>

        </div>


        <p className="practice-description">
          Record your voice live or upload
          a recording. SkillSensAI will
          analyse your pitch and provide
          practice feedback.
        </p>


        <div className="music-practice-options">


          {/* LIVE RECORDING */}

          <div className="music-practice-option">

            <div className="music-practice-icon">
              <Mic2 size={30} />
            </div>

            <div className="music-practice-info">

              <h3>
                Record Live
              </h3>

              <p>
                Use your microphone to
                record your voice.
              </p>

            </div>


            {!isRecording ? (

              <button
                className="music-record-button"
                onClick={
                  startRecording
                }
              >
                <Mic2 size={18} />
                Start Recording
              </button>

            ) : (

              <button
                className="music-stop-button"
                onClick={
                  stopRecording
                }
              >
                <Square size={16} />
                Stop Recording
              </button>

            )}

          </div>


          {/* UPLOAD */}

          <div className="music-practice-option">

            <div className="music-practice-icon">
              <Upload size={30} />
            </div>

            <div className="music-practice-info">

              <h3>
                Upload Recording
              </h3>

              <p>
                Upload an audio recording
                from your device.
              </p>

            </div>

            <label className="music-upload-button">

              <Upload size={18} />

              Choose Audio

              <input
                type="file"
                accept="audio/*,.webm,.wav,.mp3,.m4a"
                onChange={
                  handleUpload
                }
                hidden
              />

            </label>

          </div>

        </div>


        {/* -------------------------------- */}
        {/* RECORDING STATUS */}
        {/* -------------------------------- */}

        {isRecording && (

          <div className="music-recording-status">

            <span className="recording-dot" />

            Recording...

            <strong>
              {formatTime(
                recordingTime
              )}
            </strong>

          </div>

        )}


        {/* -------------------------------- */}
        {/* AUDIO PREVIEW */}
        {/* -------------------------------- */}

        {recordingUrl && (

          <div className="music-audio-preview">

            <h3>
              Your Recording
            </h3>

            <audio
              controls
              src={recordingUrl}
            />

          </div>

        )}


        {uploadedUrl && (

          <div className="music-audio-preview">

            <h3>
              Uploaded Recording
            </h3>

            <audio
              controls
              src={uploadedUrl}
            />

          </div>

        )}


        {/* -------------------------------- */}
        {/* ANALYSIS LOADING */}
        {/* -------------------------------- */}

        {analysisLoading && (

          <div className="music-analysis-loading">

            <Loader2
              size={28}
              className="spin"
            />

            <div>

              <strong>
                Analysing your voice...
              </strong>

              <p>
                Detecting pitch and
                analysing your vocal control.
              </p>

            </div>

          </div>

        )}


        {/* -------------------------------- */}
        {/* ERROR */}
        {/* -------------------------------- */}

        {analysisError && !analysisLoading && (

          <div className="music-analysis-error">

            <strong>
              Analysis could not be completed
            </strong>

            <p>
              {analysisError}
            </p>

            <button
              onClick={() => {
                if (recordingFile) {
                  analyzePractice(
                    recordingFile
                  );
                } else if (uploadedFile) {
                  analyzePractice(
                    uploadedFile
                  );
                }
              }}
            >
              Try Again
            </button>

          </div>

        )}


        {/* -------------------------------- */}
        {/* AI FEEDBACK */}
        {/* -------------------------------- */}

        {analysis && !analysisLoading && (

          <div className="music-feedback-section">

            <div className="music-feedback-header">

              <div>

                <span className="feedback-label">
                  AI PRACTICE FEEDBACK
                </span>

                <h2>
                  Your Voice Analysis
                </h2>

              </div>

              <Sparkles
                size={30}
              />

            </div>


            {/* SCORE CARDS */}

            <div className="music-feedback-grid">

              <div className="music-feedback-card">

                <BarChart3 size={25} />

                <span>
                  Overall Score
                </span>

                <strong>
                  {analysis.overall}%
                </strong>

              </div>


              <div className="music-feedback-card">

                <Music2 size={25} />

                <span>
                  Pitch Stability
                </span>

                <strong>
                  {analysis.stability}%
                </strong>

              </div>


              <div className="music-feedback-card">

                <Mic2 size={25} />

                <span>
                  Voice Control
                </span>

                <strong>
                  {analysis.control}%
                </strong>

              </div>

            </div>


            {/* FEEDBACK */}

            <div className="music-feedback-list">

              <div className="feedback-list-heading">

                <Trophy size={22} />

                <h3>
                  Personalized Feedback
                </h3>

              </div>


              {analysis.feedback.map(
                (item, index) => (

                  <div
                    className="music-feedback-item"
                    key={index}
                  >

                    <CheckCircle2
                      size={20}
                    />

                    <p>
                      {item}
                    </p>

                  </div>

                )
              )}

            </div>


            {/* TECHNICAL DATA */}

            <div className="music-analysis-details">

              <div>
                <span>
                  Duration
                </span>

                <strong>
                  {Number(
                    analysis.duration || 0
                  ).toFixed(1)}
                  {" sec"}
                </strong>
              </div>


              <div>
                <span>
                  Pitch Points
                </span>

                <strong>
                  {analysis.pitchPoints}
                </strong>
              </div>


              <div>
                <span>
                  Average Pitch
                </span>

                <strong>
                  {analysis.mean}
                  {" Hz"}
                </strong>
              </div>


              <div>
                <span>
                  Pitch Range
                </span>

                <strong>
                  {analysis.minimum}
                  {" – "}
                  {analysis.maximum}
                  {" Hz"}
                </strong>
              </div>

            </div>


            <div className="music-prototype-note">

              <Sparkles size={18} />

              <p>
                This is an AI-assisted prototype
                analysis based on pitch stability,
                pitch variation and vocal control.
                More advanced singing assessment
                can be added in future versions.
              </p>

            </div>


            {/* RESET */}

            <button
              className="music-reset-button"
              onClick={
                resetPractice
              }
            >
              <RotateCcw size={17} />
              Practice Again
            </button>

          </div>

        )}

      </section>

    </div>
  );
}


export default MusicLearn;
