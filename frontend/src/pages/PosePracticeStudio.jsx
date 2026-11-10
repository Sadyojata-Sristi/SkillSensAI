import { useCallback, useEffect, useRef, useState } from "react";
import { FilesetResolver, PoseLandmarker } from "@mediapipe/tasks-vision";
import { Camera, Upload, X, Maximize2, Minimize2, ScanLine } from "lucide-react";
import "./PosePracticeStudio.css";

// The JavaScript package is bundled locally by Vite. WASM and the model are fetched
// from public CDNs so the repository does not need extra binary model/WASM files.
const VISION_WASM_PATH = "https://unpkg.com/@mediapipe/tasks-vision@1.2.2/wasm";
const POSE_MODEL_PATH =
  "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";

async function loadPoseRuntime() {
  if (window.__skillsensaiPoseRuntime) return window.__skillsensaiPoseRuntime;
  window.__skillsensaiPoseRuntime = (async () => {
    const fileset = await FilesetResolver.forVisionTasks(VISION_WASM_PATH);
    const options = {
      runningMode: "VIDEO",
      numPoses: 1,
      minPoseDetectionConfidence: 0.5,
      minPosePresenceConfidence: 0.5,
      minTrackingConfidence: 0.5,
    };
    try {
      return await PoseLandmarker.createFromOptions(fileset, {
        ...options,
        baseOptions: { modelAssetPath: POSE_MODEL_PATH, delegate: "GPU" },
      });
    } catch (gpuError) {
      console.warn("GPU pose initialization failed; retrying on CPU.", gpuError);
      return await PoseLandmarker.createFromOptions(fileset, {
        ...options,
        baseOptions: { modelAssetPath: POSE_MODEL_PATH, delegate: "CPU" },
      });
    }
  })();
  try {
    return await window.__skillsensaiPoseRuntime;
  } catch (error) {
    window.__skillsensaiPoseRuntime = null;
    throw error;
  }
}

const JOINTS = [0, 11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32];
const CONNECTIONS = [[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[24,26],[26,28],[27,29],[27,31],[28,30],[28,32]];

export default function PosePracticeStudio({ discipline = "boxing" }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const poseRef = useRef(null);
  const streamRef = useRef(null);
  const recorderRef = useRef(null);
  const chunksRef = useRef([]);
  const rafRef = useRef(0);
  const busyRef = useRef(false);
  const lastLandmarksRef = useRef(null);
  const [recording, setRecording] = useState(false);
  const [stream, setStream] = useState(null);
  const [videoUrl, setVideoUrl] = useState("");
  const [videoName, setVideoName] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [loadingPose, setLoadingPose] = useState(false);
  const [poseStatus, setPoseStatus] = useState("Ready — start recording or upload a video.");
  const [feedback, setFeedback] = useState("");
  const [feedbackScore, setFeedbackScore] = useState(null);
  const [poseStats, setPoseStats] = useState({ visible: 0, frames: 0, shoulderTilt: null, torsoLean: null });
  const isBoxing = discipline === "boxing";

  const stopLoop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = 0;
    busyRef.current = false;
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const drawPose = useCallback((landmarks, width, height) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const w = Math.max(1, width || videoRef.current?.videoWidth || 640);
    const h = Math.max(1, height || videoRef.current?.videoHeight || 360);
    if (canvas.width !== w || canvas.height !== h) { canvas.width = w; canvas.height = h; }
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, w, h);
    if (!landmarks) return;
    const visible = (i) => landmarks[i] && (landmarks[i].visibility ?? 1) > 0.35;
    ctx.lineWidth = Math.max(2, w / 260);
    ctx.strokeStyle = "rgba(52, 211, 153, .9)";
    CONNECTIONS.forEach(([a,b]) => {
      if (!visible(a) || !visible(b)) return;
      ctx.beginPath(); ctx.moveTo(landmarks[a].x*w, landmarks[a].y*h); ctx.lineTo(landmarks[b].x*w, landmarks[b].y*h); ctx.stroke();
    });
    JOINTS.forEach((i) => {
      if (!visible(i)) return;
      const p = landmarks[i]; const r = i === 0 ? Math.max(5, w/100) : Math.max(4, w/125);
      ctx.beginPath(); ctx.arc(p.x*w, p.y*h, r, 0, Math.PI*2);
      ctx.fillStyle = i === 0 ? "#fbbf24" : "#38bdf8"; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = "rgba(255,255,255,.95)"; ctx.stroke();
    });
  }, []);

  const handlePoseResults = useCallback((results) => {
    const video = videoRef.current;
    const landmarks = results?.landmarks?.[0] || null;
    drawPose(landmarks, video?.videoWidth, video?.videoHeight);
    if (!landmarks) {
      setPoseStatus("No full-body pose detected yet — step back and keep your head, shoulders, hips and feet visible.");
      return;
    }
    lastLandmarksRef.current = landmarks;
    const visibleCount = JOINTS.filter(i => (landmarks[i]?.visibility ?? 1) > 0.35).length;
    const leftShoulder = landmarks[11], rightShoulder = landmarks[12];
    const shoulderTilt = leftShoulder && rightShoulder ? Math.abs(leftShoulder.y - rightShoulder.y) : null;
    const midShoulderX = leftShoulder && rightShoulder ? (leftShoulder.x + rightShoulder.x) / 2 : null;
    const midShoulderY = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) / 2 : null;
    const leftHip = landmarks[23], rightHip = landmarks[24];
    const midHipX = leftHip && rightHip ? (leftHip.x + rightHip.x) / 2 : null;
    const midHipY = leftHip && rightHip ? (leftHip.y + rightHip.y) / 2 : null;
    const torsoLean = midShoulderX !== null && midHipX !== null ? Math.abs(midShoulderX-midHipX) : null;
    setPoseStats(old => ({ visible: visibleCount, frames: old.frames + 1, shoulderTilt, torsoLean }));
    setPoseStatus(visibleCount >= 12 ? "Pose detected — blue dots mark joints; green lines show body alignment." : "Partial pose detected — move back so more joints are visible.");
  }, [drawPose]);

  const ensurePose = useCallback(async () => {
    if (poseRef.current) return poseRef.current;
    setLoadingPose(true);
    try {
      const pose = await loadPoseRuntime();
      poseRef.current = pose;
      return pose;
    } finally { setLoadingPose(false); }
  }, [handlePoseResults]);

  const startLoop = useCallback(async () => {
    stopLoop();
    try {
      const pose = await ensurePose();
      const tick = async () => {
        const video = videoRef.current;
        if (!video || video.readyState < 2 || video.paused || video.ended) {
          rafRef.current = requestAnimationFrame(tick); return;
        }
        if (!busyRef.current) {
          busyRef.current = true;
          try { handlePoseResults(pose.detectForVideo(video, performance.now())); } catch (error) { console.warn("Pose frame skipped:", error); }
          busyRef.current = false;
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      setPoseStatus("Pose model ready — looking for your body position.");
    } catch (error) {
      console.error("SkillSensAI pose model failed to initialize:", error);
      setPoseStatus(`Pose model could not load (${error?.message || "network or model error"}). Check your connection, then refresh the page. Recording and upload still work.`);
    }
  }, [ensurePose, stopLoop, handlePoseResults]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (stream) {
      video.srcObject = stream;
      video.play().catch(() => {});
      startLoop();
    } else if (videoUrl) {
      video.srcObject = null;
      video.src = videoUrl;
      video.onloadeddata = () => { if (video.paused) video.play().catch(() => {}); startLoop(); };
    } else {
      stopLoop(); clearCanvas();
    }
  }, [stream, videoUrl, startLoop, stopLoop, clearCanvas]);

  useEffect(() => () => {
    stopLoop();
    if (streamRef.current) streamRef.current.getTracks().forEach(track => track.stop());
    if (poseRef.current) poseRef.current.close?.();
  }, [stopLoop]);

  useEffect(() => () => {
    if (videoUrl.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || typeof MediaRecorder === "undefined") {
      setFeedback("This browser cannot record video here. Use a modern browser on HTTPS or upload a video instead."); return;
    }
    try {
      if (videoUrl.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
      setVideoUrl(""); setVideoName(""); setFeedback(""); setFeedbackScore(null); setPoseStats({ visible: 0, frames: 0, shoulderTilt: null, torsoLean: null }); lastLandmarksRef.current = null;
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } }, audio: true });
      streamRef.current = media; setStream(media);
      const options = MediaRecorder.isTypeSupported("video/webm;codecs=vp9,opus") ? { mimeType: "video/webm;codecs=vp9,opus" } : {};
      const recorder = new MediaRecorder(media, options); chunksRef.current = [];
      recorder.ondataavailable = e => { if (e.data?.size) chunksRef.current.push(e.data); };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "video/webm" });
        if (blob.size) {
          const url = URL.createObjectURL(blob); setVideoUrl(url); setVideoName("Live practice recording.webm");
          setFeedback("Recording saved. Pose dots were shown during the live preview. Use the quick review below for basic posture feedback; this is an early estimate, not a coach-certified score.");
        } else setFeedback("No video data was captured. Please try recording again.");
        stopLoop(); media.getTracks().forEach(track => track.stop());
        if (streamRef.current === media) streamRef.current = null;
        setStream(null); setRecording(false); setExpanded(false);
      };
      recorder.onerror = () => setFeedback("The recording ran into a browser error. Please try again.");
      recorderRef.current = recorder; recorder.start(250); setRecording(true); setExpanded(true);
      setPoseStatus("Camera on — keep your full body in view. Loading free pose tracking…");
      startLoop();
    } catch (error) {
      setFeedback(error?.name === "NotAllowedError" ? "Camera permission was denied. Allow camera access in browser settings or upload a video." : "Could not open the camera. Check that it is not being used by another app.");
      setRecording(false); setExpanded(false);
    }
  };

  const stopRecording = () => {
    if (recorderRef.current && recorderRef.current.state !== "inactive") recorderRef.current.stop();
  };

  const uploadVideo = (event) => {
    const file = event.target.files?.[0]; event.target.value = ""; if (!file) return;
    if (!file.type.startsWith("video/")) { setFeedback("Please choose a video file."); return; }
    if (videoUrl.startsWith("blob:")) URL.revokeObjectURL(videoUrl);
    stopLoop(); setStream(null); setVideoUrl(URL.createObjectURL(file)); setVideoName(file.name); setRecording(false); setExpanded(false);
    setPoseStats({ visible: 0, frames: 0, shoulderTilt: null, torsoLean: null }); lastLandmarksRef.current = null;
    setFeedbackScore(null); setFeedback("Video loaded. Press play to track joints, then select ‘Give me feedback’ for a basic posture review and score out of 100.");
  };

  const giveFeedback = () => {
    const p = lastLandmarksRef.current;
    if (!p) {
      setFeedbackScore(null);
      setFeedback("I couldn't detect a clear body pose yet. Play the video and make sure your head, shoulders, hips and legs are visible with good lighting. This local model works best with one person in frame."); return;
    }
    const visible = JOINTS.filter(i => (p[i]?.visibility ?? 1) > 0.35).length;
    const shoulderTilt = Math.abs((p[11]?.y ?? 0) - (p[12]?.y ?? 0));
    const hipTilt = Math.abs((p[23]?.y ?? 0) - (p[24]?.y ?? 0));
    const shoulderMid = ((p[11]?.x ?? 0) + (p[12]?.x ?? 0)) / 2;
    const hipMid = ((p[23]?.x ?? 0) + (p[24]?.x ?? 0)) / 2;
    const torsoOffset = Math.abs(shoulderMid - hipMid);

    // A transparent, heuristic snapshot score; it is not a trained technique assessment.
    const visibilityPoints = Math.round((visible / JOINTS.length) * 25);
    const shoulderPoints = shoulderTilt < 0.03 ? 25 : shoulderTilt < 0.07 ? 17 : shoulderTilt < 0.12 ? 9 : 3;
    const hipPoints = hipTilt < 0.03 ? 20 : hipTilt < 0.07 ? 14 : hipTilt < 0.12 ? 7 : 2;
    const alignmentPoints = torsoOffset < 0.05 ? 30 : torsoOffset < 0.09 ? 24 : torsoOffset < 0.12 ? 16 : torsoOffset < 0.18 ? 9 : 3;
    const score = Math.max(0, Math.min(100, visibilityPoints + shoulderPoints + hipPoints + alignmentPoints));
    setFeedbackScore(score);

    const tips = [];
    if (visible < 13) tips.push("Step farther back and keep your full body, including feet, inside the frame.");
    else tips.push("Most key joints are visible — good camera positioning.");
    if (shoulderTilt > 0.07) tips.push("Your shoulders look uneven in this frame; relax them and recheck your stance.");
    else tips.push("Your shoulders look fairly level in this frame.");
    if (hipTilt > 0.07) tips.push("Your hips look uneven in this frame; check your balance and stance.");
    else tips.push("Your hips look fairly level in this frame.");
    if (torsoOffset > 0.12) tips.push("Your torso appears shifted sideways in this frame; check balance and weight distribution.");
    else tips.push("Your shoulder and hip centres look reasonably aligned in this frame.");
    tips.push(isBoxing ? "Boxing reminder: keep your hands near guard and return to guard after each punch." : "Karate reminder: keep a stable base and return to a balanced ready position after each technique.");
    tips.push("Score basis: visible joints (25), shoulder level (25), hip level (20), and shoulder-to-hip alignment (30). This is a basic single-frame posture estimate, not a coach-certified technique score. Camera angle and movement phase can affect it.");
    setFeedback(tips.join(" "));
  };

  return (
    <section className={`pose-studio ${expanded ? "pose-studio-expanded" : ""}`}>
      <div className="pose-studio-heading"><div><span className="pose-studio-kicker"><ScanLine size={15}/> FREE POSE PREVIEW</span><h3>Record or upload your practice</h3><p>Joint dots and a simple posture check run locally in your browser. No paid AI token is needed.</p></div>
        {expanded && <button className="pose-studio-button pose-exit" onClick={() => setExpanded(false)}><Minimize2 size={16}/> Exit full view</button>}
      </div>
      <div className={`pose-video-shell ${recording ? "is-recording" : ""}`}>
        <video ref={videoRef} className="pose-video" muted={Boolean(stream)} playsInline controls={!recording && Boolean(videoUrl)} onPlay={() => { if (!stream) startLoop(); }} onPause={() => { if (!stream) stopLoop(); }} />
        <canvas ref={canvasRef} className="pose-overlay" aria-label="Detected body joint overlay" />
        {!stream && !videoUrl && <div className="pose-empty"><Camera size={42}/><strong>Practice video preview</strong><span>Your head, shoulders, elbows, wrists, hips, knees and ankles will be marked here.</span></div>}
        {recording && <span className="pose-recording-pill"><i/> RECORDING</span>}
        {videoUrl && !recording && <button className="pose-expand-button" onClick={() => setExpanded(true)}><Maximize2 size={16}/> Expand video</button>}
      </div>
      <p className="pose-status" role="status">{loadingPose ? "Loading free pose model… " : ""}{poseStatus}</p>
      <div className="pose-studio-actions">
        {!recording ? <button className="pose-studio-button pose-primary" onClick={startRecording}><Camera size={17}/> Record live</button> : <button className="pose-studio-button pose-stop" onClick={stopRecording}><X size={17}/> Stop recording</button>}
        <label className="pose-studio-button pose-secondary"><Upload size={17}/> Upload video<input type="file" accept="video/*" onChange={uploadVideo} hidden/></label>
        {videoUrl && !recording && <button className="pose-studio-button pose-primary" onClick={giveFeedback}>Give me feedback</button>}
      </div>
      {videoName && <p className="pose-file-name">Selected: {videoName}</p>}
      <div className="pose-legend"><span><i className="pose-dot-blue"/> Detected joints</span><span><i className="pose-line-green"/> Body alignment</span><span><i className="pose-dot-yellow"/> Head</span></div>
      {videoUrl && !recording && <div className="pose-stats"><span><b>{poseStats.visible}/17</b><small>key points visible in latest frame</small></span><span><b>{poseStats.frames}</b><small>frames checked this playback</small></span></div>}
      {feedback && <div className="pose-feedback">
        <strong>SkillSensAI practice feedback</strong>
        {feedbackScore !== null && <div className="pose-score-card" aria-label={`Posture snapshot score ${feedbackScore} out of 100`}>
          <div className="pose-score-number">{feedbackScore}<span>/100</span></div>
          <div className="pose-score-copy"><b>Posture snapshot score</b><small>{feedbackScore >= 85 ? "Strong snapshot — keep practising consistently." : feedbackScore >= 70 ? "Good start — review the tips below." : feedbackScore >= 50 ? "Developing — adjust your stance and camera position." : "Needs another try — check visibility and body alignment."}</small></div>
        </div>}
        <p>{feedback}</p>
      </div>}
      <p className="pose-disclaimer">Early prototype: joint tracking and feedback are approximate. It does not certify technique, detect injury risk, or replace an instructor. Use a clear space and practise slowly.</p>
    </section>
  );
}
