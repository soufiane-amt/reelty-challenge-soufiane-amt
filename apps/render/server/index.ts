import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import cors from "cors";
import crypto from "crypto";

const app = express();
app.use(express.json());
app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../../app/public")));
app.use("/renders", express.static(path.join(__dirname, "../renders")));

const renderJobs = new Map<
  string,
  {
    status: "processing" | "done" | "error";
    progress: number;
    url?: string;
    error?: string;
  }
>();

app.get("/progress/:id", (req, res) => {
  const job = renderJobs.get(req.params.id);
  if (!job) return res.status(404).json({ error: "Job not found" });
  res.json(job);
});

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

    const id = crypto.randomUUID();
    renderJobs.set(id, { status: "processing", progress: 0 });

    res.json({ id });

    (async () => {
      try {
        const bundled = await bundle({
          entryPoint: path.join(__dirname, "../remotion/index.ts"),
        });

        const compositionId = "MyComp";
        const outputLocation = path.join(
          __dirname,
          `../renders/${Date.now()}.mp4`,
        );

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
          onProgress: ({ progress }) => {
            const job = renderJobs.get(id);
            if (job) job.progress = progress;
          },
        });

        const filename = path.basename(outputLocation);
        renderJobs.set(id, {
          status: "done",
          progress: 1,
          url: `http://localhost:3001/renders/${filename}`,
        });
      } catch (err) {
        console.error("Render background error:", err);
        renderJobs.set(id, {
          status: "error",
          progress: 0,
          error: (err as Error).message,
        });
      }
    })();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: (err as Error).message });
  }
});

app.listen(3001, () => {
  console.log("Render server running on 3001");
});
