"use client";

import { useEffect, useRef } from "react";
import Redoc from "redoc";

type RedocOptions = {
  theme: {
    colors: {
      primary: {
        main: string;
      };
    };
    typography: {
      fontFamily: string;
      fontSize: string;
      lineHeight: string;
    };
  };
  scrollYOffset: number;
  hideDownloadButton: boolean;
  expandResponses: string;
  pathInMiddlePanel: boolean;
  requiredPropsFirst: boolean;
};

export function RedocStandalone({ spec }: { spec: string }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const options: RedocOptions = {
      theme: {
        colors: {
          primary: {
            main: "#0d9488",
          },
        },
        typography: {
          fontFamily: "Inter, sans-serif",
          fontSize: "14px",
          lineHeight: "1.5",
        },
      },
      scrollYOffset: 0,
      hideDownloadButton: false,
      expandResponses: "200,201",
      pathInMiddlePanel: true,
      requiredPropsFirst: true,
    };

    const redocInit = Redoc as unknown as (
      element: HTMLElement,
      opts: { spec: string } & RedocOptions,
      context?: Record<string, unknown>,
    ) => void;

    redocInit(container, { spec, ...options }, {});

    return () => {
      if (container) {
        container.innerHTML = "";
      }
    };
  }, [spec]);

  return <div ref={containerRef} className="min-h-screen bg-white" />;
}
