import {
  ArrowLeft,
  Upload,
  Mic2,
  Music2,
  Loader2,
  CheckCircle2,
  BarChart3,
  RotateCcw,
  Play,
  Square,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import axios from "axios";

import "./MusicSong.css";


const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";


// ============================================================
// PITCH GRAPH
// ============================================================

function PitchGraph({
  data,
  title,
  subtitle,
  lineClass = "reference-line",
}) {
  if (!data || data.length === 0) {
    return (
      <div className="pitch-empty">
        No pitch data available.
      </div>
    );
  }

  const width = 1000;
  const height = 300;

  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 35;

  const graphWidth =
    width - paddingLeft - paddingRight;

  const graphHeight =
    height - paddingTop - paddingBottom;

  const minPitch = Math.min(...data);
  const maxPitch = Math.max(...data);

  const pitchRange =
    maxPitch - minPitch || 1;

  const points = data.map((value, index) => {

    const x =
      paddingLeft +
      (index / Math.max(data.length - 1, 1)) *
        graphWidth;

    const y =
      paddingTop +
      graphHeight -
      ((value - minPitch) / pitchRange) *
        graphHeight;

    return `${x},${y}`;
  });

  const polylinePoints =
    points.join(" ");

  const midPitch =
    (minPitch + maxPitch) / 2;

  return (
    <div className="pitch-graph-card">

      <div className="pitch-graph-heading">

        <div>
          <h3>{title}</h3>

          <p>
            {subtitle}
          </p>
        </div>

        <div className="pitch-range">

          <span>
            High: {Math.round(maxPitch)} Hz
          </span>

          <span>
            Low: {Math.round(minPitch)} Hz
          </span>

        </div>

      </div>


      <div className="pitch-graph-wrapper">

        <svg
          className="pitch-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >

          {/* Horizontal grid */}

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={height / 2}
            x2={width - paddingRight}
            y2={height / 2}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            className="pitch-grid-line"
          />


          {/* Vertical axis */}

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            className="pitch-axis-line"
          />


          {/* Pitch line */}

          <polyline
            points={polylinePoints}
            fill="none"
            className={lineClass}
          />


          {/* Labels */}

          <text
            x="12"
            y={paddingTop + 5}
            className="pitch-axis-label"
          >
            High
          </text>

          <text
            x="20"
            y={height / 2 + 4}
            className="pitch-axis-label"
          >
            Mid
          </text>

          <text
            x="12"
            y={height - paddingBottom}
            className="pitch-axis-label"
          >
            Low
          </text>

        </svg>

      </div>


      <div className="pitch-graph-footer">

        <span>
          Start
        </span>

        <span>
          Pitch changes over time
        </span>

        <span>
          End
        </span>

      </div>

    </div>
  );
}


// ============================================================
// COMPARISON GRAPH
// ============================================================

function ComparisonGraph({
  reference,
  user,
}) {
  if (
    !reference ||
    !user ||
    reference.length === 0 ||
    user.length === 0
  ) {
    return null;
  }

  const width = 1000;
  const height = 340;

  const paddingLeft = 65;
  const paddingRight = 20;
  const paddingTop = 30;
  const paddingBottom = 35;

  const graphWidth =
    width - paddingLeft - paddingRight;

  const graphHeight =
    height - paddingTop - paddingBottom;


  const combined = [
    ...reference,
    ...user,
  ];

  const minPitch =
    Math.min(...combined);

  const maxPitch =
    Math.max(...combined);

  const pitchRange =
    maxPitch - minPitch || 1;


  const createPoints = (data) => {

    return data.map((value, index) => {

      const x =
        paddingLeft +
        (index /
          Math.max(data.length - 1, 1)) *
          graphWidth;

      const y =
        paddingTop +
        graphHeight -
        ((value - minPitch) /
          pitchRange) *
          graphHeight;

      return `${x},${y}`;
    }).join(" ");
  };


  const referencePoints =
    createPoints(reference);

  const userPoints =
    createPoints(user);


  return (
    <div className="comparison-graph-card">

      <div className="comparison-heading">

        <div>

          <span className="graph-label">
            AI COMPARISON
          </span>

          <h2>
            Reference vs Your Voice
          </h2>

          <p>
            The blue line represents the
            original song. The red line
            represents your detected pitch.
          </p>

        </div>

      </div>


      <div className="graph-legend">

        <div>
          <span className="legend-line reference-legend"></span>
          Reference Song
        </div>

        <div>
          <span className="legend-line user-legend"></span>
          Your Voice
        </div>

      </div>


      <div className="pitch-graph-wrapper comparison-wrapper">

        <svg
          className="pitch-svg"
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
        >

          {/* Grid */}

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={width - paddingRight}
            y2={paddingTop}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={height / 2}
            x2={width - paddingRight}
            y2={height / 2}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={height - paddingBottom}
            x2={width - paddingRight}
            y2={height - paddingBottom}
            className="pitch-grid-line"
          />


          {/* Axis */}

          <line
            x1={paddingLeft}
            y1={paddingTop}
            x2={paddingLeft}
            y2={height - paddingBottom}
            className="pitch-axis-line"
          />


          {/* Reference */}

          <polyline
            points={referencePoints}
            fill="none"
            className="comparison-reference-line"
          />


          {/* User */}

          <polyline
            points={userPoints}
            fill="none"
            className="comparison-user-line"
          />


          <text
            x="12"
            y={paddingTop + 5}
            className="pitch-axis-label"
          >
            High
          </text>

          <text
            x="20"
            y={height / 2 + 4}
            className="pitch-axis-label"
          >
            Mid
          </text>

          <text
            x="12"
            y={height - paddingBottom}
            className="pitch-axis-label"
          >
            Low
          </text>

        </svg>

      </div>


      <div className="comparison-explanation">

        <strong>
          How to read this graph
        </strong>

        <p>
          When your red line stays close to
          the blue reference line, your pitch
          is closer to the original melody.
          Larger vertical differences indicate
          pitch differences.
        </p>

      </div>

    </div>
  );
}


// ============================================================
// MAIN COMPONENT
// ============================================================

function MusicSong() {

  const navigate = useNavigate();


  // ----------------------------------------------------------
  // SONG
  // ----------------------------------------------------------

  const [selectedSong, setSelectedSong] =
    useState(null);

  const [songAnalysis, setSongAnalysis] =
    useState(null);

  const [songLoading, setSongLoading] =
    useState(false);


  // ----------------------------------------------------------
  // VOICE
  // ----------------------------------------------------------

  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);

  const [voiceFile, setVoiceFile] =
    useState(null);

  const [voicePreview, setVoicePreview] =
    useState(null);

  const [voiceLoading, setVoiceLoading] =
    useState(false);

  const [comparison, setComparison] =
    useState(null);


  // ----------------------------------------------------------
  // ERROR
  // ----------------------------------------------------------

  const [error, setError] =
    useState("");


  // ----------------------------------------------------------
  // REFS
  // ----------------------------------------------------------

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const timerRef =
    useRef(null);


  // ==========================================================
  // SONG UPLOAD
  // ==========================================================

  const handleSongUpload = async (event) => {

    const file =
      event.target.files?.[0];

    if (!file) return;


    setSelectedSong(file);
    setSongAnalysis(null);
    setComparison(null);
    setVoiceFile(null);
    setVoicePreview(null);
    setError("");
    setSongLoading(true);


    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );


    try {

      const response =
        await axios.post(
          `${API_URL}/analyze-song`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
            timeout: 120000,
          }
        );


      if (
        response.data &&
        response.data.success
      ) {

        setSongAnalysis(
          response.data
        );

      } else {

        throw new Error(
          "Song analysis failed."
        );

      }

    } catch (err) {

      console.error(
        "Song upload error:",
        err
      );


      if (err.response) {

        setError(
          err.response.data?.detail ||
          "The backend could not analyse the song."
        );

      } else if (err.request) {

        setError(
          "Cannot connect to the SkillSensAI backend. Please check the Render deployment."
        );

      } else {

        setError(
          err.message ||
          "Something went wrong while analysing the song."
        );

      }

    } finally {

      setSongLoading(false);

    }
  };


  // ==========================================================
  // VOICE FILE SELECT
  // ==========================================================

  const handleVoiceFile = (
    event
  ) => {

    const file =
      event.target.files?.[0];

    if (!file) return;


    setVoiceFile(file);
    setComparison(null);
    setError("");


    const previewUrl =
      URL.createObjectURL(file);

    setVoicePreview(
      previewUrl
    );
  };


  // ==========================================================
  // RECORDING
  // ==========================================================

  const startRecording = async () => {

    setError("");
    setComparison(null);


    try {

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });


      mediaStreamRef.current =
        stream;


      audioChunksRef.current =
        [];


      let mimeType = "";


      if (
        MediaRecorder.isTypeSupported(
          "audio/webm;codecs=opus"
        )
      ) {

        mimeType =
          "audio/webm;codecs=opus";

      } else if (
        MediaRecorder.isTypeSupported(
          "audio/webm"
        )
      ) {

        mimeType =
          "audio/webm";

      } else if (
        MediaRecorder.isTypeSupported(
          "audio/mp4"
        )
      ) {

        mimeType =
          "audio/mp4";

      }


      const recorder =
        mimeType
          ? new MediaRecorder(
              stream,
              { mimeType }
            )
          : new MediaRecorder(
              stream
            );


      mediaRecorderRef.current =
        recorder;


      recorder.ondataavailable = (
        event
      ) => {

        if (
          event.data &&
          event.data.size > 0
        ) {

          audioChunksRef.current.push(
            event.data
          );

        }
      };


      recorder.onstop = () => {

        const actualType =
          recorder.mimeType ||
          mimeType ||
          "audio/webm";


        const blob =
          new Blob(
            audioChunksRef.current,
            {
              type: actualType,
            }
          );


        const extension =
          actualType.includes("mp4")
            ? "m4a"
            : "webm";


        const file =
          new File(
            [blob],
            `voice-recording.${extension}`,
            {
              type: actualType,
            }
          );


        setVoiceFile(file);


        const previewUrl =
          URL.createObjectURL(blob);

        setVoicePreview(
          previewUrl
        );


        if (
          mediaStreamRef.current
        ) {

          mediaStreamRef.current
            .getTracks()
            .forEach(
              (track) =>
                track.stop()
            );

        }

      };


      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);


      timerRef.current =
        setInterval(() => {

          setRecordingTime(
            (previous) =>
              previous + 1
          );

        }, 1000);

    } catch (err) {

      console.error(
        "Recording error:",
        err
      );

      setError(
        "Microphone access was denied or is unavailable. Please allow microphone access and try again."
      );

    }
  };


  // ==========================================================
  // STOP RECORDING
  // ==========================================================

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

      timerRef.current =
        null;

    }

  };


  // ==========================================================
  // FORMAT TIME
  // ==========================================================

  const formatTime = (
    seconds
  ) => {

    const minutes =
      Math.floor(
        seconds / 60
      );

    const remaining =
      seconds % 60;


    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(
      remaining
    ).padStart(2, "0")}`;

  };


  // ==========================================================
  // COMPARE VOICE WITH SONG
  // ==========================================================

  const analyzeVoice = async () => {

    if (!selectedSong) {

      setError(
        "Please upload a song first."
      );

      return;

    }


    if (!voiceFile) {

      setError(
        "Please record your voice or choose an audio file first."
      );

      return;

    }


    setError("");
    setComparison(null);
    setVoiceLoading(true);


    const formData =
      new FormData();


    formData.append(
      "song",
      selectedSong
    );


    formData.append(
      "voice",
      voiceFile
    );


    try {

      const response =
        await axios.post(
          `${API_URL}/compare-song-voice`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },

            timeout: 120000,
          }
        );


      if (
        response.data &&
        response.data.success
      ) {

        setComparison(
          response.data
        );

      } else {

        throw new Error(
          "Voice comparison failed."
        );

      }

    } catch (err) {

      console.error(
        "Voice comparison error:",
        err
      );


      if (err.response) {

        setError(
          err.response.data?.detail ||
          "The backend could not compare your voice with the song."
        );

      } else if (err.request) {

        setError(
          "Cannot connect to the SkillSensAI backend. Please check the Render deployment."
        );

      } else {

        setError(
          err.message ||
          "Something went wrong while analysing your voice."
        );

      }

    } finally {

      setVoiceLoading(false);

    }
  };


  // ==========================================================
  // RESET
  // ==========================================================

  const resetPage = () => {

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {

      mediaRecorderRef.current.stop();

    }


    if (
      mediaStreamRef.current
    ) {

      mediaStreamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

    }


    if (timerRef.current) {

      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;

    }


    if (voicePreview) {

      URL.revokeObjectURL(
        voicePreview
      );

    }


    setSelectedSong(null);
    setSongAnalysis(null);

    setIsRecording(false);
    setRecordingTime(0);

    setVoiceFile(null);
    setVoicePreview(null);

    setVoiceLoading(false);

    setComparison(null);

    setError("");

  };


  // ==========================================================
  // UI
  // ==========================================================

  return (
    <div className="music-song-page">


      {/* =====================================================
          BACK BUTTON
      ===================================================== */}

      <button
        className="music-song-back"
        onClick={() =>
          navigate("/music")
        }
      >

        <ArrowLeft size={20} />

        Back to Music

      </button>


      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="music-song-header">

        <div className="music-song-icon">

          <Music2 size={38} />

        </div>


        <span className="music-song-label">
          AI SONG PRACTICE
        </span>


        <h1>
          Sing With
          <span> AI Feedback</span>
        </h1>


        <p>
          Upload a song, analyse its pitch,
          then record your voice and compare
          your performance with the original.
        </p>

      </section>


      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}

      <main className="music-song-container">


        {/* ===================================================
            STEP 1 — SONG UPLOAD
        =================================================== */}

        <section className="music-step-card">

          <div className="step-number">
            01
          </div>


          <div className="step-content">

            <span className="step-label">
              STEP 1
            </span>

            <h2>
              Upload Your Song
            </h2>

            <p>
              Choose the song you want
              to practise. SkillSensAI will
              extract its pitch pattern.
            </p>


            <label className="upload-song-button">

              <Upload size={21} />

              <span>
                Choose Song
              </span>

              <input
                type="file"
                accept="audio/*,.mp3,.wav,.m4a,.webm"
                onChange={
                  handleSongUpload
                }
                hidden
              />

            </label>


            {selectedSong && (

              <div className="selected-file">

                <div className="selected-file-icon">

                  <Music2 size={20} />

                </div>


                <div className="selected-file-info">

                  <strong>
                    {selectedSong.name}
                  </strong>

                  <span>
                    {(
                      selectedSong.size /
                      (1024 * 1024)
                    ).toFixed(2)}{" "}
                    MB
                  </span>

                </div>


                {songAnalysis && (

                  <CheckCircle2
                    size={23}
                    className="success-icon"
                  />

                )}

              </div>

            )}


            {songLoading && (

              <div className="loading-box">

                <Loader2
                  size={22}
                  className="spin"
                />

                <div>

                  <strong>
                    Analysing your song...
                  </strong>

                  <span>
                    Extracting pitch information
                  </span>

                </div>

              </div>

            )}

          </div>

        </section>


        {/* ===================================================
            ERROR
        =================================================== */}

        {error && (

          <div className="music-song-error">

            <strong>
              Something went wrong
            </strong>

            <p>
              {error}
            </p>

          </div>

        )}


        {/* ===================================================
            SONG ANALYSIS
        =================================================== */}

        {songAnalysis && (

          <section className="analysis-result-card">

            <div className="analysis-success">

              <CheckCircle2 size={23} />

              <div>

                <strong>
                  Song Analysis Complete
                </strong>

                <span>
                  {songAnalysis.duration}s analysed
                  {" • "}
                  {songAnalysis.total_pitch_points}
                  {" "}pitch points detected
                </span>

              </div>

            </div>


            <PitchGraph
              data={
                songAnalysis.pitch_data?.map(
                  (item) =>
                    item.frequency
                ) || []
              }
              title="Reference Song Pitch"
              subtitle="The melody extracted from your uploaded song. Higher points represent higher notes."
              lineClass="reference-line"
            />

          </section>

        )}


        {/* ===================================================
            STEP 2 — VOICE
        =================================================== */}

        {songAnalysis && (

          <section className="music-step-card voice-step">

            <div className="step-number">
              02
            </div>


            <div className="step-content">

              <span className="step-label">
                STEP 2
              </span>

              <h2>
                Sing the Song
              </h2>

              <p>
                Record your voice live or
                upload an existing recording.
              </p>


              <div className="voice-options">


                {/* -------------------------------------------
                    RECORD
                ------------------------------------------- */}

                {!isRecording ? (

                  <button
                    className="record-button"
                    onClick={
                      startRecording
                    }
                  >

                    <Mic2 size={23} />

                    <span>
                      Start Recording
                    </span>

                  </button>

                ) : (

                  <button
                    className="stop-recording-button"
                    onClick={
                      stopRecording
                    }
                  >

                    <Square
                      size={19}
                      fill="currentColor"
                    />

                    <span>
                      Stop Recording
                    </span>

                  </button>

                )}


                {/* -------------------------------------------
                    UPLOAD
                ------------------------------------------- */}

                <label className="voice-upload-button">

                  <Upload size={22} />

                  <span>
                    Choose Audio
                  </span>

                  <input
                    type="file"
                    accept="audio/*,.mp3,.wav,.m4a,.webm"
                    onChange={
                      handleVoiceFile
                    }
                    hidden
                  />

                </label>

              </div>


              {/* -------------------------------------------
                  RECORDING TIMER
              ------------------------------------------- */}

              {isRecording && (

                <div className="recording-status">

                  <span className="recording-dot"></span>

                  Recording

                  <strong>
                    {formatTime(
                      recordingTime
                    )}
                  </strong>

                </div>

              )}


              {/* -------------------------------------------
                  VOICE FILE
              ------------------------------------------- */}

              {voiceFile && (

                <div className="voice-file-box">

                  <div className="voice-file-icon">

                    <Mic2 size={21} />

                  </div>


                  <div className="voice-file-info">

                    <strong>
                      {voiceFile.name}
                    </strong>

                    <span>
                      Your recording is ready
                    </span>

                  </div>


                  <CheckCircle2
                    size={22}
                    className="success-icon"
                  />

                </div>

              )}


              {/* -------------------------------------------
                  AUDIO PREVIEW
              ------------------------------------------- */}

              {voicePreview && (

                <div className="audio-preview-box">

                  <span>
                    Preview Recording
                  </span>

                  <audio
                    src={voicePreview}
                    controls
                  />

                </div>

              )}


              {/* -------------------------------------------
                  ANALYZE BUTTON
              ------------------------------------------- */}

              {voiceFile && !isRecording && (

                <button
                  className="analyze-voice-button"
                  onClick={
                    analyzeVoice
                  }
                  disabled={voiceLoading}
                >

                  {voiceLoading ? (

                    <>
                      <Loader2
                        size={21}
                        className="spin"
                      />

                      Analysing Your Voice...

                    </>

                  ) : (

                    <>
                      <BarChart3
                        size={21}
                      />

                      Compare My Voice

                    </>

                  )}

                </button>

              )}

            </div>

          </section>

        )}


        {/* ===================================================
            COMPARISON RESULTS
        =================================================== */}

        {comparison && (

          <section className="comparison-results">


            {/* -----------------------------------------------
                SCORE
            ----------------------------------------------- */}

            <div className="score-card">

              <div className="score-icon">

                <BarChart3 size={30} />

              </div>


              <div className="score-content">

                <span>
                  YOUR PERFORMANCE
                </span>

                <strong>
                  {Math.round(
                    comparison.overall_score
                  )}
                  <small>
                    /100
                  </small>
                </strong>

                <p>
                  Overall pitch matching score
                </p>

              </div>

            </div>


            {/* -----------------------------------------------
                METRICS
            ----------------------------------------------- */}

            <div className="metrics-grid">

              <div className="metric-card">

                <span>
                  PITCH ACCURACY
                </span>

                <strong>
                  {Math.round(
                    comparison.pitch_accuracy
                  )}%
                </strong>

                <div className="metric-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        comparison.pitch_accuracy,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  NOTE MATCH
                </span>

                <strong>
                  {Math.round(
                    comparison.note_match
                  )}%
                </strong>

                <div className="metric-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        comparison.note_match,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  STABILITY
                </span>

                <strong>
                  {Math.round(
                    comparison.stability
                  )}%
                </strong>

                <div className="metric-bar">

                  <div
                    style={{
                      width: `${Math.min(
                        comparison.stability,
                        100
                      )}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  AVG. PITCH ERROR
                </span>

                <strong>
                  {Math.round(
                    comparison.average_pitch_error_cents
                  )}

                  <small>
                    cents
                  </small>

                </strong>

              </div>

            </div>


            {/* -----------------------------------------------
                USER PITCH GRAPH
            ----------------------------------------------- */}

            <PitchGraph
              data={
                comparison.user_pitch || []
              }
              title="Your Voice Pitch"
              subtitle="Your detected singing pitch across the recording."
              lineClass="user-line"
            />


            {/* -----------------------------------------------
                COMPARISON
            ----------------------------------------------- */}

            <ComparisonGraph
              reference={
                comparison.reference_pitch || []
              }
              user={
                comparison.user_pitch || []
              }
            />


            {/* -----------------------------------------------
                FEEDBACK
            ----------------------------------------------- */}

            <div className="feedback-card">

              <div className="feedback-header">

                <div className="feedback-icon">

                  <Music2 size={22} />

                </div>

                <div>

                  <span>
                    AI MUSIC COACH
                  </span>

                  <h3>
                    Performance Feedback
                  </h3>

                </div>

              </div>


              <div className="feedback-list">

                {comparison.feedback?.map(
                  (item, index) => (

                    <div
                      className="feedback-item"
                      key={index}
                    >

                      <CheckCircle2 size={19} />

                      <p>
                        {item}
                      </p>

                    </div>

                  )
                )}

              </div>

            </div>


            {/* -----------------------------------------------
                PROTOTYPE NOTE
            ----------------------------------------------- */}

            {comparison.prototype_note && (

              <div className="prototype-note">

                <strong>
                  Prototype Note
                </strong>

                <p>
                  {comparison.prototype_note}
                </p>

              </div>

            )}


            {/* -----------------------------------------------
                RESET
            ----------------------------------------------- */}

            <button
              className="reset-button"
              onClick={
                resetPage
              }
            >

              <RotateCcw size={19} />

              Start Another Song

            </button>

          </section>

        )}

      </main>

    </div>
  );
}


export default MusicSong;
