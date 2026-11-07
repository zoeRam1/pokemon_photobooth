import { useCallback, useEffect, useRef, useState } from "react";

export type CamStatus = "starting" | "live" | "error";

/** Opens the front camera while the calling component is mounted. */
export function useCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const tokenRef = useRef(0);
  const [status, setStatus] = useState<CamStatus>("starting");
  const [error, setError] = useState("");

  const stop = useCallback(() => {
    tokenRef.current++;
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const start = useCallback(async () => {
    stop();
    const token = ++tokenRef.current;
    setStatus("starting");
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("error"); setError("This browser can't open a live camera here.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } }, audio: false,
      });
      if (token !== tokenRef.current) { stream.getTracks().forEach(t => t.stop()); return; }
      streamRef.current = stream;
      const v = videoRef.current;
      if (v) { v.srcObject = stream; await v.play().catch(() => undefined); }
      setStatus("live");
    } catch (e) {
      if (token !== tokenRef.current) return;
      setStatus("error");
      setError((e as DOMException)?.name === "NotAllowedError"
        ? "Camera access was blocked. Use “Phone camera” or “Upload photos” below, or allow the camera and try again."
        : "No live camera is available here. Use “Phone camera” or “Upload photos” below instead.");
    }
  }, [stop]);

  useEffect(() => { void start(); return stop; }, [start, stop]);

  return { videoRef, status, error, retry: start };
}
