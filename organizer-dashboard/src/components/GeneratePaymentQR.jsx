import { useMemo, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

/**
 * GeneratePaymentQR
 *
 * Renders a scannable QR code that encodes a FestPay payment request.
 * The student app decodes the JSON payload and calls FestPay.payMerchant().
 *
 * Props:
 *   merchantAddress {string}          - Ethereum address of the merchant/stall
 *   festId          {string | number} - Fest/event identifier (passed to the contract)
 *   amount          {number}          - (optional) Pre-filled FEST amount; student can
 *                                       override in the app if omitted (0 means "ask student")
 */
export default function GeneratePaymentQR({ merchantAddress, festId, amount = 0 }) {
  const svgRef = useRef(null);
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // ── Build the payload that gets encoded into the QR ──────────────────────
  const payload = useMemo(
    () =>
      JSON.stringify({
        action:   "pay_merchant",
        merchant: merchantAddress,
        festId:   festId,
        amount:   amount,
        chainId:  84532,          // Base Sepolia; swap to 8453 for mainnet
      }),
    [merchantAddress, festId, amount]
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  /** Truncate a 0x address for display: 0x1234…abcd */
  const shortAddress = (addr) =>
    addr ? `${addr.slice(0, 6)}…${addr.slice(-4)}` : "—";

  /** Copy the raw JSON payload to clipboard */
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(payload);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard access denied — silent fail */
    }
  };

  /**
   * Download the QR as a PNG.
   * We serialise the rendered SVG → Canvas → PNG blob.
   */
  const handleDownload = () => {
    setDownloading(true);
    const svgEl = svgRef.current?.querySelector("svg");
    if (!svgEl) { setDownloading(false); return; }

    const svgData   = new XMLSerializer().serializeToString(svgEl);
    const svgBlob   = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
    const url       = URL.createObjectURL(svgBlob);
    const img       = new Image();

    img.onload = () => {
      const canvas  = document.createElement("canvas");
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx     = canvas.getContext("2d");
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        const link   = document.createElement("a");
        link.href    = URL.createObjectURL(blob);
        link.download = `festpass-qr-${festId}-${shortAddress(merchantAddress)}.png`;
        link.click();
        setDownloading(false);
      }, "image/png");
    };
    img.src = url;
  };

  // ── Guard: render nothing if required props are missing ──────────────────
  if (!merchantAddress || !festId) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-dashed border-yellow-400/40 bg-yellow-400/5 p-8 text-sm text-yellow-400">
        ⚠️ Provide <code className="mx-1 rounded bg-yellow-400/10 px-1">merchantAddress</code> and{" "}
        <code className="ml-1 rounded bg-yellow-400/10 px-1">festId</code> props to generate a QR code.
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col items-center gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl backdrop-blur-md">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight text-white">
          Merchant QR Code
        </h2>
        <p className="mt-1 text-sm text-gray-400">
          Scan with Student App to pay
        </p>
      </div>

      {/* ── QR Code card ───────────────────────────────────────────────── */}
      <div
        ref={svgRef}
        className="rounded-2xl bg-white p-4 shadow-lg ring-4 ring-indigo-500/30 transition-shadow hover:ring-indigo-400/60"
      >
        <QRCodeSVG
          value={payload}
          size={220}
          level="H"                   /* High error-correction — survives partial damage */
          includeMargin={false}
          imageSettings={{            /* FestPass logo watermark in the centre */
            src: "/festpass-logo.png",
            height: 36,
            width:  36,
            excavate: true,
          }}
        />
      </div>

      {/* ── Meta pills ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap justify-center gap-2 text-xs">
        <MetaPill label="Merchant" value={shortAddress(merchantAddress)} color="indigo" />
        <MetaPill label="Fest ID"  value={String(festId)}                color="violet" />
        <MetaPill
          label="Amount"
          value={amount > 0 ? `${amount} FEST` : "Open amount"}
          color={amount > 0 ? "emerald" : "gray"}
        />
        <MetaPill label="Network" value="Base Sepolia (84532)" color="blue" />
      </div>

      {/* ── Raw payload (collapsible details) ────────────────────────── */}
      <details className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-xs text-gray-400">
        <summary className="cursor-pointer select-none font-medium text-gray-300 hover:text-white">
          View encoded payload
        </summary>
        <pre className="mt-3 overflow-x-auto whitespace-pre-wrap break-all font-mono text-[11px] leading-relaxed text-indigo-300">
          {JSON.stringify(JSON.parse(payload), null, 2)}
        </pre>
      </details>

      {/* ── Action buttons ─────────────────────────────────────────────── */}
      <div className="flex w-full gap-3">
        <button
          onClick={handleCopy}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/10 py-2.5 text-sm font-medium text-white transition hover:bg-white/20 active:scale-95"
        >
          {copied ? "✓ Copied!" : "Copy Payload"}
        </button>

        <button
          onClick={handleDownload}
          disabled={downloading}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 text-sm font-medium text-white shadow-md transition hover:bg-indigo-500 active:scale-95 disabled:opacity-60"
        >
          {downloading ? "Saving…" : "⬇ Download PNG"}
        </button>
      </div>

    </div>
  );
}

// ── Sub-component: labelled pill ─────────────────────────────────────────────

const COLOR_MAP = {
  indigo:  "bg-indigo-500/10  text-indigo-300  border-indigo-500/20",
  violet:  "bg-violet-500/10  text-violet-300  border-violet-500/20",
  emerald: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
  blue:    "bg-blue-500/10    text-blue-300    border-blue-500/20",
  gray:    "bg-gray-500/10    text-gray-400    border-gray-500/20",
};

function MetaPill({ label, value, color = "gray" }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono ${COLOR_MAP[color] ?? COLOR_MAP.gray}`}
    >
      <span className="opacity-60">{label}:</span>
      <span className="font-semibold">{value}</span>
    </span>
  );
}
