import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";

/**
 * QRScanner
 *
 * Student-facing component that:
 *  1. Opens the device camera and scans a FestPass QR code.
 *  2. Parses the payload JSON and stops the camera.
 *  3. Shows a "Confirm Payment" screen with an amount input fallback.
 *  4. Calls the `onProceedToPay(parsedData)` prop when the student taps "Proceed to Pay".
 *
 * Props:
 *   onProceedToPay {function} - Called with the final payment object:
 *                               { action, merchant, festId, amount, chainId }
 *
 * Required install:
 *   npm install html5-qrcode
 *
 * Note on Next.js: import this component with next/dynamic + { ssr: false }
 * because html5-qrcode accesses the browser camera API at mount time.
 *
 * Example (Next.js page):
 *   const QRScanner = dynamic(() => import("../components/QRScanner"), { ssr: false });
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const SCANNER_ELEMENT_ID = "festpass-qr-reader";

const CAMERA_CONFIG = {
  fps: 10,
  qrbox: { width: 240, height: 240 },
  aspectRatio: 1.0,
  rememberLastUsedCamera: true,
};

// ─── Component ────────────────────────────────────────────────────────────────

export default function QRScanner({ onProceedToPay }) {
  // ── State machine ──────────────────────────────────────────────────────────
  // "scanning"  → camera active, waiting for a QR hit
  // "confirm"   → QR decoded, showing payment confirmation UI
  // "error"     → unrecoverable camera / parse error
  const [phase, setPhase] = useState("scanning");

  const [parsedData,    setParsedData]    = useState(null);
  const [manualAmount,  setManualAmount]  = useState("");
  const [scanError,     setScanError]     = useState("");
  const [cameraError,   setCameraError]   = useState("");
  const [isStopping,    setIsStopping]    = useState(false);

  const scannerRef = useRef(null);   // Html5Qrcode instance

  // ── Start camera on mount ─────────────────────────────────────────────────
  useEffect(() => {
    const scanner = new Html5Qrcode(SCANNER_ELEMENT_ID);
    scannerRef.current = scanner;

    scanner
      .start(
        { facingMode: "environment" },   // rear camera on mobile
        CAMERA_CONFIG,
        onScanSuccess,
        /* onScanFailure — fires continuously while no QR detected; suppress */ () => {}
      )
      .catch((err) => {
        setCameraError(
          err?.message?.includes("Permission")
            ? "Camera permission denied. Please allow camera access and reload."
            : `Camera error: ${err?.message ?? String(err)}`
        );
        setPhase("error");
      });

    return () => {
      // Graceful cleanup: stop only if the scanner is still running
      scanner
        .stop()
        .catch(() => {/* already stopped — safe to ignore */});
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── QR success handler ────────────────────────────────────────────────────
  const onScanSuccess = useCallback(async (decodedText) => {
    // Prevent firing multiple times before the camera stops
    if (isStopping) return;
    setIsStopping(true);

    // Stop the camera immediately so the UI feels snappy
    try {
      await scannerRef.current?.stop();
    } catch {/* already stopped */}

    // Parse the JSON payload
    try {
      const data = JSON.parse(decodedText);

      // Validate: must be a FestPass pay_merchant action
      if (data?.action !== "pay_merchant" || !data?.merchant) {
        throw new Error("Not a valid FestPass payment QR code.");
      }

      setParsedData(data);
      setScanError("");
      setPhase("confirm");
    } catch (err) {
      setScanError(err.message || "Could not parse QR payload.");
      setIsStopping(false);
      // Restart the scanner so the student can try again
      scannerRef.current
        ?.start(
          { facingMode: "environment" },
          CAMERA_CONFIG,
          onScanSuccess,
          () => {}
        )
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isStopping]);

  // ── Reset: go back to scanning ────────────────────────────────────────────
  const handleRescan = async () => {
    setParsedData(null);
    setManualAmount("");
    setScanError("");
    setIsStopping(false);
    setPhase("scanning");

    try {
      await scannerRef.current?.start(
        { facingMode: "environment" },
        CAMERA_CONFIG,
        onScanSuccess,
        () => {}
      );
    } catch {/* camera may already be running */}
  };

  // ── Proceed to Pay ────────────────────────────────────────────────────────
  const handleProceed = () => {
    if (!parsedData) return;

    // Resolve final amount: QR value takes precedence; fall back to manual input
    const resolvedAmount =
      parsedData.amount && Number(parsedData.amount) > 0
        ? Number(parsedData.amount)
        : Number(manualAmount);

    if (resolvedAmount <= 0 || isNaN(resolvedAmount)) {
      setScanError("Please enter a valid amount greater than 0.");
      return;
    }

    onProceedToPay?.({
      ...parsedData,
      amount: resolvedAmount,
    });
  };

  // ── Derived flags ─────────────────────────────────────────────────────────
  const hasFixedAmount  = parsedData?.amount && Number(parsedData.amount) > 0;
  const shortAddress    = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950 p-4">
      <div className="w-full max-w-sm">

        {/* ── Card shell ────────────────────────────────────────────────── */}
        <div className="rounded-3xl border border-white/10 bg-white/5 shadow-2xl backdrop-blur-md">

          {/* ── Top bar ───────────────────────────────────────────────────── */}
          <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
            <div className="flex items-center gap-2">
              {/* Pulse dot — green while scanning, gray otherwise */}
              <span
                className={`inline-block h-2.5 w-2.5 rounded-full ${
                  phase === "scanning" ? "animate-pulse bg-emerald-400" : "bg-gray-500"
                }`}
              />
              <span className="text-sm font-semibold text-white">
                {phase === "scanning" ? "Scanning…" : "FestPass Pay"}
              </span>
            </div>

            {/* Chain badge */}
            <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-mono font-semibold text-blue-300">
              Base {parsedData?.chainId === 8453 ? "Mainnet" : "Sepolia"}
            </span>
          </div>

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE: scanning                                                */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === "scanning" && (
            <div className="flex flex-col items-center gap-4 p-6">
              <p className="text-center text-sm text-gray-400">
                Point your camera at the merchant's QR code
              </p>

              {/* Camera viewport ── html5-qrcode mounts into this div */}
              <div className="relative w-full overflow-hidden rounded-2xl bg-black">
                {/* Targeting overlay */}
                <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center">
                  <div className="h-56 w-56 rounded-2xl border-2 border-indigo-400/70 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
                    {/* Corner accents */}
                    <Corner pos="top-left"     />
                    <Corner pos="top-right"    />
                    <Corner pos="bottom-left"  />
                    <Corner pos="bottom-right" />
                  </div>
                </div>

                {/* html5-qrcode render target */}
                <div id={SCANNER_ELEMENT_ID} className="w-full" />
              </div>

              {/* Parse error (bad QR format) */}
              {scanError && (
                <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-center text-xs text-red-400">
                  {scanError}
                </p>
              )}
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE: confirm                                                 */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === "confirm" && parsedData && (
            <div className="flex flex-col gap-5 p-6">

              {/* Success badge */}
              <div className="flex flex-col items-center gap-1 py-2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/15 text-2xl">
                  ✓
                </div>
                <p className="text-sm font-semibold text-emerald-400">QR Scanned Successfully</p>
              </div>

              {/* Payment details card */}
              <div className="rounded-2xl border border-white/10 bg-white/5 px-5 py-4 space-y-3">
                <DetailRow label="Merchant"
                  value={
                    <span className="font-mono text-xs text-indigo-300" title={parsedData.merchant}>
                      {shortAddress(parsedData.merchant)}
                    </span>
                  }
                />
                <DetailRow label="Fest ID"  value={String(parsedData.festId)} />
                <DetailRow label="Chain"    value={`Base (${parsedData.chainId})`} />
                <div className="border-t border-white/10 pt-3">
                  <DetailRow
                    label="Amount"
                    value={
                      hasFixedAmount
                        ? <span className="text-base font-bold text-white">{parsedData.amount} FEST</span>
                        : <span className="text-xs text-yellow-400">Open — enter below</span>
                    }
                  />
                </div>
              </div>

              {/* Manual amount input — shown only when QR has no fixed amount */}
              {!hasFixedAmount && (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="manual-amount"
                    className="text-xs font-medium text-gray-400"
                  >
                    Enter amount (FEST)
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500">
                    <input
                      id="manual-amount"
                      type="number"
                      min="0.01"
                      step="0.01"
                      placeholder="e.g. 50"
                      value={manualAmount}
                      onChange={(e) => {
                        setManualAmount(e.target.value);
                        setScanError("");
                      }}
                      className="w-full bg-transparent text-sm text-white placeholder-gray-500 outline-none"
                    />
                    <span className="shrink-0 text-xs font-semibold text-indigo-300">FEST</span>
                  </div>
                  {scanError && (
                    <p className="text-xs text-red-400">{scanError}</p>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-3 pt-1">
                <button
                  onClick={handleRescan}
                  className="flex-1 rounded-xl border border-white/10 bg-white/10 py-3 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
                >
                  ↩ Re-scan
                </button>
                <button
                  onClick={handleProceed}
                  className="flex-1 rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:bg-indigo-500 active:scale-95"
                >
                  Proceed to Pay
                </button>
              </div>
            </div>
          )}

          {/* ═══════════════════════════════════════════════════════════════ */}
          {/* PHASE: error (camera unavailable)                              */}
          {/* ═══════════════════════════════════════════════════════════════ */}
          {phase === "error" && (
            <div className="flex flex-col items-center gap-4 p-8 text-center">
              <div className="text-4xl">📷</div>
              <p className="text-sm font-semibold text-red-400">{cameraError}</p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-indigo-500"
              >
                Reload & Retry
              </button>
            </div>
          )}

        </div>

        {/* Footer hint */}
        {phase === "scanning" && (
          <p className="mt-4 text-center text-[11px] text-gray-600">
            Payments are processed on Base via the FEST token smart contract.
          </p>
        )}
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

/** Labelled detail row */
function DetailRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs font-medium text-gray-200">{value}</span>
    </div>
  );
}

/**
 * Corner accent marks for the QR targeting overlay.
 * pos: "top-left" | "top-right" | "bottom-left" | "bottom-right"
 */
function Corner({ pos }) {
  const base = "absolute h-5 w-5 border-indigo-400";
  const styles = {
    "top-left":     "top-0 left-0 border-t-2 border-l-2 rounded-tl-lg",
    "top-right":    "top-0 right-0 border-t-2 border-r-2 rounded-tr-lg",
    "bottom-left":  "bottom-0 left-0 border-b-2 border-l-2 rounded-bl-lg",
    "bottom-right": "bottom-0 right-0 border-b-2 border-r-2 rounded-br-lg",
  };
  return <span className={`${base} ${styles[pos]}`} />;
}
