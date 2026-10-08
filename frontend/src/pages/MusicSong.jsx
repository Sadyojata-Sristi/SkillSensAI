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


/* =========================================================
   API
   ========================================================= */

const API_URL =
  import.meta.env.VITE_API_URL ||
  "https://skillsensai-backend.onrender.com";


/* =========================================================
   LIVE PITCH SETTINGS
   ========================================================= */

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
        LIVE_SAMPLE_RATE
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


      setLivePitchHistory(
        liveHistoryRef.current
      );


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

  async function startLivePitch() {

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
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
            },
          });


      mediaStreamRef.current =
        stream;


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

      await startLivePitch();


    } catch (err) {

      console.error(err);


      setError(
        "Could not access your microphone."
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


      const response =
        await axios.post(
          `${API_URL}/analyze-song`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
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
        "Could not analyse the selected song."
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

  function handleVoiceFile(
    event
  ) {

    const file =
      event.target.files?.[0];


    if (!file) {
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


      const response =
        await axios.post(
          `${API_URL}/compare-song-voice`,
          formData,
          {
            headers: {
              "Content-Type":
                "multipart/form-data",
            },
          }
        );


      if (
        !response.data.success
      ) {

        throw new Error(
          "Comparison failed."
        );
      }


      setComparison(
        response.data
      );


    } catch (err) {

      console.error(err);


      setError(
        err.response?.data?.detail ||
        "Could not compare your recording with the song."
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
                  accept="audio/*,video/*"
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
                    accept="audio/*,video/*"
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


                  <LiveFeedback
                    referenceFrequency={
                      liveReferencePitch
                    }
                    userFrequency={
                      livePitch
                    }
                  />


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

            <div className="score-card">

              <div className="score-icon">
                <BarChart3 size={28} />
              </div>


              <div className="score-content">

                <span>
                  OVERALL PERFORMANCE
                </span>

                <strong>
                  {Math.round(
                    comparison.overall_score
                  )}
                  <small>
                    /100
                  </small>
                </strong>

              </div>

            </div>


            {/* =============================================
                METRICS
                ============================================= */}

            <div className="metrics-grid">

              <div className="metric-card">

                <span>
                  Pitch Accuracy
                </span>

                <strong>
                  {
                    Math.round(
                      comparison.pitch_accuracy
                    )
                  }
                  %
                </strong>

                <div className="metric-bar">

                  <span
                    style={{
                      width: `${comparison.pitch_accuracy}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  Note Matching
                </span>

                <strong>
                  {
                    Math.round(
                      comparison.note_match
                    )
                  }
                  %
                </strong>

                <div className="metric-bar">

                  <span
                    style={{
                      width: `${comparison.note_match}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  Timing Accuracy
                </span>

                <strong>
                  {
                    Math.round(
                      comparison.timing_accuracy ??
                      0
                    )
                  }
                  %
                </strong>

                <div className="metric-bar">

                  <span
                    style={{
                      width: `${comparison.timing_accuracy ?? 0}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  Stability
                </span>

                <strong>
                  {
                    Math.round(
                      comparison.stability
                    )
                  }
                  %
                </strong>

                <div className="metric-bar">

                  <span
                    style={{
                      width: `${comparison.stability}%`,
                    }}
                  />

                </div>

              </div>


              <div className="metric-card">

                <span>
                  Avg Pitch Error
                </span>

                <strong>
                  {
                    Math.round(
                      comparison.average_pitch_error_cents
                    )
                  }
                  ¢
                </strong>

              </div>

            </div>


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
