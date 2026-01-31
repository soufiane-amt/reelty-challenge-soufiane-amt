import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import cors from "cors";

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../../app/public")));
app.use("/renders", express.static(path.join(__dirname, "../renders")));

app.post("/render", async (req, res) => {
  try {
    const { clips, texts, ratio } = req.body;

    if (texts && Array.isArray(texts)) {
      for (let i = 0; i < texts.length; i++) {
        for (let j = i + 1; j < texts.length; j++) {
          const t1 = texts[i];
          const t2 = texts[j];
          const start1 = t1.start;
          const end1 = t1.start + t1.duration;
          const start2 = t2.start;
          const end2 = t2.start + t2.duration;

          if (start1 < end2 && start2 < end1) {
            return res
              .status(400)
              .json({ error: "Text components cannot overlap" });
          }
        }
      }
    }

    const processedClips = clips?.map((clip: any) => {
      if (typeof clip.url === "string" && clip.url.startsWith("/")) {
        return {
          ...clip,
          url: `http://localhost:3001${clip.url}`,
        };
      }
      return clip;
    });

    console.log("Rendering with:", {
      clipsCount: processedClips?.length,
      textsCount: texts?.length,
      texts,
    });

    const bundled = await bundle({
      entryPoint: path.join(__dirname, "../remotion/index.ts"),
    });

    const compositionId = "MyComp";

    const outputLocation = path.join(__dirname, `../renders/${Date.now()}.mp4`);

    await renderMedia({
      composition: {
        id: compositionId,
        props: { clips: processedClips, texts },
        width: ratio === "landscape" ? 1920 : 1080,
        height: ratio === "landscape" ? 1080 : 1920,
        fps: 30,
        durationInFrames: Math.round(
          processedClips.reduce(
            (acc: number, clip: any) => acc + clip.duration,
            0,
          ) * 30,
        ),
      },
      serveUrl: bundled,
      codec: "h264",
      outputLocation,
    });

    const filename = path.basename(outputLocation);
    res.json({ url: `http://localhost:3001/renders/${filename}` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(3001, () => {
  console.log("Render server running on 3001");
});
