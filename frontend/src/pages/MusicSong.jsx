import {
  ArrowLeft,
  Upload,
  Mic2,
  Music2,
  Loader2,
  CheckCircle2,
  BarChart3,
  Play,
  RotateCcw,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { useRef, useState } from "react";
import axios from "axios";

import "./MusicSong.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:8000";

function MusicSong() {
  const navigate = useNavigate();

  const songInputRef = useRef(null);
  const voiceInputRef = useRef(null);

  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);

  const [songFile, setSongFile] = useState(null);
  const [songAnalysis, setSongAnalysis] = useState(null);

  const [voiceFile, setVoiceFile] = useState(null);
  const [voicePreview, setVoicePreview] = useState(null);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);

  const [loadingSong, setLoadingSong] = useState(false);
  const [loadingVoice, setLoadingVoice] = useState(false);
  const [comparing, setComparing] = useState(false);

  const [comparison, setComparison] = useState(null);

  const [error, setError] = useState("");

  const timerRef = useRef(null);

  // --------------------------------------------------
  // SONG UPLOAD
  // --------------------------------------------------

  const handleSongSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setSongFile(file);
    setSongAnalysis(null);
    setComparison(null);
    setError("");

    await analyzeSong(file);
  };

  const analyzeSong = async (file) => {
    setLoadingSong(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/analyze-song`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error ||
            "Song analysis failed."
        );
      }

      setSongAnalysis(response.data);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to analyze the song."
      );
    } finally {
      setLoadingSong(false);
    }
  };

  // --------------------------------------------------
  // VOICE FILE
  // --------------------------------------------------

  const handleVoiceSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setVoiceFile(file);
    setComparison(null);
    setError("");

    const previewUrl = URL.createObjectURL(file);
    setVoicePreview(previewUrl);

    await analyzeVoice(file);
  };

  const analyzeVoice = async (file) => {
    setLoadingVoice(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append("file", file);

      const response = await axios.post(
        `${API_URL}/analyze-voice`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error ||
            "Voice analysis failed."
        );
      }

      // We don't show a fake score here.
      // Actual score comes from comparing
      // the song and voice together.

      await compareSongAndVoice(
        songFile,
        file
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to analyze your recording."
      );
    } finally {
      setLoadingVoice(false);
    }
  };

  // --------------------------------------------------
  // RECORDING
  // --------------------------------------------------

  const startRecording = async () => {
    setError("");
    setComparison(null);

    try {
      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: true,
        });

      streamRef.current = stream;

      const recorder = new MediaRecorder(
        stream,
        {
          mimeType: "audio/webm",
        }
      );

      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(
            event.data
          );
        }
      };

      recorder.onstop = async () => {
        const audioBlob = new Blob(
          chunksRef.current,
          {
            type: "audio/webm",
          }
        );

        const recordedFile = new File(
          [audioBlob],
          "voice-recording.webm",
          {
            type: "audio/webm",
          }
        );

        setVoiceFile(recordedFile);

        const previewUrl =
          URL.createObjectURL(audioBlob);

        setVoicePreview(previewUrl);

        await analyzeVoice(
          recordedFile
        );
      };

      recorder.start();

      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime(
          (previous) => previous + 1
        );
      }, 1000);

    } catch (err) {
      setError(
        "Microphone permission was not granted. Please allow microphone access and try again."
      );
    }
  };

  const stopRecording = () => {
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {
      mediaRecorderRef.current.stop();
    }

    if (streamRef.current) {
      streamRef.current
        .getTracks()
        .forEach((track) =>
          track.stop()
        );
    }

    clearInterval(timerRef.current);

    setIsRecording(false);
  };

  // --------------------------------------------------
  // COMPARISON
  // --------------------------------------------------

  const compareSongAndVoice = async (
    selectedSong,
    selectedVoice
  ) => {
    if (!selectedSong || !selectedVoice) {
      return;
    }

    setComparing(true);
    setError("");

    try {
      const formData = new FormData();

      formData.append(
        "song",
        selectedSong
      );

      formData.append(
        "voice",
        selectedVoice
      );

      const response = await axios.post(
        `${API_URL}/compare-song-voice`,
        formData,
        {
          headers: {
            "Content-Type":
              "multipart/form-data",
          },
        }
      );

      if (!response.data.success) {
        throw new Error(
          response.data.error ||
            "Unable to compare the performances."
        );
      }

      setComparison(
        response.data
      );
    } catch (err) {
      setError(
        err.response?.data?.error ||
          err.message ||
          "Unable to compare your voice with the song."
      );
    } finally {
      setComparing(false);
    }
  };

  // --------------------------------------------------
  // RESET
  // --------------------------------------------------

  const resetPractice = () => {
    setSongFile(null);
    setSongAnalysis(null);
    setVoiceFile(null);
    setVoicePreview(null);
    setComparison(null);
    setError("");
    setRecordingTime(0);

    if (songInputRef.current) {
      songInputRef.current.value = "";
    }

    if (voiceInputRef.current) {
      voiceInputRef.current.value = "";
    }
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(
      seconds / 60
    );

    const remaining =
      seconds % 60;

    return `${String(minutes).padStart(
      2,
      "0"
    )}:${String(remaining).padStart(
      2,
      "0"
    )}`;
  };

  return (
    <div className="music-song-page">

      {/* BACK */}

      <button
        className="song-back-button"
        onClick={() => navigate("/music")}
      >
        <ArrowLeft size={20} />
        Back to Music
      </button>

      {/* HEADER */}

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
          Upload a song, practise singing it,
          and compare your pitch with the
          reference audio.
        </p>

      </section>

      {/* STEP 1 */}

      <section className="song-section">

        <div className="song-step">
          <span>01</span>

          <div>
            <h2>
              Choose Your Song
            </h2>

            <p>
              Upload the song you want to
              practise.
            </p>
          </div>
        </div>

        <input
          ref={songInputRef}
          type="file"
          accept="audio/*"
          onChange={handleSongSelect}
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
                  •{" "}
                  {songAnalysis.total_pitch_points}
                  pitch points
                </span>
              )}
            </div>
          </div>
        )}

      </section>

      {/* STEP 2 */}

      {songAnalysis && (
        <section className="song-section">

          <div className="song-step">
            <span>02</span>

            <div>
              <h2>
                Record Your Voice
              </h2>

              <p>
                Sing the same part of the song
                and let SkillSensAI compare
                your pitch.
              </p>
            </div>
          </div>

          <div className="voice-choice-grid">

            {/* RECORD */}

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

            {/* UPLOAD */}

            <input
              ref={voiceInputRef}
              type="file"
              accept="audio/*"
              onChange={handleVoiceSelect}
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

      {/* ANALYSIS */}

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
            SkillSensAI is comparing your
            pitch with the reference song...
          </p>

        </section>
      )}

      {/* RESULTS */}

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
                {comparison.overall_score}%
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
                {comparison.pitch_accuracy}%
              </strong>

              <div className="score-bar">
                <div
                  style={{
                    width: `${comparison.pitch_accuracy}%`,
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
                {comparison.note_match}%
              </strong>

              <div className="score-bar">
                <div
                  style={{
                    width: `${comparison.note_match}%`,
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
                {comparison.stability}%
              </strong>

              <div className="score-bar">
                <div
                  style={{
                    width: `${comparison.stability}%`,
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
                  <span>{item}</span>
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
              A smaller pitch difference means
              your detected pitch was closer to
              the reference pitch.
            </small>

          </div>

          <div className="prototype-note">
            <strong>
              Prototype AI Analysis
            </strong>

            <p>
              {comparison.prototype_note}
            </p>
          </div>

          <button
            className="practice-again-button"
            onClick={resetPractice}
          >
            <RotateCcw size={20} />
            Practice Another Song
          </button>

        </section>
      )}

      {/* ERROR */}

      {error && (
        <div className="song-error">
          {error}
        </div>
      )}

    </div>
  );
}

export default MusicSong;
