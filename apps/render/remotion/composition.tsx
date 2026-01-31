import React from "react";
import { AbsoluteFill, Sequence, Video } from "remotion";

export interface Clip {
  id: string;
  url: string;
  duration: number;
}

export interface TextTrack {
  content: string;
  start: number;
  duration: number;
}

export interface MyCompositionProps {
  clips: Clip[];
  texts: TextTrack[];
}

export const MyComposition: React.FC<MyCompositionProps> = ({
  clips,
  texts,
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
            <Video src={clip.url} className="h-full w-full object-cover" />
          </Sequence>
        );
      })}

      {texts && texts.length > 0 && (
        <>
          {texts.map((text, index) => {
            const from = Math.round(text.start * 30);
            const durationInFrames = Math.round(text.duration * 30);
            console.log("Rendering text:", text.content, { from, durationInFrames });
            console.log ('durationInFrames :', durationInFrames)
            return (
              <Sequence
                key={`text-${index}`}
                from={from}
                durationInFrames={durationInFrames}
              >
                <AbsoluteFill className="flex items-center justify-center">
              <div               
              style={{
                fontSize: 80,
                color: "white",
                fontFamily: "sans-serif",
                textShadow: "0 0 10px black",
                textAlign: "center",
                fontWeight: "bold",
              }}
>
                    {text.content}
                  </div>
                </AbsoluteFill>
              </Sequence>
            );
          })}
        </>
      )}
    </AbsoluteFill>
  );
};
