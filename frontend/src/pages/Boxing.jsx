import React, { useEffect, useState } from "react";
import {
  ArrowLeft,
  BookOpen,
  Play,
  Upload,
  Video,
  CheckCircle,
  Dumbbell,
  Camera,
  X,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  completeLesson,
  isLessonCompleted,
  getCompletedLessons,
} from "../utils/progress";
import "./Boxing.css";

const BOXING_LESSONS = [
  {
    id: "boxing-lesson-1",
    title: "Boxing Stance",
    description:
      "Learn the correct basic boxing stance, balance and guard position.",
    video: "/lessons/boxing/boxing-lesson-1.mp4",
  },
  {
    id: "boxing-lesson-2",
    title: "Basic Jab",
    description:
      "Learn how to perform a basic jab with correct hand position and movement.",
    video: "/lessons/boxing/boxing-lesson-2.mp4",
  },
  {
    id: "boxing-lesson-3",
    title: "Cross Punch",
    description:
      "Learn the basic cross punch and how to rotate your body correctly.",
    video: "/lessons/boxing/boxing-lesson-3.mp4",
  },
  {
    id: "boxing-lesson-4",
    title: "Basic Footwork",
    description:
      "Practice moving forward, backward and sideways while maintaining your stance.",
    video: "/lessons/boxing/boxing-lesson-4.mp4",
  },
  {
    id: "boxing-lesson-5",
    title: "Jab + Cross Combination",
    description:
      "Combine the jab and cross into your first basic boxing combination.",
    video: "/lessons/boxing/boxing-lesson-5.mp4",
  },
];

function Boxing() {

  const navigate = useNavigate();

  const [completedLessons, setCompletedLessons] =
    useState(getCompletedLessons());

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [videoFile, setVideoFile] =
    useState(null);

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingStream, setRecordingStream] =
    useState(null);

  const [mediaRecorder, setMediaRecorder] =
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
    BOXING_LESSONS.filter(
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
        "Boxing lesson completed! Your progress has been updated."
      );

    } else {

      setMessage(
        "You have already completed this lesson."
      );

    }

  };


  const handleVideoUpload = (event) => {

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
              "boxing-live-recording.webm",
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

      setMediaRecorder(recorder);

      setRecordingStream(stream);

      setIsRecording(true);

      setMessage(
        "Live boxing recording started."
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
      "Video selected. AI boxing analysis can be connected to the backend."
    );

  };


  return (

    <div className="boxing-page">

      {/* HEADER */}

      <header className="boxing-header">

        <button
          className="boxing-back-button"
          onClick={() =>
            navigate(
              "/martial-arts"
            )
          }
        >
          <ArrowLeft size={20} />
          Back to Martial Arts
        </button>


        <div className="boxing-title">

          <Dumbbell size={30} />

          <div>

            <h1>
              Boxing Training
            </h1>

            <p>
              Learn. Practice. Improve.
            </p>

          </div>

        </div>

      </header>


      <main className="boxing-container">

        {/* HERO */}

        <section className="boxing-hero">

          <div className="boxing-hero-icon">
            <Dumbbell size={48} />
          </div>

          <h2>
            Learn Boxing Step by Step
          </h2>

          <p>
            Learn fundamental boxing techniques,
            practice them and track your progress.
          </p>

        </section>


        {/* PROGRESS */}

        <section className="boxing-progress">

          <div>

            <span>
              Your Progress
            </span>

            <strong>
              {completedCount} /{" "}
              {BOXING_LESSONS.length}
            </strong>

          </div>

          <div className="boxing-progress-bar">

            <div
              style={{
                width: `${
                  BOXING_LESSONS.length
                    ? Math.round(
                        (completedCount /
                          BOXING_LESSONS.length) *
                          100
                      )
                    : 0
                }%`,
              }}
            />

          </div>

        </section>


        {/* LESSONS */}

        <section className="boxing-lessons">

          <div className="boxing-section-title">

            <BookOpen size={25} />

            <h2>
              Boxing Lessons
            </h2>

          </div>


          <div className="boxing-lesson-list">

            {BOXING_LESSONS.map(
              (lesson, index) => {

                const completed =
                  isLessonCompleted(
                    lesson.id
                  );

                return (

                  <div
                    className={`boxing-lesson-card ${
                      completed
                        ? "completed"
                        : ""
                    }`}
                    key={lesson.id}
                  >

                    <div className="boxing-lesson-number">

                      {completed ? (
                        <CheckCircle
                          size={24}
                        />
                      ) : (
                        index + 1
                      )}

                    </div>


                    <div className="boxing-lesson-info">

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


                    <div className="boxing-lesson-actions">

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

          <section className="boxing-video-section">

            <div className="boxing-video-header">

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
              className="boxing-video"
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
              className="boxing-complete-button"
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

        <section className="boxing-practice">

          <div className="boxing-section-title">

            <Video size={25} />

            <h2>
              Practice Your Technique
            </h2>

          </div>

          <p>
            Record your boxing technique or
            upload a video for AI-powered
            movement analysis.
          </p>


          <div className="boxing-practice-actions">

            {!isRecording ? (

              <button
                className="boxing-action-button"
                onClick={
                  startRecording
                }
              >
                <Camera size={20} />
                Record Live Video
              </button>

            ) : (

              <button
                className="boxing-action-button recording"
                onClick={
                  stopRecording
                }
              >
                <Camera size={20} />
                Stop Recording
              </button>

            )}


            <label className="boxing-action-button">

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

            <div className="boxing-selected-video">

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

          <div className="boxing-message">
            {message}
          </div>

        )}

      </main>

    </div>

  );
}

export default Boxing;
