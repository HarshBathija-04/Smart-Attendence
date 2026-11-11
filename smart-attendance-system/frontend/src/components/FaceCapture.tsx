import clsx from "clsx";
import { Camera, CameraOff, ImageUp, RotateCw, ShieldAlert } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { fileToDataUrl, useCamera, type CameraState } from "../lib/useCamera";
import { Button } from "./ui";

/** Live camera viewport with a face guide, plus the permission / unavailable states. */
export function CameraView({
  videoRef,
  state,
  onRetry,
  scanning,
  overlay,
}: {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  state: CameraState;
  onRetry: () => void;
  scanning?: boolean;
  overlay?: ReactNode;
}) {
  return (
    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-ink">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className={clsx(
          "size-full -scale-x-100 object-cover transition-opacity",
          state === "ready" ? "opacity-100" : "opacity-0",
        )}
        aria-label="Camera preview"
      />
      {state === "ready" && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center" aria-hidden>
          <div className="relative h-[68%] w-[46%] rounded-[45%] border-2 border-dashed border-white/70">
            {scanning && (
              <div className="absolute inset-x-3 h-0.5 animate-scan rounded-full bg-accent shadow-[0_0_12px_rgb(var(--accent))]" />
            )}
          </div>
        </div>
      )}
      {state !== "ready" && (
        <div className="absolute inset-0 grid place-items-center p-6 text-center text-white/90">
          {state === "requesting" || state === "idle" ? (
            <div>
              <Camera className="mx-auto mb-3 size-8 animate-pulse" aria-hidden />
              <p className="text-sm">Waiting for camera permission…</p>
            </div>
          ) : (
            <div className="max-w-xs">
              {state === "denied" ? (
                <ShieldAlert className="mx-auto mb-3 size-8 text-accent" aria-hidden />
              ) : (
                <CameraOff className="mx-auto mb-3 size-8 text-accent" aria-hidden />
              )}
              <p className="font-medium">{state === "denied" ? "Camera access was blocked" : "No camera available"}</p>
              <p className="mt-1 text-sm text-white/70">
                {state === "denied"
                  ? "Allow camera access in your browser's site settings, then try again. You can also upload a photo."
                  : "Connect a camera or upload a clear, front-facing photo instead."}
              </p>
              <Button variant="secondary" size="sm" className="mt-4" onClick={onRetry}>
                <RotateCw className="size-4" aria-hidden /> Try again
              </Button>
            </div>
          )}
        </div>
      )}
      {overlay}
    </div>
  );
}

/** Lets the user take a photo with the camera or upload one; returns a JPEG data URL. */
export function FacePicker({ value, onChange }: { value: string | null; onChange: (img: string | null) => void }) {
  const [mode, setMode] = useState<"camera" | "upload">("camera");
  const { videoRef, state, capture, retry } = useCamera(mode === "camera" && !value);
  const fileRef = useRef<HTMLInputElement>(null);

  const onFile = async (file?: File) => {
    if (!file) return;
    try {
      onChange(await fileToDataUrl(file));
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div>
      <div
        role="group"
        aria-label="Photo source"
        className="mb-3 inline-flex rounded border border-line bg-sunken p-0.5 text-sm"
      >
        {(["camera", "upload"] as const).map((m) => (
          <button
            key={m}
            type="button"
            aria-pressed={mode === m}
            onClick={() => {
              setMode(m);
              onChange(null);
            }}
            className={clsx(
              "h-8 rounded-[5px] px-3 font-medium transition-colors",
              mode === m ? "bg-surface text-ink shadow-card" : "text-muted hover:text-ink",
            )}
          >
            {m === "camera" ? "Use camera" : "Upload photo"}
          </button>
        ))}
      </div>

      {value ? (
        <div className="space-y-3">
          <img src={value} alt="Captured face" className="aspect-[4/3] w-full rounded-lg object-cover" />
          <Button variant="secondary" size="sm" onClick={() => onChange(null)}>
            <RotateCw className="size-4" aria-hidden /> Retake
          </Button>
        </div>
      ) : mode === "camera" ? (
        <div className="space-y-3">
          <CameraView videoRef={videoRef} state={state} onRetry={retry} />
          <Button
            variant="secondary"
            size="sm"
            disabled={state !== "ready"}
            onClick={() => {
              const img = capture();
              if (img) onChange(img);
            }}
          >
            <Camera className="size-4" aria-hidden /> Capture photo
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            void onFile(e.dataTransfer.files[0]);
          }}
          className="flex aspect-[4/3] w-full flex-col items-center justify-center rounded-lg border-2 border-dashed border-line bg-sunken/50 p-6 text-center transition-colors hover:border-brand/50 hover:bg-brand-soft/40"
        >
          <ImageUp className="mb-3 size-8 text-brand" aria-hidden />
          <span className="font-medium">Choose a photo</span>
          <span className="mt-1 text-sm text-muted">JPEG, PNG or WebP with one face in good light</span>
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={(e) => {
          void onFile(e.target.files?.[0]);
          e.target.value = "";
        }}
      />
    </div>
  );
}
