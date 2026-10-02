import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Upload,
  Video,
  CheckCircle,
  Shield,
  Camera,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  completeLesson,
  isLessonCompleted,
  getCompletedLessons,
} from "../utils/progress";
import "./Karate.css";

const KARATE_LESSONS = [
  {
    id: "karate-lesson-1",
    title: "Karate Stance",
    description:
      "Learn the basic karate stance, balance and body positioning.",
    video: "/lessons/karate/karate-lesson-1.mp4",
  },
  {
    id: "karate-lesson-2",
    title: "Basic Guard",
    description:
      "Learn the correct guard position and how to protect your body.",
    video: "/lessons/karate/karate-lesson-2.mp4",
  },
  {
    id: "karate-lesson-3",
    title: "Basic Punch",
    description:
      "Learn the basic karate punch with correct technique and control.",
    video: "/lessons/karate/karate-lesson-3.mp4",
  },
  {
    id: "karate-lesson-4",
    title: "Front Kick",
    description:
      "Learn the basic front kick and practice balance and control.",
    video: "/lessons/karate/karate-lesson-4.mp4",
  },
  {
    id: "karate-lesson-5",
    title: "Punch + Kick Combination",
    description:
      "Combine your basic punch and front kick into a simple combination.",
    video: "/lessons/karate/karate-lesson-5.mp4",
  },
];

function Karate() {

  const navigate = useNavigate();

  const [completedLessons, setCompletedLessons] =
    useState(getCompletedLessons());

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const [mediaRecorder, setMediaRecorder] =
    useState(null);

  const [recordingStream, setRecordingStream] =
    useState(null);

  const [message, setMessage] =
    useState("");


  useEffect(() => {

    const updateProgress = () => {

      setCompletedLessons(
        getCompletedLessons()
      );

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


  const completedCount =
    KARATE_LESSONS.filter(
      (lesson) =>
        completedLessons.includes(
          lesson.id
        )
    ).length;


  const handleCompleteLesson = (
    lessonId
  ) => {

    const completed =
      completeLesson(lessonId);

    setCompletedLessons(
      getCompletedLessons()
    );

    if (completed) {

      setMessage(
        "Karate lesson completed! Your progress has been updated."
      );

    } else {

      setMessage(
        "You have already completed this lesson."
      );

    }

  };


  const handleVideoUpload = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    setVideoFile(file);

    setMessage(
      `Selected video: ${file.name}`
    );

  };


  const startRecording = async () => {

    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

      const recorder =
        new MediaRecorder(stream);


      recorder.ondataavailable = (
        event
      ) => {

        if (event.data.size > 0) {

          const blob =
            new Blob(
              [event.data],
              {
                type:
                  event.data.type ||
                  "video/webm",
              }
            );

          const file =
            new File(
              [blob],
              "karate-live-recording.webm",
              {
                type:
                  event.data.type ||
                  "video/webm",
              }
            );

          setVideoFile(file);

        }

      };


      recorder.onstop = () => {

        stream
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        setRecordingStream(null);

      };


      recorder.start();

      setMediaRecorder(
        recorder
      );

      setRecordingStream(
        stream
      );

      setIsRecording(true);

      setMessage(
        "Live karate recording started."
      );

    } catch (error) {

      console.error(error);

      setMessage(
        "Unable to access your camera and microphone. Please allow permission."
      );

    }

  };


  const stopRecording = () => {

    if (mediaRecorder) {

      mediaRecorder.stop();

      setMediaRecorder(null);

    }

    if (recordingStream) {

      recordingStream
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      setRecordingStream(null);

    }

    setIsRecording(false);

    setMessage(
      "Recording completed."
    );

  };


  const analyzeVideo = () => {

    if (!videoFile) {

      setMessage(
        "Please record or upload a video first."
      );

      return;

    }

    setMessage(
      "Video selected. AI karate analysis can be connected to the backend."
    );

  };


  return (

    <div className="karate-page">

      {/* HEADER */}

      <header className="karate-header">

        <button
          className="karate-back-button"
          onClick={() =>
            navigate(
              "/martial-arts"
            )
          }
        >
          <ArrowLeft size={20} />
          Back to Martial Arts
        </button>


        <div className="karate-title">

          <Shield size={30} />

          <div>

            <h1>
              Karate Training
            </h1>

            <p>
              Learn. Practice. Improve.
            </p>

          </div>

        </div>

      </header>


      <main className="karate-container">

        {/* HERO */}

        <section className="karate-hero">

          <div className="karate-hero-icon">
            <Shield size={48} />
          </div>

          <h2>
            Learn Karate Step by Step
          </h2>

          <p>
            Learn fundamental karate techniques,
            practice them and track your progress.
          </p>

        </section>


        {/* PROGRESS */}

        <section className="karate-progress">

          <div>

            <span>
              Your Progress
            </span>

            <strong>
              {completedCount} /{" "}
              {KARATE_LESSONS.length}
            </strong>

          </div>


          <div className="karate-progress-bar">

            <div
              style={{
                width: `${
                  KARATE_LESSONS.length
                    ? Math.round(
                        (completedCount /
                          KARATE_LESSONS.length) *
                          100
                      )
                    : 0
                }%`,
              }}
            />

          </div>

        </section>


        {/* LESSONS */}

        <section className="karate-lessons">

          <div className="karate-section-title">

            <BookOpen size={25} />

            <h2>
              Karate Lessons
            </h2>

          </div>


          <div className="karate-lesson-list">

            {KARATE_LESSONS.map(
              (lesson, index) => {

                const completed =
                  isLessonCompleted(
                    lesson.id
                  );

                return (

                  <div
                    className={`karate-lesson-card ${
                      completed
                        ? "completed"
                        : ""
                    }`}
                    key={lesson.id}
                  >

                    <div className="karate-lesson-number">

                      {completed ? (
                        <CheckCircle
                          size={24}
                        />
                      ) : (
                        index + 1
                      )}

                    </div>


                    <div className="karate-lesson-info">

                      <h3>
                        {lesson.title}
                      </h3>

                      <p>
                        {lesson.description}
                      </p>

                      {completed && (
                        <span>
                          ✓ Completed
                        </span>
                      )}

                    </div>


                    <div className="karate-lesson-actions">

                      <button
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
                        disabled={completed}
                        onClick={() =>
                          handleCompleteLesson(
                            lesson.id
                          )
                        }
                      >

                        {completed
                          ? "Completed"
                          : "Complete"}

                      </button>

                    </div>

                  </div>

                );

              }
            )}

          </div>

        </section>


        {/* SELECTED LESSON */}

        {selectedLesson && (

          <section className="karate-video-section">

            <div className="karate-video-header">

              <div>

                <span>
                  Current Lesson
                </span>

                <h2>
                  {selectedLesson.title}
                </h2>

              </div>


              <button
                onClick={() =>
                  setSelectedLesson(null)
                }
              >
                <X size={20} />
              </button>

            </div>


            <video
              className="karate-video"
              controls
              src={
                selectedLesson.video
              }
            >
              Your browser does not support
              video playback.
            </video>


            <p>
              {selectedLesson.description}
            </p>


            <button
              className="karate-complete-button"
              disabled={isLessonCompleted(
                selectedLesson.id
              )}
              onClick={() =>
                handleCompleteLesson(
                  selectedLesson.id
                )
              }
            >

              {isLessonCompleted(
                selectedLesson.id
              ) ? (
                <>
                  <CheckCircle
                    size={19}
                  />
                  Lesson Completed
                </>
              ) : (
                <>
                  <CheckCircle
                    size={19}
                  />
                  Mark Lesson Complete
                </>
              )}

            </button>

          </section>

        )}


        {/* PRACTICE */}

        <section className="karate-practice">

          <div className="karate-section-title">

            <Video size={25} />

            <h2>
              Practice Your Technique
            </h2>

          </div>

          <p>
            Record your karate technique or
            upload a video for AI-powered
            movement analysis.
          </p>


          <div className="karate-practice-actions">

            {!isRecording ? (

              <button
                className="karate-action-button"
                onClick={
                  startRecording
                }
              >
                <Camera size={20} />
                Record Live Video
              </button>

            ) : (

              <button
                className="karate-action-button recording"
                onClick={
                  stopRecording
                }
              >
                <Camera size={20} />
                Stop Recording
              </button>

            )}


            <label className="karate-action-button">

              <Upload size={20} />

              Upload Video

              <input
                type="file"
                accept="video/*"
                hidden
                onChange={
                  handleVideoUpload
                }
              />

            </label>

          </div>


          {videoFile && (

            <div className="karate-selected-video">

              <CheckCircle size={19} />

              <span>
                {videoFile.name}
              </span>

              <button
                onClick={analyzeVideo}
              >
                Analyse Video
              </button>

            </div>

          )}

        </section>


        {message && (

          <div className="karate-message">
            {message}
          </div>

        )}

      </main>

    </div>

  );
}

export default Karate;
