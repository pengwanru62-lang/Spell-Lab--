"use client";

import { useEffect, useState } from "react";

export function useWindowScale() {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      const nextScale = Math.min(
        1,
        window.innerWidth / 1440,
        window.innerHeight / 1080
      );
      setScale(Number.isFinite(nextScale) ? nextScale : 1);
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => {
      window.removeEventListener("resize", updateScale);
    };
  }, []);

  return scale;
}
