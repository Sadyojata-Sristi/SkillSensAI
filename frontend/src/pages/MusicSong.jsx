import {
  ArrowLeft,
  Music2,
  Upload,
  Mic2,
  Sparkles,
  Loader2,
  CheckCircle2,
  BarChart3,
  Square,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState, useRef } from "react";

import "./MusicSong.css";

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function MusicSong() {
  const navigate = useNavigate();

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [analysis, setAnalysis] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [isRecording, setIsRecording] =
    useState(false);

  const [voiceLoading, setVoiceLoading] =
    useState(false);

  const [voiceAnalysis, setVoiceAnalysis] =
    useState(null);

  const [recordingUrl, setRecordingUrl] =
    useState(null);

  const [accuracy, setAccuracy] =
    useState(null);

  const recorderRef = useRef(null);
  const chunksRef = useRef([]);

  /* ===============================
     SONG SELECT
  =============================== */

  const handleSongSelect = (event) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("audio/")
    ) {
      setError(
        "Please select a valid audio file."
      );

      return;
    }

    setSelectedFile(file);
    setAnalysis(null);
    setVoiceAnalysis(null);
    setAccuracy(null);
    setError("");
  };

  /* ===============================
     SONG ANALYSIS
  =============================== */

  const analyzeSong = async () => {
    if (!selectedFile) {
      setError(
        "Please select a song first."
      );

      return;
    }

    setLoading(true);
    setError("");
    setAnalysis(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        selectedFile
      );

      const response =
        await axios.post(
          `${API_BASE_URL}/analyze-song`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );

      setAnalysis(
        response.data
      );
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data
          ?.detail ||
          "Unable to analyse the song."
      );
    } finally {
      setLoading(false);
    }
  };

  /* ===============================
     CREATE GRAPH
  =============================== */

  const createGraphPoints = (
    values,
    width = 900,
    height = 280
  ) => {
    if (
      !Array.isArray(values) ||
      values.length === 0
    ) {
      return "";
    }

    const numbers =
      values
        .map(Number)
        .filter((value) =>
          Number.isFinite(value)
        );

    if (!numbers.length) {
      return "";
    }

    const min =
      Math.min(...numbers);

    const max =
      Math.max(...numbers);

    const range =
      max - min || 1;

    return numbers
      .map((value, index) => {
        const x =
          (index /
            Math.max(
              numbers.length - 1,
              1
            )) *
          width;

        const y =
          height -
          ((value - min) /
            range) *
            (height - 30) -
          15;

        return `${x},${y}`;
      })
      .join(" ");
  };

  /* ===============================
     VOICE ANALYSIS
  =============================== */

  const analyzeVoice = async (file) => {
    if (!analysis) {
      setError(
        "Please analyse the song before recording your voice."
      );

      return;
    }

    setVoiceLoading(true);
    setError("");
    setVoiceAnalysis(null);

    try {
      const formData = new FormData();

      formData.append(
        "file",
        file
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

      setVoiceAnalysis(
        response.data
      );

      /*
       * If backend provides an
       * accuracy value, display it.
       */

      if (
        response.data?.accuracy !==
        undefined
      ) {
        setAccuracy(
          Number(
            response.data.accuracy
          ).toFixed(1)
        );
      }
    } catch (error) {
      console.error(error);

      setError(
        error?.response?.data
          ?.detail ||
          "Unable to analyse your voice."
      );
    } finally {
      setVoiceLoading(false);
    }
  };

  /* ===============================
     START RECORDING
  =============================== */

  const startRecording = async () => {
    try {
      const stream =
        await navigator.mediaDevices.getUserMedia(
          {
            audio: true,
          }
        );

      const recorder =
        new MediaRecorder(stream);

      recorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (
        event
      ) => {
        if (event.data.size > 0) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const file = new File(
          [blob],
          "song-practice.webm",
          {
            type: "audio/webm",
          }
        );

        const url =
          URL.createObjectURL(blob);

        setRecordingUrl(url);

        stream
          .getTracks()
          .forEach((track) =>
            track.stop()
          );

        await analyzeVoice(file);
      };

      recorder.start();

      setIsRecording(true);
    } catch (error) {
      console.error(error);

      setError(
        "Please allow microphone access."
      );
    }
  };

  const stopRecording = () => {
    if (
      recorderRef.current &&
      recorderRef.current
        .state !== "inactive"
    ) {
      recorderRef.current.stop();
    }

    setIsRecording(false);
  };

  /* ===============================
     UPLOAD VOICE
  =============================== */

  const handleVoiceUpload = async (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) return;

    if (
      !file.type.startsWith("audio/")
    ) {
      setError(
        "Please upload an audio recording."
      );

      return;
    }

    await analyzeVoice(file);
  };

  return (
    <div className="music-song-page">

      {/* BACK */}

      <button
        className="music-back-button"
        onClick={() =>
          navigate("/music")
        }
      >
        <ArrowLeft size={20} />
        Back to Music
      </button>

      {/* HEADER */}

      <section className="music-header">

        <div className="music-header-icon">
          <Upload size={40} />
        </div>

        <span className="music-label">
          AI SONG PRACTICE
        </span>

        <h1>
          Upload a <span>Song</span>
        </h1>

        <p>
          Upload your favourite song,
          analyse its pitch and practise
          your voice.
        </p>

      </section>

      {/* SONG UPLOAD */}

      <section className="pitch-analysis">

        <div className="pitch-header">

          <div>

            <span>
              STEP 1
            </span>

            <h2>
              Upload Your Song
            </h2>

            <p>
              Choose an audio file to
              analyse.
            </p>

          </div>

          <Music2 size={35} />

        </div>

        <div className="song-upload-box">

          <Upload size={35} />

          <h3>
            Select your song
          </h3>

          <p>
            Upload MP3, WAV or another
            supported audio file.
          </p>

          <label className="practice-button">

            <Upload size={17} />

            Choose Song

            <input
              type="file"
              accept="audio/*"
              hidden
              onChange={
                handleSongSelect
              }
            />

          </label>

          {selectedFile && (
            <div className="selected-song">

              <Music2 size={20} />

              <span>
                {selectedFile.name}
              </span>

              <CheckCircle2
                size={20}
              />

            </div>
          )}

        </div>

        <button
          className="practice-button"
          onClick={analyzeSong}
          disabled={
            loading ||
            !selectedFile
          }
          style={{
            marginTop: "20px",
          }}
        >

          {loading ? (
            <>
              <Loader2
                size={18}
                className="loading-icon"
              />

              Analysing...
            </>
          ) : (
            <>
              <Sparkles size={18} />

              Analyse Song
            </>
          )}

        </button>

      </section>

      {/* ERROR */}

      {error && (
        <div className="analysis-error">
          {error}
        </div>
      )}

      {/* SONG RESULT */}

      {analysis && (
        <section className="pitch-analysis">

          <div className="pitch-header">

            <div>

              <span>
                STEP 2
              </span>

              <h2>
                AI Pitch Analysis
              </h2>

              <p>
                The system extracted pitch
                information from your song.
              </p>

            </div>

            <BarChart3 size={35} />

          </div>

          {analysis.pitch_data &&
            Array.isArray(
              analysis.pitch_data
            ) && (

              <div className="pitch-graph-container">

                <svg
                  viewBox="0 0 900 280"
                  className="pitch-graph"
                  preserveAspectRatio="none"
                >

                  <line
                    x1="0"
                    y1="70"
                    x2="900"
                    y2="70"
                    className="graph-grid"
                  />

                  <line
                    x1="0"
                    y1="140"
                    x2="900"
                    y2="140"
                    className="graph-grid"
                  />

                  <line
                    x1="0"
                    y1="210"
                    x2="900"
                    y2="210"
                    className="graph-grid"
                  />

                  <polyline
                    points={createGraphPoints(
                      analysis.pitch_data.map(
                        (item) =>
                          item.frequency
                      )
                    )}
                    className="pitch-line"
                  />

                </svg>

              </div>
            )}

          <div className="song-analysis-details">

            <div>
              <span>
                DURATION
              </span>

              <strong>
                {Number(
                  analysis.duration || 0
                ).toFixed(1)}
                s
              </strong>
            </div>

            <div>
              <span>
                PITCH POINTS
              </span>

              <strong>
                {analysis.total_pitch_points ||
                  analysis.pitch_data
                    ?.length ||
                  0}
              </strong>
            </div>

          </div>

        </section>
      )}

      {/* VOICE PRACTICE */}

      {analysis && (
        <section className="comparison-section">

          <div className="comparison-header">

            <div className="comparison-icon">
              <Mic2 size={25} />
            </div>

            <div>

              <span>
                STEP 3
              </span>

              <h2>
                Practise Your Voice
              </h2>

              <p>
                Record live or upload
                your singing.
              </p>

            </div>

          </div>

          {/* RECORD */}

          <div className="music-practice-option">

            <div className="music-practice-icon">
              <Mic2 size={25} />
            </div>

            <div className="music-practice-info">

              <h3>
                Record Live
              </h3>

              <p>
                Sing along with your
                selected song.
              </p>

            </div>

            {!isRecording ? (
              <button
                className="practice-button"
                onClick={
                  startRecording
                }
              >
                <Mic2 size={17} />

                Start Recording
              </button>
            ) : (
              <button
                className="practice-button"
                onClick={
                  stopRecording
                }
              >
                <Square size={17} />

                Stop & Analyse
              </button>
            )}

          </div>

          {/* UPLOAD */}

          <div className="music-practice-option">

            <div className="music-practice-icon">
              <Upload size={25} />
            </div>

            <div className="music-practice-info">

              <h3>
                Upload Recording
              </h3>

              <p>
                Upload your singing
                recording.
              </p>

            </div>

            <label className="practice-button">

              <Upload size={17} />

              Upload Voice

              <input
                type="file"
                accept="audio/*"
                hidden
                onChange={
                  handleVoiceUpload
                }
              />

            </label>

          </div>

        </section>
      )}

      {/* RECORDING PREVIEW */}

      {recordingUrl && (
        <section className="voice-result">

          <div className="voice-result-icon">
            <CheckCircle2 size={25} />
          </div>

          <div>

            <span>
              RECORDING READY
            </span>

            <h2>
              Your Voice
            </h2>

            <audio
              controls
              src={recordingUrl}
            />

          </div>

        </section>
      )}

      {/* VOICE LOADING */}

      {voiceLoading && (
        <div className="analysis-status">

          <Loader2
            size={20}
            className="loading-icon"
          />

          Analysing your voice...

        </div>
      )}

      {/* VOICE RESULT */}

      {voiceAnalysis && (
        <section className="comparison-section">

          <div className="comparison-header">

            <div className="comparison-icon">
              <Sparkles size={25} />
            </div>

            <div>

              <span>
                STEP 4
              </span>

              <h2>
                AI Performance Feedback
              </h2>

              <p>
                Your recording has been
                analysed.
              </p>

            </div>

          </div>

          {accuracy !== null ? (
            <div className="accuracy-card">

              <span>
                PITCH ACCURACY
              </span>

              <strong>
                {accuracy}%
              </strong>

              <p>
                Estimated similarity
                based on the available
                pitch information.
              </p>

            </div>
          ) : (
            <div className="accuracy-card">

              <span>
                ANALYSIS COMPLETE
              </span>

              <strong>
                ✓
              </strong>

              <p>
                Your voice pitch has
                been detected successfully.
              </p>

            </div>
          )}

          <div className="analysis-note">

            <strong>
              Prototype AI Feedback:
            </strong>{" "}

            The current prototype detects
            pitch from your voice. Direct
            frame-by-frame comparison with
            the uploaded song can be added
            when reference pitch data is
            processed by the backend.

          </div>

        </section>
      )}

      {/* AI INFO */}

      <section className="music-ai-info">

        <div className="ai-info-icon">
          <Sparkles size={25} />
        </div>

        <div>

          <h3>
            AI Song Coach
          </h3>

          <p>
            Upload a song, practise your
            voice and receive AI-assisted
            musical feedback.
          </p>

        </div>

      </section>

    </div>
  );
}

export default MusicSong;
