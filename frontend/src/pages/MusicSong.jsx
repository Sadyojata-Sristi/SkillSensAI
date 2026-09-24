import {
  ArrowLeft,
  Upload,
  Mic2,
  Music2,
  Loader2,
  CheckCircle2,
  BarChart3,
  RotateCcw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import axios from "axios";

import "./MusicSong.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";


/* =====================================================
   PITCH GRAPH COMPONENT
===================================================== */

function PitchGraph({
  data = [],
  title,
  subtitle,
  lineClass = "reference-line",
}) {

  if (!data || data.length < 2) {
    return (
      <div className="pitch-empty">
        Pitch data is not available.
      </div>
    );
  }


  const width = 900;
  const height = 300;

  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const graphWidth =
    width -
    paddingLeft -
    paddingRight;

  const graphHeight =
    height -
    paddingTop -
    paddingBottom;


  const minPitch =
    Math.min(...data);

  const maxPitch =
    Math.max(...data);


  const pitchRange =
    Math.max(
      maxPitch - minPitch,
      1
    );


  const points = data.map(
    (pitch, index) => {

      const x =
        paddingLeft +
        (
          index /
          Math.max(
            data.length - 1,
            1
          )
        ) *
        graphWidth;


      const normalized =
        (
          pitch -
          minPitch
        ) /
        pitchRange;


      const y =
        paddingTop +
        (
          1 -
          normalized
        ) *
        graphHeight;


      return `${x},${y}`;
    }
  ).join(" ");


  const lowY =
    paddingTop +
    graphHeight;


  const highY =
    paddingTop;


  const middleY =
    paddingTop +
    graphHeight / 2;


  return (
    <div className="pitch-graph-card">

      <div className="pitch-graph-heading">

        <div>

          <h3>
            {title}
          </h3>

          <p>
            {subtitle}
          </p>

        </div>

        <div className="pitch-range">

          <span>
            High
          </span>

          <span>
            {Math.round(maxPitch)} Hz
          </span>

        </div>

      </div>


      <div className="pitch-graph-wrapper">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="pitch-svg"
        >

          {/* GRID */}

          <line
            x1={paddingLeft}
            y1={highY}
            x2={width - paddingRight}
            y2={highY}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={middleY}
            x2={width - paddingRight}
            y2={middleY}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={lowY}
            x2={width - paddingRight}
            y2={lowY}
            className="pitch-grid-line"
          />


          {/* Y AXIS */}

          <text
            x="10"
            y={highY + 5}
            className="pitch-axis-label"
          >
            High
          </text>

          <text
            x="10"
            y={middleY + 5}
            className="pitch-axis-label"
          >
            Mid
          </text>

          <text
            x="10"
            y={lowY}
            className="pitch-axis-label"
          >
            Low
          </text>


          {/* PITCH LINE */}

          <polyline
            points={points}
            className={lineClass}
            fill="none"
          />


          {/* GRAPH BASELINE */}

          <line
            x1={paddingLeft}
            y1={lowY}
            x2={width - paddingRight}
            y2={lowY}
            className="pitch-axis-line"
          />

        </svg>

      </div>


      <div className="pitch-graph-footer">

        <span>
          Low pitch
        </span>

        <span>
          Pitch movement over time
        </span>

        <span>
          High pitch
        </span>

      </div>

    </div>
  );
}


/* =====================================================
   COMPARISON GRAPH
===================================================== */

function ComparisonGraph({
  reference = [],
  user = [],
}) {

  if (
    reference.length < 2 ||
    user.length < 2
  ) {
    return null;
  }


  const width = 900;
  const height = 340;

  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 30;
  const paddingBottom = 45;


  const graphWidth =
    width -
    paddingLeft -
    paddingRight;

  const graphHeight =
    height -
    paddingTop -
    paddingBottom;


  const allValues = [
    ...reference,
    ...user,
  ];


  const minPitch =
    Math.min(...allValues);

  const maxPitch =
    Math.max(...allValues);


  const pitchRange =
    Math.max(
      maxPitch - minPitch,
      1
    );


  const createPoints = (
    values
  ) => {

    return values
      .map(
        (pitch, index) => {

          const x =
            paddingLeft +
            (
              index /
              Math.max(
                values.length - 1,
                1
              )
            ) *
            graphWidth;


          const normalized =
            (
              pitch -
              minPitch
            ) /
            pitchRange;


          const y =
            paddingTop +
            (
              1 -
              normalized
            ) *
            graphHeight;


          return `${x},${y}`;
        }
      )
      .join(" ");
  };


  const referencePoints =
    createPoints(reference);

  const userPoints =
    createPoints(user);


  const highY =
    paddingTop;

  const lowY =
    paddingTop +
    graphHeight;

  const middleY =
    paddingTop +
    graphHeight / 2;


  return (
    <div className="comparison-graph-card">

      <div className="comparison-heading">

        <div>

          <span className="graph-label">
            AI PITCH COMPARISON
          </span>

          <h2>
            Reference vs Your Voice
          </h2>

          <p>
            Follow the reference line and
            compare how closely your voice
            follows the original melody.
          </p>

        </div>

      </div>


      <div className="graph-legend">

        <div>
          <span className="legend-line reference-legend" />
          Reference Song
        </div>

        <div>
          <span className="legend-line user-legend" />
          Your Voice
        </div>

      </div>


      <div className="pitch-graph-wrapper comparison-wrapper">

        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="pitch-svg"
        >

          {/* GRID */}

          <line
            x1={paddingLeft}
            y1={highY}
            x2={width - paddingRight}
            y2={highY}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={middleY}
            x2={width - paddingRight}
            y2={middleY}
            className="pitch-grid-line"
          />

          <line
            x1={paddingLeft}
            y1={lowY}
            x2={width - paddingRight}
            y2={lowY}
            className="pitch-grid-line"
          />


          <text
            x="10"
            y={highY + 5}
            className="pitch-axis-label"
          >
            High
          </text>

          <text
            x="10"
            y={middleY + 5}
            className="pitch-axis-label"
          >
            Mid
          </text>

          <text
            x="10"
            y={lowY}
            className="pitch-axis-label"
          >
            Low
          </text>


          {/* REFERENCE */}

          <polyline
            points={referencePoints}
            className="comparison-reference-line"
            fill="none"
          />


          {/* USER */}

          <polyline
            points={userPoints}
            className="comparison-user-line"
            fill="none"
          />


          {/* AXIS */}

          <line
            x1={paddingLeft}
            y1={lowY}
            x2={width - paddingRight}
            y2={lowY}
            className="pitch-axis-line"
          />

        </svg>

      </div>


      <div className="comparison-explanation">

        <div>

          <strong>
            How to read this graph
          </strong>

          <p>
            When your line follows the
            reference line closely, your
            pitch is closer to the original.
            Larger gaps indicate pitch
            differences.
          </p>

        </div>

      </div>

    </div>
  );
}


/* =====================================================
   MAIN COMPONENT
===================================================== */

function MusicSong() {

  const navigate = useNavigate();


  const songInputRef =
    useRef(null);

  const voiceInputRef =
    useRef(null);

  const mediaRecorderRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const chunksRef =
    useRef([]);


  const timerRef =
    useRef(null);


  const [songFile, setSongFile] =
    useState(null);

  const [songAnalysis, setSongAnalysis] =
    useState(null);


  const [voiceFile, setVoiceFile] =
    useState(null);

  const [voicePreview, setVoicePreview] =
    useState(null);


  const [isRecording, setIsRecording] =
    useState(false);

  const [recordingTime, setRecordingTime] =
    useState(0);


  const [loadingSong, setLoadingSong] =
    useState(false);

  const [loadingVoice, setLoadingVoice] =
    useState(false);

  const [comparing, setComparing] =
    useState(false);


  const [comparison, setComparison] =
    useState(null);


  const [error, setError] =
    useState("");


  /* =====================================================
     SONG
  ===================================================== */

  const handleSongSelect =
    async (event) => {

      const file =
        event.target.files?.[0];

      if (!file) return;


      setSongFile(file);

      setSongAnalysis(null);

      setComparison(null);

      setVoiceFile(null);

      setVoicePreview(null);

      setError("");


      await analyzeSong(file);
    };


  const analyzeSong =
    async (file) => {

      setLoadingSong(true);

      setError("");


      try {

        const formData =
          new FormData();

        formData.append(
          "file",
          file
        );


        const response =
          await axios.post(
            `${API_URL}/analyze-song`,
            formData
          );


        if (
          !response.data.success
        ) {

          throw new Error(
            response.data.error ||
            "Song analysis failed."
          );

        }


        setSongAnalysis(
          response.data
        );


      } catch (err) {

        console.error(
          "SONG ANALYSIS ERROR:",
          err
        );


        if (err.response) {

          setError(
            err.response.data?.error ||
            `Backend error: ${err.response.status}`
          );

        } else if (err.request) {

          setError(
            "Cannot connect to the SkillSensAI backend. Please check the Render deployment."
          );

        } else {

          setError(
            err.message ||
            "Unable to analyze the song."
          );

        }

      } finally {

        setLoadingSong(false);

      }
    };


  /* =====================================================
     VOICE UPLOAD
  ===================================================== */

  const handleVoiceSelect =
    async (event) => {

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


      await compareSongAndVoice(
        songFile,
        file
      );
    };


  /* =====================================================
     RECORD
  ===================================================== */

  const startRecording =
    async () => {

      setError("");

      setComparison(null);


      try {

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


        streamRef.current =
          stream;


        let recorder;


        if (
          MediaRecorder.isTypeSupported(
            "audio/webm;codecs=opus"
          )
        ) {

          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  "audio/webm;codecs=opus",
              }
            );

        } else if (
          MediaRecorder.isTypeSupported(
            "audio/webm"
          )
        ) {

          recorder =
            new MediaRecorder(
              stream,
              {
                mimeType:
                  "audio/webm",
              }
            );

        } else {

          recorder =
            new MediaRecorder(
              stream
            );

        }


        mediaRecorderRef.current =
          recorder;


        chunksRef.current = [];


        recorder.ondataavailable =
          (event) => {

            if (
              event.data.size > 0
            ) {

              chunksRef.current.push(
                event.data
              );

            }
          };


        recorder.onerror =
          () => {

            setError(
              "An error occurred while recording your voice."
            );

          };


        recorder.onstop =
          async () => {

            const mimeType =
              recorder.mimeType ||
              "audio/webm";


            const audioBlob =
              new Blob(
                chunksRef.current,
                {
                  type: mimeType,
                }
              );


            const recordedFile =
              new File(
                [audioBlob],
                "voice-recording.webm",
                {
                  type: mimeType,
                }
              );


            setVoiceFile(
              recordedFile
            );


            const previewUrl =
              URL.createObjectURL(
                audioBlob
              );


            setVoicePreview(
              previewUrl
            );


            await compareSongAndVoice(
              songFile,
              recordedFile
            );

          };


        recorder.start();


        setIsRecording(true);

        setRecordingTime(0);


        timerRef.current =
          setInterval(
            () => {

              setRecordingTime(
                (previous) =>
                  previous + 1
              );

            },
            1000
          );

      } catch (err) {

        console.error(
          "MICROPHONE ERROR:",
          err
        );


        setError(
          "Microphone permission was not granted. Please allow microphone access and try again."
        );

      }
    };


  /* =====================================================
     STOP RECORDING
  ===================================================== */

  const stopRecording =
    () => {

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {

        mediaRecorderRef.current.stop();

      }


      if (
        streamRef.current
      ) {

        streamRef.current
          .getTracks()
          .forEach(
            (track) => {
              track.stop();
            }
          );

      }


      clearInterval(
        timerRef.current
      );


      setIsRecording(false);

    };


  /* =====================================================
     COMPARE
  ===================================================== */

  const compareSongAndVoice =
    async (
      selectedSong,
      selectedVoice
    ) => {

      if (
        !selectedSong ||
        !selectedVoice
      ) {

        setError(
          "Please choose a song before recording your voice."
        );

        return;
      }


      setLoadingVoice(true);

      setComparing(true);

      setError("");


      try {

        const formData =
          new FormData();


        formData.append(
          "song",
          selectedSong
        );


        formData.append(
          "voice",
          selectedVoice
        );


        const response =
          await axios.post(
            `${API_URL}/compare-song-voice`,
            formData
          );


        if (
          !response.data.success
        ) {

          throw new Error(
            response.data.error ||
            "Unable to compare the performances."
          );

        }


        setComparison(
          response.data
        );


      } catch (err) {

        console.error(
          "COMPARISON ERROR:",
          err
        );


        if (err.response) {

          setError(
            err.response.data?.error ||
            `Backend error: ${err.response.status}`
          );

        } else if (err.request) {

          setError(
            "Cannot connect to the SkillSensAI backend. Please check the Render deployment."
          );

        } else {

          setError(
            err.message ||
            "Unable to compare your voice with the song."
          );

        }

      } finally {

        setLoadingVoice(false);

        setComparing(false);

      }
    };


  /* =====================================================
     RESET
  ===================================================== */

  const resetPractice =
    () => {

      if (voicePreview) {

        URL.revokeObjectURL(
          voicePreview
        );

      }


      setSongFile(null);

      setSongAnalysis(null);

      setVoiceFile(null);

      setVoicePreview(null);

      setComparison(null);

      setError("");

      setRecordingTime(0);


      if (
        songInputRef.current
      ) {

        songInputRef.current.value =
          "";

      }


      if (
        voiceInputRef.current
      ) {

        voiceInputRef.current.value =
          "";

      }

    };


  /* =====================================================
     TIME
  ===================================================== */

  const formatTime =
    (seconds) => {

      const minutes =
        Math.floor(
          seconds / 60
        );


      const remaining =
        seconds % 60;


      return `${String(
        minutes
      ).padStart(2, "0")}:${String(
        remaining
      ).padStart(2, "0")}`;

    };


  /* =====================================================
     UI
  ===================================================== */

  return (

    <div className="music-song-page">

      <button
        className="song-back-button"
        onClick={() =>
          navigate("/music")
        }
      >

        <ArrowLeft size={20} />

        Back to Music

      </button>


      <section className="song-header">

        <div className="song-header-icon">

          <Music2 size={38} />

        </div>


        <span className="song-label">
          AI SONG PRACTICE
        </span>


        <h1>
          Upload a <span>Song</span>
        </h1>


        <p>
          Upload a song, visualize its
          melody, then compare your own
          singing with the reference pitch.
        </p>

      </section>


      {/* =================================================
          STEP 1
      ================================================= */}

      <section className="song-section">

        <div className="song-step">

          <span>01</span>

          <div>

            <h2>
              Choose Your Song
            </h2>

            <p>
              Upload the song you want
              to practise.
            </p>

          </div>

        </div>


        <input
          ref={songInputRef}
          type="file"
          accept="audio/*"
          onChange={
            handleSongSelect
          }
          hidden
        />


        <button
          className="choose-song-button"
          onClick={() =>
            songInputRef.current?.click()
          }
          disabled={loadingSong}
        >

          {loadingSong ? (

            <>

              <Loader2
                size={22}
                className="spin"
              />

              Analyzing Song...

            </>

          ) : (

            <>

              <Upload size={22} />

              Choose Song

            </>

          )}

        </button>


        {songFile && (

          <div className="selected-file">

            <CheckCircle2 size={20} />

            <div>

              <strong>
                {songFile.name}
              </strong>


              {songAnalysis && (

                <span>

                  Pitch detected successfully
                  {" • "}
                  {
                    songAnalysis.total_pitch_points
                  }
                  {" "}pitch points

                </span>

              )}

            </div>

          </div>

        )}

      </section>


      {/* =================================================
          REFERENCE GRAPH
      ================================================= */}

      {songAnalysis?.pitch_data?.length > 1 && (

        <section className="graph-section">

          <PitchGraph
            data={
              songAnalysis.pitch_data.map(
                (item) =>
                  item.frequency
              )
            }

            title="Reference Song Pitch"

            subtitle="The melody extracted from your uploaded song. Higher points represent higher notes."

            lineClass="reference-line"
          />

        </section>

      )}


      {/* =================================================
          STEP 2
      ================================================= */}

      {songAnalysis && (

        <section className="song-section">

          <div className="song-step">

            <span>02</span>

            <div>

              <h2>
                Record Your Voice
              </h2>

              <p>
                Sing the same part of the
                song and compare your pitch
                with the reference.
              </p>

            </div>

          </div>


          <div className="voice-choice-grid">

            <button
              className={
                isRecording
                  ? "voice-choice recording"
                  : "voice-choice"
              }

              onClick={
                isRecording
                  ? stopRecording
                  : startRecording
              }

              disabled={
                loadingVoice ||
                comparing
              }
            >

              <div className="voice-choice-icon">

                <Mic2 size={30} />

              </div>


              <div>

                <h3>

                  {isRecording
                    ? "Stop Recording"
                    : "Start Recording"}

                </h3>


                <p>

                  {isRecording
                    ? `Recording ${formatTime(
                        recordingTime
                      )}`
                    : "Record your singing live"}

                </p>

              </div>


              {isRecording && (
                <span className="recording-dot" />
              )}

            </button>


            <input
              ref={voiceInputRef}
              type="file"
              accept="audio/*"
              onChange={
                handleVoiceSelect
              }
              hidden
            />


            <button
              className="voice-choice"

              onClick={() =>
                voiceInputRef.current?.click()
              }

              disabled={
                loadingVoice ||
                comparing
              }
            >

              <div className="voice-choice-icon upload">

                <Upload size={30} />

              </div>


              <div>

                <h3>
                  Choose Audio
                </h3>

                <p>
                  Upload an existing recording
                </p>

              </div>

            </button>

          </div>


          {voicePreview && (

            <div className="voice-preview">

              <div>

                <strong>
                  Your Recording
                </strong>

                <span>
                  {voiceFile?.name}
                </span>

              </div>


              <audio
                controls
                src={voicePreview}
              />

            </div>

          )}

        </section>

      )}


      {/* =================================================
          YOUR VOICE GRAPH
      ================================================= */}

      {comparison?.user_pitch?.length > 1 && (

        <section className="graph-section">

          <PitchGraph

            data={
              comparison.user_pitch
            }

            title="Your Voice Pitch"

            subtitle="Your detected singing pitch across the recording."

            lineClass="user-line"

          />

        </section>

      )}


      {/* =================================================
          COMPARISON LOADING
      ================================================= */}

      {comparing && (

        <section className="analysis-loading">

          <Loader2
            size={35}
            className="spin"
          />

          <h3>
            Comparing Your Performance
          </h3>

          <p>
            SkillSensAI is comparing
            your pitch with the reference
            melody...
          </p>

        </section>

      )}


      {/* =================================================
          COMPARISON GRAPH
      ================================================= */}

      {comparison &&
        comparison.reference_pitch &&
        comparison.user_pitch && (

        <section className="graph-section">

          <ComparisonGraph

            reference={
              comparison.reference_pitch
            }

            user={
              comparison.user_pitch
            }

          />

        </section>

      )}


      {/* =================================================
          RESULTS
      ================================================= */}

      {comparison && (

        <section className="comparison-results">

          <div className="results-heading">

            <div>

              <span>
                AI PERFORMANCE ANALYSIS
              </span>

              <h2>
                Your Singing Analysis
              </h2>

              <p>
                Your recording was compared
                with the pitch extracted from
                the uploaded song.
              </p>

            </div>


            <div className="overall-score">

              <div>
                {
                  comparison.overall_score
                }%
              </div>

              <span>
                Overall
              </span>

            </div>

          </div>


          <div className="score-grid">

            <div className="score-card">

              <div className="score-card-icon">
                <Music2 size={22} />
              </div>

              <span>
                Pitch Accuracy
              </span>

              <strong>
                {
                  comparison.pitch_accuracy
                }%
              </strong>

              <div className="score-bar">

                <div
                  style={{
                    width:
                      `${comparison.pitch_accuracy}%`,
                  }}
                />

              </div>

            </div>


            <div className="score-card">

              <div className="score-card-icon">
                <CheckCircle2 size={22} />
              </div>

              <span>
                Notes Matched
              </span>

              <strong>
                {
                  comparison.note_match
                }%
              </strong>

              <div className="score-bar">

                <div
                  style={{
                    width:
                      `${comparison.note_match}%`,
                  }}
                />

              </div>

            </div>


            <div className="score-card">

              <div className="score-card-icon">
                <BarChart3 size={22} />
              </div>

              <span>
                Pitch Stability
              </span>

              <strong>
                {
                  comparison.stability
                }%
              </strong>

              <div className="score-bar">

                <div
                  style={{
                    width:
                      `${comparison.stability}%`,
                  }}
                />

              </div>

            </div>

          </div>


          <div className="feedback-panel">

            <div className="feedback-title">

              <Music2 size={22} />

              <h3>
                Personalized Feedback
              </h3>

            </div>


            {comparison.feedback?.map(
              (item, index) => (

                <div
                  className="feedback-item"
                  key={index}
                >

                  <CheckCircle2 size={18} />

                  <span>
                    {item}
                  </span>

                </div>

              )
            )}

          </div>


          <div className="comparison-info">

            <strong>
              Pitch Difference
            </strong>

            <span>
              Average deviation:{" "}
              {
                comparison.average_pitch_error_cents
              }{" "}
              cents
            </span>

            <small>
              A smaller pitch difference
              means your detected pitch
              was closer to the reference
              pitch.
            </small>

          </div>


          <div className="prototype-note">

            <strong>
              Prototype AI Analysis
            </strong>

            <p>
              {
                comparison.prototype_note
              }
            </p>

          </div>


          <button
            className="practice-again-button"
            onClick={
              resetPractice
            }
          >

            <RotateCcw size={20} />

            Practice Another Song

          </button>

        </section>

      )}


      {error && (

        <div className="song-error">
          {error}
        </div>

      )}

    </div>
  );
}


export default MusicSong;
