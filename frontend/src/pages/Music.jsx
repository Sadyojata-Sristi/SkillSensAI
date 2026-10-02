import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  Music2,
  Play,
  Upload,
  Mic,
  CheckCircle,
  Lock,
  BookOpen,
  RotateCcw,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  completeLesson,
  isLessonCompleted,
  getCompletedLessons,
} from "../utils/progress";
import "./Music.css";

const MUSIC_LESSONS = [
  {
    id: "music-lesson-1",
    title: "Understanding Pitch",
    description:
      "Learn what pitch is and how your voice moves between high and low notes.",
    video: "/lessons/music/music-lesson-1.mp4",
  },
  {
    id: "music-lesson-2",
    title: "Basic Voice Control",
    description:
      "Learn how to control your voice and maintain a steady pitch.",
    video: "/lessons/music/music-lesson-2.mp4",
  },
  {
    id: "music-lesson-3",
    title: "Breathing for Singing",
    description:
      "Learn basic breathing techniques that help you sing with better control.",
    video: "/lessons/music/music-lesson-3.mp4",
  },
  {
    id: "music-lesson-4",
    title: "Basic Rhythm",
    description:
      "Understand rhythm and practice keeping time while singing.",
    video: "/lessons/music/music-lesson-4.mp4",
  },
  {
    id: "music-lesson-5",
    title: "Putting It Together",
    description:
      "Combine pitch, breathing, voice control and rhythm in one practice.",
    video: "/lessons/music/music-lesson-5.mp4",
  },
];

function Music() {
  const navigate = useNavigate();

  const [selectedLesson, setSelectedLesson] = useState(null);

  const [completedLessons, setCompletedLessons] =
    useState(getCompletedLessons());

  const [showLearnFromScratch, setShowLearnFromScratch] =
    useState(false);

  const [showLearnSong, setShowLearnSong] =
    useState(false);

  const [songFile, setSongFile] = useState(null);

  const [recordingFile, setRecordingFile] =
    useState(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const [mediaRecorder, setMediaRecorder] =
    useState(null);

  const [recordingChunks, setRecordingChunks] =
    useState([]);

  const [message, setMessage] = useState("");

  useEffect(() => {
    const updateProgress = () => {
      setCompletedLessons(getCompletedLessons());
    };

    window.addEventListener(
      "skillsensai-progress-updated",
      updateProgress
    );

    return () => {
      window.removeEventListener(
        "skillsensai-progress-updated",
        updateProgress
      );
    };
  }, []);

  const isCompleted = (lessonId) => {
    return completedLessons.includes(lessonId);
  };

  const handleCompleteLesson = (lessonId) => {
    const completed = completeLesson(lessonId);

    if (completed) {
      setCompletedLessons(getCompletedLessons());
      setMessage("Lesson completed! Your progress has been updated.");
    } else {
      setMessage("You have already completed this lesson.");
    }
  };

  const handleSongUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setSongFile(file);
    setMessage(`Selected song: ${file.name}`);
  };

  const handleRecordingUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setRecordingFile(file);
    setMessage(`Selected recording: ${file.name}`);
  };

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);

      const chunks = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        const blob = new Blob(chunks, {
          type: "audio/webm",
        });

        const file = new File(
          [blob],
          "skillsensai-recording.webm",
          {
            type: "audio/webm",
          }
        );

        setRecordingFile(file);

        stream
          .getTracks()
          .forEach((track) => track.stop());

        setMessage(
          "Recording completed. You can now analyse it."
        );
      };

      recorder.start();

      setRecordingChunks(chunks);
      setMediaRecorder(recorder);
      setIsRecording(true);
      setMessage("Recording started...");
    } catch (error) {
      console.error(error);

      setMessage(
        "Unable to access your microphone. Please allow microphone access."
      );
    }
  };

  const stopRecording = () => {
    if (!mediaRecorder) {
      return;
    }

    mediaRecorder.stop();

    setIsRecording(false);
    setMediaRecorder(null);
  };

  const analyzeSong = async () => {
    if (!songFile) {
      setMessage("Please upload a song first.");
      return;
    }

    setMessage("Song selected. AI analysis can be connected to the backend.");
  };

  const analyzeRecording = async () => {
    if (!recordingFile) {
      setMessage("Please record or upload a recording first.");
      return;
    }

    setMessage(
      "Recording selected. AI voice analysis can be connected to the backend."
    );
  };

  const resetPage = () => {
    setSelectedLesson(null);
    setShowLearnFromScratch(false);
    setShowLearnSong(false);
    setSongFile(null);
    setRecordingFile(null);
    setMessage("");
  };

  return (
    <div className="music-page">

      {/* HEADER */}

      <header className="music-header">

        <button
          className="music-back-button"
          onClick={() => navigate("/")}
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="music-title">
          <Music2 size={30} />
          <div>
            <h1>Music</h1>
            <p>Learn. Practice. Improve.</p>
          </div>
        </div>

      </header>


      {/* MAIN */}

      <main className="music-container">

        {!showLearnFromScratch &&
        !showLearnSong &&
        !selectedLesson ? (

          <>

            {/* INTRO */}

            <section className="music-hero">

              <div className="music-hero-icon">
                <Music2 size={52} />
              </div>

              <h2>
                Start Your Musical Journey
              </h2>

              <p>
                Learn music step by step,
                practice with AI and improve
                your voice at your own pace.
              </p>

            </section>


            {/* OPTIONS */}

            <section className="music-options">

              <button
                className="music-option-card"
                onClick={() =>
                  setShowLearnFromScratch(true)
                }
              >

                <div className="music-option-icon">
                  <BookOpen size={34} />
                </div>

                <div>
                  <h3>
                    Learn From Scratch
                  </h3>

                  <p>
                    Start with the basics of
                    pitch, rhythm, breathing and
                    voice control.
                  </p>
                </div>

              </button>


              <button
                className="music-option-card"
                onClick={() =>
                  setShowLearnSong(true)
                }
              >

                <div className="music-option-icon">
                  <Music2 size={34} />
                </div>

                <div>
                  <h3>
                    Learn a Song
                  </h3>

                  <p>
                    Upload a song and practice
                    your voice against it.
                  </p>
                </div>

              </button>

            </section>


            {/* CURRENT PROGRESS */}

            <section className="music-progress">

              <h3>
                Your Music Progress
              </h3>

              <div className="music-progress-number">

                {
                  MUSIC_LESSONS.filter(
                    (lesson) =>
                      isCompleted(lesson.id)
                  ).length
                }

                {" / "}

                {MUSIC_LESSONS.length}

              </div>

              <p>
                Lessons Completed
              </p>

            </section>

          </>

        ) : null}


        {/* =====================================
            LEARN FROM SCRATCH
        ===================================== */}

        {showLearnFromScratch && (

          <section className="learn-section">

            <button
              className="section-back-button"
              onClick={() => {
                setShowLearnFromScratch(false);
                setSelectedLesson(null);
              }}
            >
              <ArrowLeft size={18} />
              Back to Music
            </button>


            <div className="learn-header">

              <BookOpen size={34} />

              <div>

                <h2>
                  Learn From Scratch
                </h2>

                <p>
                  Complete each lesson to
                  build your musical foundation.
                </p>

              </div>

            </div>


            <div className="lesson-list">

              {MUSIC_LESSONS.map(
                (lesson, index) => {

                  const completed =
                    isCompleted(lesson.id);

                  return (

                    <div
                      className={`lesson-card ${
                        completed
                          ? "lesson-completed"
                          : ""
                      }`}
                      key={lesson.id}
                    >

                      <div className="lesson-number">

                        {completed ? (
                          <CheckCircle size={25} />
                        ) : (
                          index + 1
                        )}

                      </div>


                      <div className="lesson-content">

                        <h3>
                          {lesson.title}
                        </h3>

                        <p>
                          {lesson.description}
                        </p>

                        {completed && (
                          <span className="completed-label">
                            Completed
                          </span>
                        )}

                      </div>


                      <div className="lesson-actions">

                        <button
                          className="lesson-watch-button"
                          onClick={() =>
                            setSelectedLesson(
                              lesson
                            )
                          }
                        >
                          <Play size={17} />

                          {completed
                            ? "Review"
                            : "Learn"}
                        </button>


                        <button
                          className="lesson-complete-button"
                          disabled={completed}
                          onClick={() =>
                            handleCompleteLesson(
                              lesson.id
                            )
                          }
                        >

                          {completed ? (
                            <>
                              <CheckCircle
                                size={17}
                              />
                              Completed
                            </>
                          ) : (
                            "Complete"
                          )}

                        </button>

                      </div>

                    </div>

                  );

                }
              )}

            </div>


            {/* LESSON VIEWER */}

            {selectedLesson && (

              <div className="lesson-viewer">

                <div className="lesson-viewer-header">

                  <div>

                    <span>
                      Current Lesson
                    </span>

                    <h3>
                      {selectedLesson.title}
                    </h3>

                  </div>

                  <button
                    onClick={() =>
                      setSelectedLesson(null)
                    }
                  >
                    Close
                  </button>

                </div>


                <div className="lesson-video-container">

                  <video
                    controls
                    src={selectedLesson.video}
                  >
                    Your browser does not support
                    video playback.
                  </video>

                </div>


                <p className="lesson-description">
                  {selectedLesson.description}
                </p>


                <button
                  className="complete-current-lesson"
                  disabled={isCompleted(
                    selectedLesson.id
                  )}
                  onClick={() =>
                    handleCompleteLesson(
                      selectedLesson.id
                    )
                  }
                >

                  {isCompleted(
                    selectedLesson.id
                  ) ? (
                    <>
                      <CheckCircle size={20} />
                      Lesson Completed
                    </>
                  ) : (
                    <>
                      <CheckCircle size={20} />
                      Mark Lesson Complete
                    </>
                  )}

                </button>

              </div>

            )}


            {/* RECORD / UPLOAD */}

            <div className="practice-section">

              <h3>
                Practice Your Voice
              </h3>

              <p>
                After learning a lesson,
                practice it using your microphone.
              </p>

              <div className="practice-actions">

                {!isRecording ? (

                  <button
                    className="practice-button"
                    onClick={startRecording}
                  >
                    <Mic size={20} />
                    Record Live
                  </button>

                ) : (

                  <button
                    className="practice-button recording"
                    onClick={stopRecording}
                  >
                    <Mic size={20} />
                    Stop Recording
                  </button>

                )}


                <label className="practice-button">

                  <Upload size={20} />

                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={
                      handleRecordingUpload
                    }
                  />

                </label>

              </div>


              {recordingFile && (

                <button
                  className="analyze-button"
                  onClick={
                    analyzeRecording
                  }
                >
                  Analyse Recording
                </button>

              )}

            </div>

          </section>

        )}


        {/* =====================================
            LEARN A SONG
        ===================================== */}

        {showLearnSong && (

          <section className="learn-section">

            <button
              className="section-back-button"
              onClick={() =>
                setShowLearnSong(false)
              }
            >
              <ArrowLeft size={18} />
              Back to Music
            </button>


            <div className="learn-header">

              <Music2 size={34} />

              <div>

                <h2>
                  Learn a Song
                </h2>

                <p>
                  Upload a song and practice
                  your voice with AI feedback.
                </p>

              </div>

            </div>


            <div className="song-upload-card">

              <Upload size={42} />

              <h3>
                Upload Your Song
              </h3>

              <p>
                MP3, WAV and other supported
                audio formats.
              </p>

              <label className="upload-song-button">

                <Upload size={18} />

                Choose Song

                <input
                  type="file"
                  accept="audio/*"
                  hidden
                  onChange={
                    handleSongUpload
                  }
                />

              </label>


              {songFile && (

                <div className="selected-file">

                  <CheckCircle size={19} />

                  <span>
                    {songFile.name}
                  </span>

                </div>

              )}


              {songFile && (

                <button
                  className="analyze-button"
                  onClick={analyzeSong}
                >
                  Analyse Song
                </button>

              )}

            </div>


            <div className="practice-section">

              <h3>
                Record Your Voice
              </h3>

              <p>
                Sing along with the song and
                receive feedback on your performance.
              </p>


              <div className="practice-actions">

                {!isRecording ? (

                  <button
                    className="practice-button"
                    onClick={startRecording}
                  >
                    <Mic size={20} />
                    Record Live
                  </button>

                ) : (

                  <button
                    className="practice-button recording"
                    onClick={stopRecording}
                  >
                    <Mic size={20} />
                    Stop Recording
                  </button>

                )}


                <label className="practice-button">

                  <Upload size={20} />

                  Upload Recording

                  <input
                    type="file"
                    accept="audio/*"
                    hidden
                    onChange={
                      handleRecordingUpload
                    }
                  />

                </label>

              </div>


              {recordingFile && (

                <button
                  className="analyze-button"
                  onClick={
                    analyzeRecording
                  }
                >
                  Analyse Recording
                </button>

              )}

            </div>

          </section>

        )}


        {/* MESSAGE */}

        {message && (

          <div className="music-message">
            {message}
          </div>

        )}


        {/* RESET */}

        <button
          className="music-reset-button"
          onClick={resetPage}
        >
          <RotateCcw size={16} />
          Back to Music Home
        </button>

      </main>

    </div>
  );
}

export default Music;
