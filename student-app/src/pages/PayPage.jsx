import { useState, lazy, Suspense } from "react";
import { usePayMerchant, PAY_STATUS } from "../hooks/usePayMerchant";

// Lazy-load scanner to avoid SSR camera-API crash (critical for Next.js)
// For Next.js use next/dynamic instead:
//   const QRScanner = dynamic(() => import("../components/QRScanner"), { ssr: false });
const QRScanner = lazy(() => import("../components/QRScanner"));

/**
 * PayPage
 *
 * Top-level student payment page. Orchestrates:
 *   QRScanner  →  usePayMerchant hook  →  success / error screen
 */
export default function PayPage() {
  // "scan" | "confirm" | "paying" | "success" | "error"
  const [phase,       setPhase]       = useState("scan");
  const [paymentData, setPaymentData] = useState(null);

  const { pay, status, txHash, error, reset } = usePayMerchant();

  // ── QRScanner calls this once a valid QR is decoded + amount confirmed ────
  const handleProceedToPay = async (data) => {
    setPaymentData(data);
    setPhase("paying");
    await pay({
      merchant: data.merchant,
      festId:   data.festId,
      amount:   data.amount,
    });
    // Status is updated reactively by the hook; derive phase from it
    setPhase("done");
  };

  // ── Restart the whole flow ────────────────────────────────────────────────
  const handleRetry = () => {
    reset();
    setPaymentData(null);
    setPhase("scan");
  };

  // ─── Render ──────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-indigo-950 to-gray-950">

      {/* ── Scan phase: hand off entirely to QRScanner ─────────────────── */}
      {phase === "scan" && (
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center text-gray-400 text-sm">
              Loading camera…
            </div>
          }
        >
          <QRScanner onProceedToPay={handleProceedToPay} />
        </Suspense>
      )}

      {/* ── Paying / confirming phase ──────────────────────────────────── */}
      {phase === "paying" && (
        <StatusScreen
          status={status}
          paymentData={paymentData}
          onCancel={handleRetry}
        />
      )}

      {/* ── Done: success or error ─────────────────────────────────────── */}
      {phase === "done" && status === PAY_STATUS.SUCCESS && (
        <SuccessScreen
          paymentData={paymentData}
          txHash={txHash}
          onDone={handleRetry}
        />
      )}

      {phase === "done" && status === PAY_STATUS.ERROR && (
        <ErrorScreen error={error} onRetry={handleRetry} />
      )}
    </div>
  );
}

// ─── Sub-screens ──────────────────────────────────────────────────────────────

/** Spinner screen shown while the tx is in flight */
function StatusScreen({ status, paymentData, onCancel }) {
  const LABELS = {
    [PAY_STATUS.CONNECTING]:  "Connecting wallet…",
    [PAY_STATUS.APPROVING]:   "Approving FEST spend…",
    [PAY_STATUS.PAYING]:      "Sending payment…",
    [PAY_STATUS.CONFIRMING]:  "Waiting for confirmation…",
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 p-8">
      {/* Spinner */}
      <div className="relative h-20 w-20">
        <div className="absolute inset-0 rounded-full border-4 border-indigo-900" />
        <div className="absolute inset-0 animate-spin rounded-full border-4 border-indigo-400 border-t-transparent" />
        <div className="absolute inset-0 flex items-center justify-center text-2xl">💳</div>
      </div>

      <div className="text-center">
        <p className="text-lg font-semibold text-white">
          {LABELS[status] ?? "Processing…"}
        </p>
        {paymentData && (
          <p className="mt-1 text-sm text-gray-400">
            {paymentData.amount} FEST → {paymentData.merchant?.slice(0, 6)}…{paymentData.merchant?.slice(-4)}
          </p>
        )}
      </div>

      {/* Step indicators */}
      <div className="flex gap-3">
        {[PAY_STATUS.CONNECTING, PAY_STATUS.APPROVING, PAY_STATUS.PAYING, PAY_STATUS.CONFIRMING].map((s, i) => (
          <div
            key={s}
            className={`h-2 w-8 rounded-full transition-colors ${
              status === s
                ? "animate-pulse bg-indigo-400"
                : Object.values(PAY_STATUS).indexOf(status) > i
                  ? "bg-emerald-500"
                  : "bg-gray-700"
            }`}
          />
        ))}
      </div>

      <button
        onClick={onCancel}
        className="text-xs text-gray-600 underline underline-offset-2 hover:text-gray-400"
      >
        Cancel
      </button>
    </div>
  );
}

/** Full-screen success confirmation */
function SuccessScreen({ paymentData, txHash, onDone }) {
  const explorerBase = "https://sepolia.basescan.org/tx/";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8">
      {/* Checkmark animation */}
      <div className="flex h-24 w-24 animate-[scaleIn_0.3s_ease] items-center justify-center rounded-full bg-emerald-500/15 text-5xl ring-4 ring-emerald-500/30">
        ✓
      </div>

      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">Payment Sent!</h1>
        <p className="mt-1 text-sm text-gray-400">
          Your FEST tokens have been transferred.
        </p>
      </div>

      {/* Receipt card */}
      <div className="w-full max-w-xs rounded-2xl border border-white/10 bg-white/5 px-5 py-4 space-y-3 text-xs">
        <ReceiptRow label="Amount"   value={`${paymentData?.amount} FEST`} highlight />
        <ReceiptRow label="Merchant" value={`${paymentData?.merchant?.slice(0,6)}…${paymentData?.merchant?.slice(-4)}`} mono />
        <ReceiptRow label="Fest ID"  value={String(paymentData?.festId)} />
        <ReceiptRow label="Network"  value="Base Sepolia" />
        {txHash && (
          <div className="border-t border-white/10 pt-3">
            <a
              href={`${explorerBase}${txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between text-indigo-400 hover:text-indigo-300"
            >
              <span>View on BaseScan</span>
              <span>↗</span>
            </a>
          </div>
        )}
      </div>

      <button
        onClick={onDone}
        className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 hover:bg-indigo-500 active:scale-95"
      >
        Scan Another QR
      </button>
    </div>
  );
}

/** Error screen */
function ErrorScreen({ error, onRetry }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-red-500/10 text-4xl ring-4 ring-red-500/20">
        ✕
      </div>
      <div>
        <h2 className="text-xl font-bold text-white">Payment Failed</h2>
        <p className="mt-2 max-w-xs text-sm text-red-400">{error}</p>
      </div>
      <button
        onClick={onRetry}
        className="rounded-xl bg-indigo-600 px-8 py-3 text-sm font-semibold text-white hover:bg-indigo-500 active:scale-95"
      >
        Try Again
      </button>
    </div>
  );
}

// ── Tiny helpers ──────────────────────────────────────────────────────────────

function ReceiptRow({ label, value, highlight, mono }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-gray-500">{label}</span>
      <span className={`font-medium ${highlight ? "text-emerald-400" : "text-gray-200"} ${mono ? "font-mono" : ""}`}>
        {value}
      </span>
    </div>
  );
}
