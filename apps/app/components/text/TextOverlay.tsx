import { useMemo } from "react";
import Lottie from "lottie-react";
import { replaceAnimationPlaceholder } from "@/lib/animation-utils";
import { TextTrack } from "@/types/types";

const TextOverlay = ({
  text,
  template,
  ratio,
}: {
  text: TextTrack;
  template: any;
  ratio: "portrait" | "landscape";
}) => {
  const animationData = useMemo(() => {
    return template?.content
      ? replaceAnimationPlaceholder(template.content, text.content)
      : null;
  }, [template, text.content]);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center px-4">
      {animationData ? (
        <div
          style={{
            transform: "scale(1.5) translateY(-50px)",
            width: "100%",
          }}
        >
          <Lottie
            animationData={animationData}
            loop={true}
            className="w-full"
            rendererSettings={{ preserveAspectRatio: "xMidYMin meet" }}
          />
        </div>
      ) : (
        <div
          className="text-center font-sans font-bold text-white drop-shadow-lg"
          style={{
            fontSize: ratio === "landscape" ? "4vw" : "5rem",
            textShadow: "0 2px 10px rgba(0,0,0,0.8)",
          }}
        >
          {text.content}
        </div>
      )}
    </div>
  );
};

export default TextOverlay;
