import React, { useMemo } from "react";
import { AbsoluteFill, Sequence, OffthreadVideo } from "remotion";
import { Lottie } from "@remotion/lottie";

export interface Clip {
  id: string;
  url: string;
  duration: number;
}

export interface TextTrack {
  content: string;
  start: number;
  duration: number;
  animation?: string;
}

export interface MyCompositionProps {
  clips: Clip[];
  texts: TextTrack[];
  templates?: any[];
}

function replaceAnimationPlaceholder(animationData: any, text: string) {
  const jsonString = JSON.stringify(animationData);
  if (!jsonString.includes("{{content}}")) return animationData;
  const cloned = structuredClone
    ? structuredClone(animationData)
    : JSON.parse(JSON.stringify(animationData));
  const replaceInObject = (obj: any): any => {
    if (typeof obj === "string") return obj.replace(/\{\{content\}\}/g, text);
    if (Array.isArray(obj)) return obj.map(replaceInObject);
    if (obj && typeof obj === "object") {
      const result: any = {};
      for (const key in obj) result[key] = replaceInObject(obj[key]);
      return result;
    }
    return obj;
  };
  return replaceInObject(cloned);
}

const TextLayer: React.FC<{ text: TextTrack; template: any }> = ({
  text,
  template,
}) => {
  const animationData = useMemo(() => {
    if (!template?.content) return null;
    return replaceAnimationPlaceholder(template.content, text.content);
  }, [template, text.content]);

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {animationData ? (
        <div
          style={{
            transform: "scale(1.5) translateY(-25%)",
            width: "80%",
          }}
        >
          <Lottie
            animationData={animationData}
            loop
            rendererSettings={{ preserveAspectRatio: "xMidYMin meet" }}
          />
        </div>
      ) : (
        <div
          style={{
            fontSize: 80,
            color: "white",
            fontFamily: "sans-serif",
            textShadow: "0 0 10px black",
            textAlign: "center",
            fontWeight: "bold",
            marginTop: "-500px",
          }}
        >
          {text.content}
        </div>
      )}
    </AbsoluteFill>
  );
};
export const MyComposition: React.FC<MyCompositionProps> = ({
  clips,
  texts,
  templates,
}) => {
  let accumulatedTime = 0;

  return (
    <AbsoluteFill className="bg-black">
      {clips.map((clip) => {
        const from = Math.round(accumulatedTime * 30);
        const durationInFrames = Math.round(clip.duration * 30);
        accumulatedTime += clip.duration;

        return (
          <Sequence
            key={clip.id}
            from={from}
            durationInFrames={durationInFrames}
          >
            <OffthreadVideo
              src={clip.url}
              className="h-full w-full object-cover"
            />
          </Sequence>
        );
      })}

      {texts && texts.length > 0 && (
        <>
          {texts.map((text, index) => {
            const from = Math.round(text.start * 30);
            const durationInFrames = Math.round(text.duration * 30);

            const template = templates?.find((t) => t.key === text.animation);

            return (
              <Sequence
                key={`text-${index}`}
                from={from}
                durationInFrames={durationInFrames}
              >
                <TextLayer text={text} template={template} />
              </Sequence>
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};
