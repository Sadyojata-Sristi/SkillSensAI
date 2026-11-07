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
  Search,
  Activity,
  Volume2,
  AlertCircle,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import {
  useEffect,
  useRef,
  useState,
} from "react";
import axios from "axios";

import "./MusicSong.css";
import "./MusicSong-ux.css";


/* =========================================================
   API
========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";


/* =========================================================
   LIVE PITCH SETTINGS
========================================================= */

const MAX_AUDIO_FILE_BYTES = 100 * 1024 * 1024;
const MAX_AUDIO_DURATION_SECONDS = 5 * 60;
const SUPPORTED_AUDIO_EXTENSIONS = new Set([
  "mp3", "wav", "m4a", "aac", "ogg", "webm"
]);

async function validateAudioFile(file) {
  if (file.size > MAX_AUDIO_FILE_BYTES) {
    return "This file is larger than 100 MB. Please choose a smaller audio file.";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  if (!extension || !SUPPORTED_AUDIO_EXTENSIONS.has(extension)) {
    return "Unsupported file format. Please use MP3, WAV, M4A, AAC, OGG, or WebM.";
  }

  const temporaryUrl = URL.createObjectURL(file);
  try {
    const duration = await new Promise((resolve, reject) => {
      const audio = new Audio();
      audio.preload = "metadata";
      audio.onloadedmetadata = () => resolve(audio.duration);
      audio.onerror = () => reject(new Error("Audio metadata could not be read."));
      audio.src = temporaryUrl;
    });

    if (!Number.isFinite(duration) || duration <= 0) {
      return "This file has no readable audio duration. Please choose another file.";
    }
    if (duration > MAX_AUDIO_DURATION_SECONDS) {
      return "Audio must be 5 minutes or shorter. Please choose a shorter song or recording.";
    }
  } catch {
    // The backend performs a second validation, including formats the browser cannot preview.
  } finally {
    URL.revokeObjectURL(temporaryUrl);
  }

  return null;
}


const LIVE_MIN_FREQUENCY = 65;
const LIVE_MAX_FREQUENCY = 1000;

const LIVE_SAMPLE_RATE = 44100;

const LIVE_BUFFER_SIZE = 2048;


/* =========================================================
   NOTE HELPERS
========================================================= */

function frequencyToNote(frequency) {
  if (!frequency || !Number.isFinite(frequency)) {
    return "—";
  }

  const noteNames = [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ];

  const midi =
    Math.round(
      12 *
        Math.log2(
          frequency / 440
        ) +
        69
    );

  const noteName =
    noteNames[
      ((midi % 12) + 12) % 12
    ];

  const octave =
    Math.floor(midi / 12) - 1;

  return `${noteName}${octave}`;
}


function frequencyToCents(
  reference,
  user
) {
  if (
    !reference ||
    !user ||
    reference <= 0 ||
    user <= 0
  ) {
    return null;
  }

  return (
    1200 *
    Math.log2(
      user / reference
    )
  );
}


/* =========================================================
   LIVE PITCH DETECTOR
   Autocorrelation-based browser pitch detection.
========================================================= */

function detectLivePitch(
  buffer,
  sampleRate
) {
  if (
    !buffer ||
    buffer.length < 2
  ) {
    return null;
  }


  /* -------------------------------------------------------
     Calculate RMS.
     Ignore silence/noise.
  ------------------------------------------------------- */

  let rms = 0;

  for (let i = 0; i < buffer.length; i++) {
    rms +=
      buffer[i] *
      buffer[i];
  }

  rms = Math.sqrt(
    rms / buffer.length
  );


  if (rms < 0.012) {
    return null;
  }


  /* -------------------------------------------------------
     Remove DC offset.
  ------------------------------------------------------- */

  let mean = 0;

  for (let i = 0; i < buffer.length; i++) {
    mean += buffer[i];
  }

  mean /= buffer.length;


  const normalized =
    new Float32Array(
      buffer.length
    );


  for (let i = 0; i < buffer.length; i++) {
    normalized[i] =
      buffer[i] - mean;
  }


  /* -------------------------------------------------------
     Autocorrelation.
  ------------------------------------------------------- */

  const minLag = Math.floor(
    sampleRate /
      LIVE_MAX_FREQUENCY
  );

  const maxLag = Math.floor(
    sampleRate /
      LIVE_MIN_FREQUENCY
  );


  let bestLag = -1;
  let bestCorrelation = 0;


  for (
    let lag = minLag;
    lag <= maxLag;
    lag++
  ) {
    let correlation = 0;

    let energyA = 0;
    let energyB = 0;


    const limit =
      normalized.length - lag;


    for (
      let i = 0;
      i < limit;
      i++
    ) {
      const a =
        normalized[i];

      const b =
        normalized[i + lag];

      correlation +=
        a * b;

      energyA +=
        a * a;

      energyB +=
        b * b;
    }


    if (
      energyA === 0 ||
      energyB === 0
    ) {
      continue;
    }


    const normalizedCorrelation =
      correlation /
      Math.sqrt(
        energyA *
          energyB
      );


    if (
      normalizedCorrelation >
        bestCorrelation
    ) {
      bestCorrelation =
        normalizedCorrelation;

      bestLag = lag;
    }
  }


  if (
    bestLag === -1 ||
    bestCorrelation < 0.45
  ) {
    return null;
  }


  const frequency =
    sampleRate /
    bestLag;


  if (
    frequency <
      LIVE_MIN_FREQUENCY ||
    frequency >
      LIVE_MAX_FREQUENCY
  ) {
    return null;
  }


  return {
    frequency,
    confidence:
      bestCorrelation,
  };
}


/* =========================================================
   PITCH GRAPH
========================================================= */

function PitchGraph({
  data = [],
  userData = [],
  liveTime = 0,
  liveMode = false,
}) {
  const width = 1000;
  const height = 320;

  const paddingLeft = 55;
  const paddingRight = 25;
  const paddingTop = 25;
  const paddingBottom = 40;

  const plotWidth =
    width -
    paddingLeft -
    paddingRight;

  const plotHeight =
    height -
    paddingTop -
    paddingBottom;


  const referencePoints =
    data.filter(
      (point) =>
        point &&
        Number(point.frequency) > 0
    );


  const userPoints =
    userData.filter(
      (point) =>
        point &&
        Number(point.frequency) > 0
    );


  if (
    referencePoints.length === 0 &&
    userPoints.length === 0
  ) {
    return (
      <div className="pitch-empty">
        <BarChart3 size={28} />
        <span>
          Pitch graph will appear here.
        </span>
      </div>
    );
  }


  const allFrequencies = [
    ...referencePoints.map(
      (point) =>
        Number(point.frequency)
    ),
    ...userPoints.map(
      (point) =>
        Number(point.frequency)
    ),
  ];


  let minFrequency =
    Math.min(
      ...allFrequencies
    );

  let maxFrequency =
    Math.max(
      ...allFrequencies
    );


  if (
    !Number.isFinite(
      minFrequency
    ) ||
    !Number.isFinite(
      maxFrequency
    )
  ) {
    minFrequency = 100;
    maxFrequency = 500;
  }


  const range =
    Math.max(
      maxFrequency -
        minFrequency,
      100
    );


  minFrequency -=
    range * 0.12;

  maxFrequency +=
    range * 0.12;


  const duration =
    data.length > 0
      ? Math.max(
          ...data.map(
            (point) =>
              Number(
                point.time
              ) || 0
          )
        )
      : Math.max(
          liveTime,
          1
        );


  const safeDuration =
    Math.max(
      duration,
      1
    );


  function xForTime(time) {
    return (
      paddingLeft +
      (time /
        safeDuration) *
        plotWidth
    );
  }


  function yForFrequency(
    frequency
  ) {
    return (
      paddingTop +
      (1 -
        (frequency -
          minFrequency) /
          (maxFrequency -
            minFrequency)) *
        plotHeight
    );
  }


  function createPath(
    points
  ) {
    if (!points.length) {
      return "";
    }


    return points
      .map(
        (point, index) => {
          const x =
            xForTime(
              Number(
                point.time
              ) || 0
            );

          const y =
            yForFrequency(
              Number(
                point.frequency
              )
            );


          return `${
            index === 0
              ? "M"
              : "L"
          } ${x} ${y}`;
        }
      )
      .join(" ");
  }


  const referencePath =
    createPath(
      referencePoints
    );

  const userPath =
    createPath(
      userPoints
    );


  const liveX =
    xForTime(
      Math.min(
        liveTime,
        safeDuration
      )
    );


  return (
    <div className="pitch-graph-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="pitch-svg"
        preserveAspectRatio="none"
      >

        {/* -------------------------------------------------
            Horizontal guide lines
        ------------------------------------------------- */}

        {[0, 0.25, 0.5, 0.75, 1].map(
          (ratio) => {
            const y =
              paddingTop +
              ratio *
                plotHeight;

            return (
              <line
                key={ratio}
                x1={paddingLeft}
                x2={
                  width -
                  paddingRight
                }
                y1={y}
                y2={y}
                className="pitch-grid-line"
              />
            );
          }
        )}


        {/* -------------------------------------------------
            Reference pitch
        ------------------------------------------------- */}

        {referencePath && (
          <path
            d={referencePath}
            className="reference-line"
            fill="none"
          />
        )}


        {/* -------------------------------------------------
            User pitch
        ------------------------------------------------- */}

        {userPath && (
          <path
            d={userPath}
            className="user-line"
            fill="none"
          />
        )}


        {/* -------------------------------------------------
            Live position
        ------------------------------------------------- */}

        {liveMode && (
          <>
            <line
              x1={liveX}
              x2={liveX}
              y1={paddingTop}
              y2={
                height -
                paddingBottom
              }
              className="live-position-line"
            />

            <circle
              cx={liveX}
              cy={
                userPoints.length
                  ? yForFrequency(
                      Number(
                        userPoints[
                          userPoints.length -
                            1
                        ].frequency
                      )
                    )
                  : height / 2
              }
              r="7"
              className="live-pitch-dot"
            />
          </>
        )}


        {/* -------------------------------------------------
            Axis labels
        ------------------------------------------------- */}

        <text
          x="12"
          y={
            paddingTop + 10
          }
          className="pitch-axis-label"
        >
          High
        </text>

        <text
          x="12"
          y={
            height / 2
          }
          className="pitch-axis-label"
        >
          Mid
        </text>

        <text
          x="12"
          y={
            height -
            paddingBottom
          }
          className="pitch-axis-label"
        >
          Low
        </text>

      </svg>


      <div className="pitch-graph-footer">

        <span>
          Reference
        </span>

        <span>
          {liveMode
            ? "Your live pitch"
            : "Your recording"}
        </span>

      </div>
    </div>
  );
}


/* =========================================================
   LIVE FEEDBACK CARD
========================================================= */

function LiveFeedback({
  referenceFrequency,
  userFrequency,
}) {
  if (
    !referenceFrequency ||
    !userFrequency
  ) {
    return (
      <div className="live-feedback neutral">
        <Activity size={22} />
        <div>
          <strong>
            Listen and sing...
          </strong>

          <span>
            Your pitch will appear here.
          </span>
        </div>
      </div>
    );
  }


  const cents =
    frequencyToCents(
      referenceFrequency,
      userFrequency
    );


  const absolute =
    Math.abs(cents);


  let status = "correct";
  let title = "PERFECT";
  let message =
    "Your pitch is matching the reference.";


  if (absolute > 80) {

    if (cents > 0) {
      status = "high";
      title = "TOO HIGH";
      message =
        "Bring your voice down.";
    } else {
      status = "low";
      title = "TOO LOW";
      message =
        "Raise your voice slightly.";
    }

  } else if (absolute > 35) {

    if (cents > 0) {
      status = "high";
      title = "SLIGHTLY HIGH";
      message =
        "Lower your pitch a little.";
    } else {
      status = "low";
      title = "SLIGHTLY LOW";
      message =
        "Raise your pitch a little.";
    }
  }


  return (
    <div
      className={`live-feedback ${status}`}
    >
      <Activity size={24} />

      <div>
        <strong>
          {title}
        </strong>

        <span>
          {message}
        </span>
      </div>

      <div className="live-cents">
        {cents >= 0
          ? "+"
          : ""}
        {Math.round(cents)}
        ¢
      </div>
    </div>
  );
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function MusicSong() {

  const navigate =
    useNavigate();


  /* -------------------------------------------------------
     Song state
  ------------------------------------------------------- */

  const [
    selectedSong,
    setSelectedSong,
  ] = useState(null);


  const [
    songAnalysis,
    setSongAnalysis,
  ] = useState(null);


  const [
    songLoading,
    setSongLoading,
  ] = useState(false);


  const [
    songSearch,
    setSongSearch,
  ] = useState("");


  const [
    showSearch,
    setShowSearch,
  ] = useState(false);


  /* -------------------------------------------------------
     Voice state
  ------------------------------------------------------- */

  const [
    isRecording,
    setIsRecording,
  ] = useState(false);


  const [
    recordingTime,
    setRecordingTime,
  ] = useState(0);


  const [
    voiceFile,
    setVoiceFile,
  ] = useState(null);


  const [
    voicePreview,
    setVoicePreview,
  ] = useState("");


  const [
    voiceLoading,
    setVoiceLoading,
  ] = useState(false);


  const [
    comparison,
    setComparison,
  ] = useState(null);

  const [skillLevel, setSkillLevel] = useState(() => {
    try {
      return localStorage.getItem("skillsensai-music-level") || "beginner";
    } catch {
      return "beginner";
    }
  });

  const [saveProgress, setSaveProgress] = useState(() => {
    try {
      return localStorage.getItem("skillsensai-save-music-progress") !== "false";
    } catch {
      return true;
    }
  });

  const [progressHistory, setProgressHistory] = useState(() => {
    try {
      const saved = localStorage.getItem("skillsensai-music-progress-history");
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });


  /* -------------------------------------------------------
     Live state
  ------------------------------------------------------- */

  const [
    livePitch,
    setLivePitch,
  ] = useState(null);


  const [
    liveReferencePitch,
    setLiveReferencePitch,
  ] = useState(null);


  const [
    livePitchHistory,
    setLivePitchHistory,
  ] = useState([]);


  const [
    liveStatus,
    setLiveStatus,
  ] = useState("idle");


  const [
    error,
    setError,
  ] = useState("");


  /* -------------------------------------------------------
     Refs
  ------------------------------------------------------- */

  const mediaRecorderRef =
    useRef(null);

  const mediaStreamRef =
    useRef(null);

  const audioChunksRef =
    useRef([]);

  const timerRef =
    useRef(null);

  const audioContextRef =
    useRef(null);

  const analyserRef =
    useRef(null);

  const sourceNodeRef =
    useRef(null);

  const animationRef =
    useRef(null);

  const recordingStartRef =
    useRef(null);

  const liveHistoryRef =
    useRef([]);

  /*
     IMPORTANT:
     The microphone analyser can run many times per
     second. We keep collecting pitch points normally,
     but update the React graph state only periodically.
     This reduces page re-rendering and prevents shaking.
  */
  const lastGraphUpdateRef =
    useRef(0);

  const lastHandledComparisonRef =
    useRef(null);


  useEffect(() => {
    try {
      localStorage.setItem("skillsensai-music-level", skillLevel);
    } catch (storageError) {
      console.warn("Could not save music skill level", storageError);
    }
  }, [skillLevel]);

  useEffect(() => {
    try {
      localStorage.setItem("skillsensai-save-music-progress", String(saveProgress));
      if (saveProgress) {
        localStorage.setItem("skillsensai-music-progress-history", JSON.stringify(progressHistory));
      }
    } catch (storageError) {
      console.warn("Could not save music progress history", storageError);
    }
  }, [saveProgress, progressHistory]);

  useEffect(() => {
    if (!comparison || comparison.success !== true) return;
    if (lastHandledComparisonRef.current === comparison) return;
    lastHandledComparisonRef.current = comparison;
    if (!saveProgress) return;
    const entry = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      date: new Date().toISOString(),
      song: selectedSong?.name || "Practice song",
      level: skillLevel,
      overall_score: Number(comparison.overall_score),
      pitch_accuracy: comparison.pitch_accuracy,
      note_match: comparison.note_match,
      timing_accuracy: comparison.timing_accuracy,
      stability: comparison.stability,
    };
    setProgressHistory((previous) => [entry, ...previous].slice(0, 30));
  }, [comparison, saveProgress]);


  /* =======================================================
     CLEANUP
  ======================================================= */

  useEffect(() => {

    return () => {

      stopLiveAudio();

      if (
        timerRef.current
      ) {
        clearInterval(
          timerRef.current
        );
      }


      if (
        voicePreview
      ) {
        URL.revokeObjectURL(
          voicePreview
        );
      }

    };

  }, []);


  /* =======================================================
     STOP LIVE AUDIO
  ======================================================= */

  function stopLiveAudio() {

    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }

    if (
      animationRef.current
    ) {

      cancelAnimationFrame(
        animationRef.current
      );

      animationRef.current =
        null;
    }


    if (
      sourceNodeRef.current
    ) {

      try {
        sourceNodeRef.current
          .disconnect();
      } catch {}
    }


    if (
      analyserRef.current
    ) {

      try {
        analyserRef.current
          .disconnect();
      } catch {}
    }


    if (
      audioContextRef.current
    ) {

      try {
        audioContextRef.current
          .close();
      } catch {}

      audioContextRef.current =
        null;
    }


    sourceNodeRef.current =
      null;

    analyserRef.current =
      null;
  }


  /* =======================================================
     GET REFERENCE PITCH AT CURRENT TIME
  ======================================================= */

  function getReferencePitch(
    currentTime
  ) {

    if (
      !songAnalysis ||
      !songAnalysis.pitch_data
    ) {
      return null;
    }


    const points =
      songAnalysis.pitch_data;


    if (!points.length) {
      return null;
    }


    let closest = null;
    let smallestDifference =
      Infinity;


    for (const point of points) {

      const difference =
        Math.abs(
          Number(point.time) -
            currentTime
        );


      if (
        difference <
        smallestDifference
      ) {

        smallestDifference =
          difference;

        closest =
          point;
      }
    }


    if (
      !closest ||
      Number(
        closest.frequency
      ) <= 0
    ) {
      return null;
    }


    return Number(
      closest.frequency
    );
  }


  /* =======================================================
     LIVE AUDIO LOOP
  ======================================================= */

  function processLivePitch() {

    if (
      !analyserRef.current
    ) {
      return;
    }


    const analyser =
      analyserRef.current;


    const buffer =
      new Float32Array(
        analyser.fftSize
      );


    analyser.getFloatTimeDomainData(
      buffer
    );


    const result =
      detectLivePitch(
        buffer,
        audioContextRef.current?.sampleRate || LIVE_SAMPLE_RATE
      );


    const elapsed =
      recordingStartRef.current
        ? (
            performance.now() -
            recordingStartRef.current
          ) / 1000
        : 0;


    if (result) {

      const currentFrequency =
        result.frequency;


      const referenceFrequency =
        getReferencePitch(
          elapsed
        );


      setLivePitch(
        currentFrequency
      );


      setLiveReferencePitch(
        referenceFrequency
      );


      liveHistoryRef.current =
        [
          ...liveHistoryRef.current,
          {
            time: elapsed,
            frequency:
              currentFrequency,
            note:
              frequencyToNote(
                currentFrequency
              ),
          },
        ].slice(-250);


      /*
       * Keep collecting live pitch points on every
       * analyser frame, but do not force React to
       * redraw the entire graph on every frame.
       */
      const now =
        performance.now();


      if (
        now -
          lastGraphUpdateRef.current >=
        80
      ) {

        lastGraphUpdateRef.current =
          now;

        setLivePitchHistory([
          ...liveHistoryRef.current,
        ]);
      }


      if (
        referenceFrequency
      ) {

        const cents =
          frequencyToCents(
            referenceFrequency,
            currentFrequency
          );


        if (
          Math.abs(cents) <= 35
        ) {

          setLiveStatus(
            "correct"
          );

        } else if (
          cents > 0
        ) {

          setLiveStatus(
            "high"
          );

        } else {

          setLiveStatus(
            "low"
          );
        }
      }

    } else {

      setLivePitch(null);
      setLiveStatus("idle");
    }


    animationRef.current =
      requestAnimationFrame(
        processLivePitch
      );
  }


  /* =======================================================
     START LIVE PITCH
  ======================================================= */

  async function startLivePitch(stream = mediaStreamRef.current) {

    if (
      !songAnalysis
    ) {

      setError(
        "Please select and analyse a song first."
      );

      return;
    }


    try {

      setError("");


      if (!stream || stream.getAudioTracks().length === 0) {
        throw new Error("Microphone stream is unavailable.");
      }


      const AudioContext =
        window.AudioContext ||
        window.webkitAudioContext;


      const context =
        new AudioContext();


      audioContextRef.current =
        context;


      const source =
        context.createMediaStreamSource(
          stream
        );


      sourceNodeRef.current =
        source;


      const analyser =
        context.createAnalyser();


      analyser.fftSize =
        LIVE_BUFFER_SIZE;

      analyser.smoothingTimeConstant =
        0.15;


      analyserRef.current =
        analyser;


      source.connect(
        analyser
      );


      recordingStartRef.current =
        performance.now();


      liveHistoryRef.current =
        [];

      setLivePitchHistory(
        []
      );


      /*
       * Reset the graph update timer whenever
       * a new recording begins.
       */
      lastGraphUpdateRef.current =
        performance.now();


      setIsRecording(true);


      setLiveStatus(
        "idle"
      );


      processLivePitch();


    } catch (err) {

      console.error(err);


      setError(
        "Microphone access was denied or is unavailable."
      );
      throw err;
    }
  }


  /* =======================================================
     STOP RECORDING
  ======================================================= */

  function stopRecording() {

    if (
      mediaStreamRef.current
    ) {

      mediaStreamRef.current
        .getTracks()
        .forEach(
          (track) =>
            track.stop()
        );

      mediaStreamRef.current =
        null;
    }


    stopLiveAudio();


    setIsRecording(false);


    if (
      timerRef.current
    ) {

      clearInterval(
        timerRef.current
      );

      timerRef.current =
        null;
    }
  }


  /* =======================================================
     START RECORDING
  ======================================================= */

  async function startRecording() {

    if (
      !songAnalysis
    ) {

      setError(
        "Please select and analyse a song first."
      );

      return;
    }


    try {

      setError("");


      const stream =
        await navigator.mediaDevices
          .getUserMedia({
            audio: true,
          });


      mediaStreamRef.current =
        stream;


      const supportedTypes = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ];


      let mimeType =
        "";


      for (
        const type of supportedTypes
      ) {

        if (
          MediaRecorder.isTypeSupported(
            type
          )
        ) {

          mimeType = type;
          break;
        }
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
        () => {

          const blob =
            new Blob(
              audioChunksRef.current,
              {
                type:
                  mimeType ||
                  "audio/webm",
              }
            );


          const extension =
            mimeType.includes(
              "mp4"
            )
              ? "m4a"
              : "webm";


          const file =
            new File(
              [
                blob,
              ],
              `voice-recording.${extension}`,
              {
                type:
                  mimeType ||
                  "audio/webm",
              }
            );


          setVoiceFile(
            file
          );


          if (
            voicePreview
          ) {

            URL.revokeObjectURL(
              voicePreview
            );
          }


          setVoicePreview(
            URL.createObjectURL(
              blob
            )
          );


          /* ---------------------------------------------
             Also stop live pitch system.
          --------------------------------------------- */

          stopLiveAudio();


          setLivePitch(null);
          setLiveReferencePitch(null);
        };


      recorder.start(
        250
      );


      setIsRecording(
        true
      );


      setRecordingTime(
        0
      );


      timerRef.current =
        setInterval(() => {

          setRecordingTime(
            (previous) =>
              previous + 1
          );

        }, 1000);


      /* ---------------------------------------------
         Start the live pitch system separately.
      --------------------------------------------- */

      await startLivePitch(stream);


    } catch (err) {

      console.error(err);

      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try { mediaRecorderRef.current.stop(); } catch {}
      }
      stopRecording();

      setError(
        "Could not access your microphone. Please check microphone permissions and try again."
      );
    }
  }


  /* =======================================================
     STOP EVERYTHING
  ======================================================= */

  function stopAllRecording() {

    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !==
        "inactive"
    ) {

      mediaRecorderRef.current.stop();
    }


    stopRecording();
  }


  /* =======================================================
     HANDLE SONG FILE
  ======================================================= */

  async function handleSongUpload(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }

    const validationError = await validateAudioFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setSelectedSong(
      file
    );

    setSongAnalysis(null);
    setComparison(null);
    setError("");


    const objectUrl =
      URL.createObjectURL(
        file
      );


    setSongLoading(
      true
    );


    try {

      const formData =
        new FormData();


      formData.append(
        "file",
        file
      );


      // Let the browser/Axios create the multipart boundary automatically.
      const response = await axios.post(
        `${API_URL.replace(/\/$/, "")}/analyze-song`,
        formData,
        {
          timeout: 180000,
          headers: { Accept: "application/json" },
        }
      );


      if (
        !response.data.success
      ) {

        throw new Error(
          "Song analysis failed."
        );
      }


      setSongAnalysis({
        ...response.data,
        audioUrl:
          objectUrl,
      });


    } catch (err) {

      console.error(err);


      URL.revokeObjectURL(
        objectUrl
      );


      setError(
        err.response?.data?.detail ||
        (err.code === "ECONNABORTED"
          ? "Song analysis took too long. Try a shorter audio clip (under 20 seconds)."
          : !err.response
            ? "Could not reach the SkillSensAI backend. Check your internet connection and try again."
            : err.message || "Could not analyse the selected song.")
      );


    } finally {

      setSongLoading(
        false
      );
    }
  }


  /* =======================================================
     SEARCH WEB
  ======================================================= */

  function searchSongOnWeb() {

    const query =
      songSearch.trim();


    if (!query) {
      return;
    }


    /*
      We intentionally do not download arbitrary
      copyrighted music from search engines.

      This opens a web search where the user can find
      an authorized/licensed source or a song they are
      permitted to use.
    */

    const url =
      `https://www.google.com/search?q=${encodeURIComponent(
        `${query} royalty free music download`
      )}`;


    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  }


  /* =======================================================
     HANDLE VOICE FILE
  ======================================================= */

  async function handleVoiceFile(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
      return;
    }

    const validationError = await validateAudioFile(file);
    if (validationError) {
      setError(validationError);
      event.target.value = "";
      return;
    }

    setVoiceFile(
      file
    );


    if (
      voicePreview
    ) {

      URL.revokeObjectURL(
        voicePreview
      );
    }


    setVoicePreview(
      URL.createObjectURL(
        file
      )
    );


    setComparison(null);
    setError("");
  }


  /* =======================================================
     ANALYSE VOICE
  ======================================================= */

  async function analyzeVoice() {

    if (
      !selectedSong
    ) {

      setError(
        "Please select a song first."
      );

      return;
    }


    if (
      !voiceFile
    ) {

      setError(
        "Please record your voice or upload a recording."
      );

      return;
    }


    if (
      selectedSong.name === voiceFile.name &&
      selectedSong.size === voiceFile.size &&
      selectedSong.lastModified === voiceFile.lastModified
    ) {
      setError(
        "The reference song and voice recording appear to be the same file. Please upload a recording of your own singing."
      );
      return;
    }


    setVoiceLoading(
      true
    );


    setError("");
    setComparison(null);


    try {

      const formData =
        new FormData();


      formData.append(
        "song",
        selectedSong,
        selectedSong.name
      );


      formData.append(
        "voice",
        voiceFile,
        voiceFile.name
      );
      formData.append("level", skillLevel);


      // Let Axios/browser set the multipart boundary automatically.
      // The backend may need time to load or analyse audio, so allow up to 3 minutes.
      const response = await axios.post(
        `${API_URL.replace(/\/$/, "")}/compare-song-voice`,
        formData,
        {
          timeout: 180000,
          headers: {
            Accept: "application/json",
          },
        }
      );

      if (!response.data || response.data.success !== true) {
        throw new Error(
          response.data?.detail ||
          response.data?.message ||
          "The server did not return a successful comparison."
        );
      }

      setComparison(response.data);

    } catch (err) {
      console.error("SkillSensAI voice comparison failed:", err);

      const serverMessage =
        err.response?.data?.detail ||
        err.response?.data?.message;

      setError(
        serverMessage ||
        (err.code === "ECONNABORTED"
          ? "Voice comparison took too long. Please try a shorter recording (under 20 seconds) and try again."
          : !err.response
            ? "Could not reach the SkillSensAI backend. Please check your internet connection and try again."
            : err.message || "Could not compare your recording with the song.")
      );


    } finally {

      setVoiceLoading(
        false
      );
    }
  }


  /* =======================================================
     FORMAT TIME
  ======================================================= */

  function formatTime(
    seconds
  ) {

    const safeSeconds =
      Math.max(
        0,
        Number(seconds) || 0
      );


    const minutes =
      Math.floor(
        safeSeconds / 60
      );


    const remaining =
      Math.floor(
        safeSeconds % 60
      );


    return `${minutes}:${String(
      remaining
    ).padStart(2, "0")}`;
  }


  /* =======================================================
     RESET
  ======================================================= */

  function resetPage() {

    stopAllRecording();


    if (
      voicePreview
    ) {

      URL.revokeObjectURL(
        voicePreview
      );
    }


    setSelectedSong(null);
    setSongAnalysis(null);
    setVoiceFile(null);
    setVoicePreview("");
    setComparison(null);
    setRecordingTime(0);
    setLivePitch(null);
    setLiveReferencePitch(null);
    setLivePitchHistory([]);
    setLiveStatus("idle");
    setError("");
  }


  /* =======================================================
     REFERENCE CURRENT NOTE
  ======================================================= */

  const currentReferenceNote =
    liveReferencePitch
      ? frequencyToNote(
          liveReferencePitch
        )
      : "—";


  const currentUserNote =
    livePitch
      ? frequencyToNote(
          livePitch
        )
      : "—";


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="music-song-page">

      {/* ===================================================
          BACK
      =================================================== */}

      <button
        className="music-song-back"
        onClick={() =>
          navigate("/music")
        }
      >
        <ArrowLeft size={18} />
        Back to Music
      </button>


      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="music-song-header">

        <div className="music-song-icon">
          <Music2 size={30} />
        </div>


        <div>
          <div className="music-song-label">
            AI SONG PRACTICE
          </div>

          <h1>
            Sing With AI Feedback
          </h1>

          <p>
            Choose a song, sing along,
            and improve your pitch in real time.
          </p>
        </div>

      </header>


      <main className="music-song-container">


        {/* =================================================
            ERROR
        ================================================= */}

        {error && (
          <div className="music-song-error">
            <AlertCircle size={20} />

            <span>
              {error}
            </span>
          </div>
        )}


        {/* =================================================
            STEP 1
        ================================================= */}

        <section className="music-step-card">

          <div className="step-number">
            1
          </div>


          <div className="step-content">

            <div className="step-label">
              CHOOSE YOUR SONG
            </div>


            <h2>
              Upload or search for a song
            </h2>


            <p>
              Use a song file that you own or
              are permitted to analyse.
            </p>


            <div className="voice-options">

              {/* -------------------------------------------
                  Local upload
              ------------------------------------------- */}

              <label className="upload-song-button">

                <Upload size={20} />

                Choose Song

                <input
                  type="file"
                  accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/webm"
                  onChange={
                    handleSongUpload
                  }
                  hidden
                />

              </label>


              {/* -------------------------------------------
                  Search
              ------------------------------------------- */}

              <button
                className="voice-upload-button"
                onClick={() =>
                  setShowSearch(
                    !showSearch
                  )
                }
              >
                <Search size={20} />
                Search Song
              </button>

            </div>


            {/* =============================================
                SEARCH BOX
            ============================================= */}

            {showSearch && (
              <div className="song-search-box">

                <div className="song-search-input-row">

                  <Search
                    size={19}
                  />

                  <input
                    type="text"
                    placeholder="Search for a song..."
                    value={
                      songSearch
                    }
                    onChange={(event) =>
                      setSongSearch(
                        event.target.value
                      )
                    }
                    onKeyDown={(event) => {

                      if (
                        event.key ===
                        "Enter"
                      ) {
                        searchSongOnWeb();
                      }

                    }}
                  />

                  <button
                    onClick={
                      searchSongOnWeb
                    }
                  >
                    Search
                  </button>

                </div>


                <p className="song-search-note">
                  Search the web for an
                  authorized or royalty-free
                  version of the song, then
                  import the permitted audio
                  file into SkillSensAI.
                </p>

              </div>
            )}


            {/* =============================================
                SELECTED SONG
            ============================================= */}

            {selectedSong && (
              <div className="selected-file">

                <div className="selected-file-icon">
                  <Music2 size={22} />
                </div>


                <div className="selected-file-info">

                  <strong>
                    {selectedSong.name}
                  </strong>

                  <span>
                    {(
                      selectedSong.size /
                      1024 /
                      1024
                    ).toFixed(2)}
                    {" MB"}
                  </span>

                </div>


                {songAnalysis && (
                  <CheckCircle2
                    className="success-icon"
                    size={24}
                  />
                )}

              </div>
            )}


            {/* =============================================
                LOADING
            ============================================= */}

            {songLoading && (
              <div className="loading-box">

                <Loader2
                  size={22}
                  className="spin"
                />

                <span>
                  AI is analysing the song...
                </span>

              </div>
            )}

          </div>

        </section>


        {/* =================================================
            SONG ANALYSIS
        ================================================= */}

        {songAnalysis && (
          <section className="analysis-result-card">

            <div className="analysis-success">

              <CheckCircle2 size={24} />

              <div>

                <strong>
                  Song analysed successfully
                </strong>

                <span>
                  Reference melody is ready
                  for practice.
                </span>

              </div>

            </div>

            {songAnalysis.warning && (
              <div className="music-song-error" role="alert">
                <AlertCircle size={20} />
                <span>{songAnalysis.warning}</span>
              </div>
            )}

            {/* Show lyrics from supported backend response shapes; never imply they were generated if absent. */}
            <div className="song-lyrics-panel" aria-live="polite">
              <h3>Song Lyrics</h3>
              {(() => {
                const payload = songAnalysis?.data && typeof songAnalysis.data === "object"
                  ? { ...songAnalysis.data, ...songAnalysis }
                  : songAnalysis;
                const lyricValue = payload.lyrics ?? payload.lyrics_text ?? payload.transcript ??
                  payload.transcription ?? payload.transcribed_text ?? payload.text ??
                  payload?.transcription_result?.text ?? payload?.transcription?.text;
                const lyricText = typeof lyricValue === "string"
                  ? lyricValue.trim()
                  : Array.isArray(lyricValue)
                    ? lyricValue.map((item) => typeof item === "string" ? item : item?.text || item?.lyric || item?.word || "").filter(Boolean).join("\n")
                    : "";
                return lyricText ? (
                  <pre className="song-lyrics-text">{lyricText}</pre>
                ) : (
                  <div className="song-lyrics-unavailable" role="status">
                    <strong>Lyrics are not available for this song yet.</strong>
                    <p>{payload.lyrics_warning || payload.transcription_warning || "The current /analyze-song backend returns pitch data but does not return a lyrics/transcription field."}</p>
                    <p>Your song's pitch analysis is still available. To display actual lyrics here, a lyrics lookup or speech-to-text transcription service must be connected to the backend; this screen cannot reliably create lyrics from pitch data alone.</p>
                  </div>
                );
              })()}
            </div>

            <div className="pitch-range">

              <span>
                Duration
              </span>

              <strong>
                {formatTime(
                  songAnalysis.duration
                )}
              </strong>


              <span>
                Pitch Points
              </span>

              <strong>
                {
                  songAnalysis
                    .total_pitch_points
                }
              </strong>

            </div>


            {/* =========================================
                AUDIO PLAYER
            ========================================= */}

            {songAnalysis.audioUrl && (
              <div className="audio-preview-box">

                <Volume2 size={20} />

                <audio
                  controls
                  src={
                    songAnalysis.audioUrl
                  }
                />

              </div>
            )}


            <div className="pitch-graph-card">

              <div className="pitch-graph-heading">

                <div>

                  <h3>
                    Reference Melody
                  </h3>

                  <p>
                    This is the pitch
                    detected from your song.
                  </p>

                </div>

              </div>


              <PitchGraph
                data={
                  songAnalysis.pitch_data ||
                  []
                }
              />

            </div>

          </section>
        )}


        {/* =================================================
            STEP 2
        ================================================= */}

        {songAnalysis && (
          <section className="music-step-card voice-step">

            <div className="step-number">
              2
            </div>


            <div className="step-content">

              <div className="step-label">
                SING THE SONG
              </div>


              <h2>
                Follow the melody
              </h2>


              <p>
                Record live for real-time
                pitch guidance, or upload
                a recording for detailed AI analysis.
              </p>


              {/* =========================================
                  VOICE OPTIONS
              ========================================= */}

              <div className="voice-options">

                {!isRecording ? (
                  <button
                    className="record-button"
                    onClick={
                      startRecording
                    }
                  >
                    <Mic2 size={21} />
                    Record Live
                  </button>
                ) : (
                  <button
                    className="stop-recording-button"
                    onClick={
                      stopAllRecording
                    }
                  >
                    <Square size={19} />
                    Stop Recording
                  </button>
                )}


                <label className="voice-upload-button">

                  <Upload size={20} />

                  Upload Recording

                  <input
                    type="file"
                    accept=".mp3,.wav,.m4a,.aac,.ogg,.webm,audio/mpeg,audio/wav,audio/mp4,audio/aac,audio/ogg,audio/webm"
                    onChange={
                      handleVoiceFile
                    }
                    hidden
                  />

                </label>

              </div>


              {/* =========================================
                  RECORDING STATUS
              ========================================= */}

              {isRecording && (
                <div className="recording-status">

                  <span className="recording-dot" />

                  <strong>
                    Recording
                  </strong>

                  <span>
                    {formatTime(
                      recordingTime
                    )}
                  </span>

                </div>
              )}


              {/* =========================================
                  LIVE PRACTICE
              ========================================= */}

              {isRecording && (
                <div className="live-practice-panel">

                  <div className="live-practice-header">

                    <div>

                      <span>
                        LIVE PITCH COACH
                      </span>

                      <h3>
                        Match the reference
                      </h3>

                    </div>


                    <div className="live-time">
                      {formatTime(
                        recordingTime
                      )}
                    </div>

                  </div>


                  {/* ---------------------------------------
                      Stable feedback area
                  --------------------------------------- */}

                  <div className="live-feedback-slot">

                    <LiveFeedback
                      referenceFrequency={
                        liveReferencePitch
                      }
                      userFrequency={
                        livePitch
                      }
                    />

                  </div>


                  <div className="live-note-grid">

                    <div className="live-note-card">

                      <span>
                        REFERENCE
                      </span>

                      <strong>
                        {
                          currentReferenceNote
                        }
                      </strong>

                      <small>
                        {liveReferencePitch
                          ? `${Math.round(
                              liveReferencePitch
                            )} Hz`
                          : "—"}
                      </small>

                    </div>


                    <div className="live-note-card">

                      <span>
                        YOUR VOICE
                      </span>

                      <strong>
                        {currentUserNote}
                      </strong>

                      <small>
                        {livePitch
                          ? `${Math.round(
                              livePitch
                            )} Hz`
                          : "—"}
                      </small>

                    </div>

                  </div>


                  {/* ---------------------------------------
                      Stable graph area
                  --------------------------------------- */}

                  <div className="live-graph-slot">

                    <PitchGraph
                      data={
                        songAnalysis.pitch_data ||
                        []
                      }
                      userData={
                        livePitchHistory
                      }
                      liveTime={
                        recordingTime
                      }
                      liveMode
                    />

                  </div>

                </div>
              )}


              {/* =========================================
                  VOICE FILE
              ========================================= */}

              {voiceFile && !isRecording && (
                <div className="voice-file-box">

                  <div className="voice-file-icon">
                    <Mic2 size={22} />
                  </div>


                  <div className="voice-file-info">

                    <strong>
                      {voiceFile.name}
                    </strong>

                    <span>
                      Recording ready
                    </span>

                  </div>

                </div>
              )}


              {/* =========================================
                  AUDIO PREVIEW
              ========================================= */}

              {voicePreview &&
                !isRecording && (
                  <div className="audio-preview-box">

                    <Volume2 size={20} />

                    <audio
                      controls
                      src={
                        voicePreview
                      }
                    />

                  </div>
                )}


              {/* Starting level for the adaptive singing coach */}
              <div className="feedback-card" style={{ marginTop: 18 }}>
                <label htmlFor="music-skill-level" style={{ display: "block", fontWeight: 700, marginBottom: 8 }}>
                  Your starting level
                </label>
                <select
                  id="music-skill-level"
                  value={skillLevel}
                  onChange={(event) => setSkillLevel(event.target.value)}
                  style={{ padding: "10px 12px", borderRadius: 10, width: "100%", maxWidth: 360 }}
                >
                  <option value="beginner">Beginner — build pitch confidence</option>
                  <option value="intermediate">Intermediate — improve consistency</option>
                  <option value="advanced">Advanced — refine precision</option>
                </select>
                <p style={{ margin: "8px 0 0", opacity: 0.8 }}>
                  Exercises and coaching suggestions use this level and the results of your latest attempt.
                </p>
              </div>

              {/* =========================================
                  COMPARE
              ========================================= */}

              {voiceFile &&
                !isRecording && (
                  <button
                    className="analyze-voice-button"
                    onClick={
                      analyzeVoice
                    }
                    disabled={
                      voiceLoading
                    }
                  >

                    {voiceLoading ? (
                      <>
                        <Loader2
                          size={20}
                          className="spin"
                        />

                        AI is comparing...
                      </>
                    ) : (
                      <>
                        <BarChart3 size={20} />

                        Compare My Voice
                      </>
                    )}

                  </button>
                )}

            </div>

          </section>
        )}


        {/* =================================================
            COMPARISON RESULTS
        ================================================= */}

        {comparison && (
          <section className="comparison-results">

            {(comparison.warning || comparison.prototype_note) && (
              <div className="music-song-error" role="alert">
                <AlertCircle size={20} />
                <span>
                  {[comparison.warning, comparison.prototype_note].filter(Boolean).join(" ")}
                </span>
              </div>
            )}

            <div className="score-card">

              <div className="score-icon">
                <BarChart3 size={28} />
              </div>


              <div className="score-content">

                <span>
                  OVERALL PERFORMANCE
                </span>

                <strong>
                  {comparison.overall_score !== null && comparison.overall_score !== undefined && Number.isFinite(Number(comparison.overall_score))
                    ? Math.round(Number(comparison.overall_score))
                    : "Not evaluated"}
                  {comparison.overall_score !== null && comparison.overall_score !== undefined && Number.isFinite(Number(comparison.overall_score)) && (
                    <small>/100</small>
                  )}
                </strong>

              </div>

            </div>

            <p style={{ margin: "12px 0 18px", lineHeight: 1.5 }}>
              {comparison.overall_score !== null && comparison.overall_score !== undefined && Number.isFinite(Number(comparison.overall_score))
                ? Number(comparison.overall_score) >= 85
                  ? "Strong attempt. Review the detailed report to refine the few sections that still differ from the reference."
                  : Number(comparison.overall_score) >= 65
                    ? "Good practice progress. Use the targeted exercises below to improve the weakest measured skill."
                    : "Use this as a baseline, not a judgement. Practise a short phrase slowly and compare again."
                : "There was not enough reliable overlapping pitch to calculate a score. Metrics are marked Not evaluated instead of showing a misleading zero."}
            </p>

            {/* =============================================
                METRICS
            ============================================= */}

            <div className="metrics-grid">

              <div className="metric-card">

                <span className="metric-label-help" title="Pitch accuracy estimates how closely the notes you sang match the reference melody. Higher is better. Hover over this label any time for an explanation." tabIndex={0}>
                  Pitch Accuracy <span aria-hidden="true">ⓘ</span>
                </span>

                <strong>
                  {comparison.pitch_accuracy !== null && comparison.pitch_accuracy !== undefined && Number.isFinite(Number(comparison.pitch_accuracy))
                    ? `${Math.round(Number(comparison.pitch_accuracy))}%`
                    : "Not evaluated"}
                </strong>

                {comparison.pitch_accuracy !== null && comparison.pitch_accuracy !== undefined && Number.isFinite(Number(comparison.pitch_accuracy)) && (
                  <div className="metric-bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(comparison.pitch_accuracy)))}%` }} /></div>
                )}

              </div>


              <div className="metric-card">

                <span className="metric-label-help" title="Note matching estimates how often your detected musical notes match the reference notes. It can be affected by background instruments or unclear vocals." tabIndex={0}>
                  Note Matching <span aria-hidden="true">ⓘ</span>
                </span>

                <strong>
                  {comparison.note_match !== null && comparison.note_match !== undefined && Number.isFinite(Number(comparison.note_match))
                    ? `${Math.round(Number(comparison.note_match))}%`
                    : "Not evaluated"}
                </strong>

                {comparison.note_match !== null && comparison.note_match !== undefined && Number.isFinite(Number(comparison.note_match)) && (
                  <div className="metric-bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(comparison.note_match)))}%` }} /></div>
                )}

              </div>


              <div className="metric-card">

                <span className="metric-label-help" title="Timing accuracy estimates whether your note changes happen at roughly the same times as the reference. It is an estimate, not word-level rhythm recognition." tabIndex={0}>
                  Timing Accuracy <span aria-hidden="true">ⓘ</span>
                </span>

                <strong>
                  {comparison.timing_accuracy !== null &&
                  comparison.timing_accuracy !== undefined &&
                  comparison.timing_accuracy !== "" &&
                  Number.isFinite(Number(comparison.timing_accuracy))
                    ? `${Math.round(Number(comparison.timing_accuracy))}%`
                    : "Not evaluated"}
                </strong>

                {comparison.timing_accuracy !== null &&
                comparison.timing_accuracy !== undefined &&
                comparison.timing_accuracy !== "" &&
                Number.isFinite(Number(comparison.timing_accuracy)) && (
                  <div className="metric-bar">
                    <span
                      style={{
                        width: `${Math.max(0, Math.min(100, Number(comparison.timing_accuracy)))}%`,
                      }}
                    />
                  </div>
                )}

              </div>


              <div className="metric-card">

                <span className="metric-label-help" title="Stability estimates how consistently your detected pitch is held rather than wavering unexpectedly. Natural vibrato can affect this estimate." tabIndex={0}>
                  Stability <span aria-hidden="true">ⓘ</span>
                </span>

                <strong>
                  {comparison.stability !== null && comparison.stability !== undefined && Number.isFinite(Number(comparison.stability))
                    ? `${Math.round(Number(comparison.stability))}%`
                    : "Not evaluated"}
                </strong>

                {comparison.stability !== null && comparison.stability !== undefined && Number.isFinite(Number(comparison.stability)) && (
                  <div className="metric-bar"><span style={{ width: `${Math.max(0, Math.min(100, Number(comparison.stability)))}%` }} /></div>
                )}

              </div>


              <div className="metric-card">

                <span className="metric-label-help" title="Average pitch error measures the average difference between your pitch and the reference in cents. 100 cents equals one semitone; lower is better." tabIndex={0}>
                  Average Pitch Error <span aria-hidden="true">ⓘ</span>
                </span>

                <strong>
                  {comparison.average_pitch_error_cents !== null && comparison.average_pitch_error_cents !== undefined && Number.isFinite(Number(comparison.average_pitch_error_cents))
                    ? `${Math.round(Number(comparison.average_pitch_error_cents))}¢`
                    : "Not evaluated"}
                </strong>

              </div>

            </div>


            <details className="comparison-details">
              <summary>Explore detailed feedback, pitch graph and practice exercises</summary>
              <div className="comparison-details-content">

            {/* =============================================
                COMPARISON GRAPH
            ============================================= */}

            <div className="comparison-graph-card">

              <div className="comparison-heading">

                <div>

                  <h3>
                    Reference vs Your Voice
                  </h3>

                  <p>
                    Lower distance between the
                    two lines means better pitch matching.
                  </p>

                </div>


                <div className="graph-legend">

                  <span>
                    <i className="legend-line reference-legend" />
                    Reference
                  </span>

                  <span>
                    <i className="legend-line user-legend" />
                    You
                  </span>

                </div>

              </div>


              <PitchGraph
                data={
                  (
                    comparison
                      .reference_timeline ||
                    []
                  )
                }
                userData={
                  (
                    comparison
                      .user_timeline ||
                    []
                  )
                }
              />

            </div>


            {/* =============================================
                FEEDBACK
            ============================================= */}

            <div className="feedback-card">

              <div className="feedback-header">

                <CheckCircle2 size={22} />

                <h3>
                  AI Feedback
                </h3>

              </div>


              <div className="feedback-list">

                {(
                  comparison.feedback ||
                  []
                ).map(
                  (
                    message,
                    index
                  ) => (
                    <div
                      className="feedback-item"
                      key={index}
                    >
                      <CheckCircle2
                        size={17}
                      />

                      <span>
                        {message}
                      </span>

                    </div>
                  )
                )}

              </div>

            </div>

            <div className="feedback-card" style={{ marginTop: 18 }}>
              <div className="feedback-header">
                <Activity size={22} />
                <h3>Personal coaching plan</h3>
              </div>
              <p style={{ marginTop: 8 }}>
                <strong>Starting level:</strong> {comparison.coaching?.starting_level || skillLevel}
              </p>
              <p>
                <strong>Priority:</strong> Focus on {comparison.coaching?.focus_metric || "the skill that needs the most work"}.
              </p>
              <p>{comparison.coaching?.next_exercise || "Repeat a short phrase slowly, then try it again at the original tempo."}</p>
              <p style={{ opacity: 0.8, fontSize: 13 }}>
                {comparison.coaching?.progression_rule || "Repeat the exercise after each attempt and increase difficulty as your score improves."}
              </p>
            </div>

            {(comparison.sections || []).length > 0 && (
              <details className="feedback-card" style={{ marginTop: 18, padding: 18 }} open>
                <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                  Section-by-section practice report ({comparison.sections.length} time ranges)
                </summary>
                <p style={{ marginTop: 10, opacity: 0.82, fontSize: 13 }}>
                  The analysed audio is divided into short time ranges. These are not automatically identified as verses or choruses, and sections without enough overlapping singing are left unscored.
                </p>
                <div className="feedback-list" style={{ marginTop: 12 }}>
                  {comparison.sections.map((section) => (
                    <div className="feedback-item" key={`section-${section.section_number}`} style={{ alignItems: "flex-start", gap: 10 }}>
                      <BarChart3 size={18} />
                      <div style={{ width: "100%" }}>
                        <strong>
                          Section {section.section_number} · {formatTime(section.start_time)}–{formatTime(section.end_time)}
                        </strong>
                        <p style={{ margin: "5px 0" }}>
                          {section.status === "scored" ? (
                            <>Section score: <strong>{Math.round(Number(section.score) || 0)}/100</strong> · Pitch accuracy: {Math.round(Number(section.pitch_accuracy) || 0)}% · Note match: {Math.round(Number(section.note_match) || 0)}% · Average pitch difference: {Math.round(Number(section.average_pitch_error_cents) || 0)} cents</>
                          ) : "Not enough matching singing to calculate a reliable section score."}
                        </p>
                        <p style={{ margin: "5px 0" }}>{section.feedback}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </details>
            )}

            <details className="feedback-card" style={{ marginTop: 18, padding: 18 }}>
              <summary style={{ cursor: "pointer", fontWeight: 700 }}>
                Detailed report: mistakes, timestamps and exercises ({(comparison.mistakes || []).length})
              </summary>
              {(comparison.mistakes || []).length ? (
                <div className="feedback-list" style={{ marginTop: 14 }}>
                  {(comparison.mistakes || []).map((mistake, index) => (
                    <div className="feedback-item" key={`${mistake.start_time}-${index}`} style={{ alignItems: "flex-start", gap: 10 }}>
                      <AlertCircle size={17} />
                      <div>
                        <strong>
                          {formatTime(mistake.start_time)}–{formatTime(mistake.end_time)} · {mistake.severity || "practice"} priority
                        </strong>
                        <p style={{ margin: "5px 0" }}>
                          Reference: {mistake.reference_note || "Not identified"} · Your detected note: {mistake.user_note || "Not identified"} · Pitch difference: {Math.round(Number(mistake.average_cents_error) || 0)} cents
                        </p>
                        <p style={{ margin: "5px 0" }}>{mistake.explanation}</p>
                        <p style={{ margin: "5px 0" }}><strong>Try this:</strong> {mistake.exercise}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ marginTop: 12 }}>
                  No sustained pitch mismatches were confidently detected in the analysed overlap. This does not guarantee a perfect performance; try a cleaner vocal reference if background music is present.
                </p>
              )}
              <p style={{ opacity: 0.75, fontSize: 12, marginTop: 12 }}>
                Mistakes are inferred from detected pitch differences, not verified lyric or word-level errors. Timestamp accuracy depends on how closely the recordings align.
              </p>
            </details>

              </div>
            </details>

            <div className="feedback-card" style={{ marginTop: 18 }}>
              <div className="feedback-header">
                <CheckCircle2 size={22} />
                <h3>Practice progress</h3>
              </div>
              <label style={{ display: "flex", gap: 10, alignItems: "center", margin: "10px 0" }}>
                <input type="checkbox" checked={saveProgress} onChange={(event) => setSaveProgress(event.target.checked)} />
                Save scores and progress on this device
              </label>
              <p style={{ fontSize: 13, opacity: 0.8 }}>
                Only score summaries are saved here; audio recordings are not saved in this history. Turn this off to stop saving future results.
              </p>
              {saveProgress && progressHistory.length > 0 && (
                <div className="feedback-list">
                  {progressHistory.slice(0, 5).map((entry) => (
                    <div className="feedback-item" key={entry.id}>
                      <BarChart3 size={17} />
                      <span>
                        <strong>{entry.song}</strong> — {Number.isFinite(Number(entry.overall_score)) ? `${Math.round(Number(entry.overall_score))}/100` : "Score unavailable"} · {new Date(entry.date).toLocaleDateString()} · {entry.level}
                      </span>
                    </div>
                  ))}
                </div>
              )}
              {saveProgress && progressHistory.length > 0 && (
                <button type="button" className="reset-button" onClick={() => setProgressHistory([])} style={{ marginTop: 12 }}>
                  Clear saved score history
                </button>
              )}
            </div>


            {/* =============================================
                RESET
            ============================================= */}

            <button
              className="reset-button"
              onClick={
                resetPage
              }
            >

              <RotateCcw size={18} />

              Practise Another Song

            </button>

          </section>
        )}

      </main>

    </div>
  );
}
