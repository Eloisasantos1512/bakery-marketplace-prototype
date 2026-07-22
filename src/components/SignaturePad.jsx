import React, { useRef, forwardRef, useImperativeHandle, useState } from "react";

/**
 * SignaturePad — canvas simples de assinatura, sem dependência externa.
 * Exposto via ref: { getDataUrl(), clear(), isEmpty() }
 *
 * Uso:
 *   const sigRef = useRef(null);
 *   <SignaturePad ref={sigRef} />
 *   ...
 *   const signature = sigRef.current.getDataUrl(); // base64 PNG
 */
const SignaturePad = forwardRef(function SignaturePad(_, ref) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const [hasDrawn, setHasDrawn] = useState(false);

  useImperativeHandle(ref, () => ({
    getDataUrl: () => canvasRef.current.toDataURL("image/png"),
    isEmpty: () => !hasDrawn,
    clear: () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasDrawn(false);
    },
  }));

  const getPos = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const point = e.touches ? e.touches[0] : e;
    return {
      x: ((point.clientX - rect.left) / rect.width) * canvas.width,
      y: ((point.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (e) => {
    e.preventDefault();
    drawingRef.current = true;
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const move = (e) => {
    if (!drawingRef.current) return;
    e.preventDefault();
    const { x, y } = getPos(e);
    const ctx = canvasRef.current.getContext("2d");
    ctx.lineTo(x, y);
    ctx.strokeStyle = "#2B2620";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.stroke();
    setHasDrawn(true);
  };

  const end = () => {
    drawingRef.current = false;
  };

  return (
    <canvas
      ref={canvasRef}
      width={500}
      height={180}
      className="w-full rounded-lg touch-none"
      style={{ background: "#F1EADA", border: "1px solid #D9C79E" }}
      onMouseDown={start}
      onMouseMove={move}
      onMouseUp={end}
      onMouseLeave={end}
      onTouchStart={start}
      onTouchMove={move}
      onTouchEnd={end}
    />
  );
});

export default SignaturePad;
