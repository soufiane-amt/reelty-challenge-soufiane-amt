import express from "express";
import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";
import cors from "cors";
import crypto from "crypto";
import fs from "fs";

const app = express();
app.use(express.json({ limit: "500mb" }));
app.use(cors());

app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../../app/public")));
app.use("/renders", express.static(path.join(__dirname, "../renders")));

const tempDir = path.join(__dirname, "../temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}
app.use("/temp", express.static(tempDir));

const RENDER_SERVER_URL =
  process.env.NEXT_PUBLIC_RENDER_SERVER_URL || "http://localhost:3001";

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
    const { clips, texts, ratio, templates } = req.body;

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

    const usedAnimationKeys = new Set(
      (texts || []).map((t: any) => t.animation).filter(Boolean),
    );
    const relevantTemplates = templates?.filter((t: any) =>
      usedAnimationKeys.has(t.key),
    );

    const processedClips = clips
      ? await Promise.all(
          clips.map(async (clip: any) => {
            if (typeof clip.url === "string") {
              if (clip.url.startsWith("data:")) {
                const [header, base64Data] = clip.url.split(",");
                if (header && base64Data) {
                  const type = header.match(/:(.*?);/)?.[1];
                  if (type) {
                    const data = Buffer.from(base64Data, "base64");
                    const extension = type.split("/")[1] || "mp4";
                    const filename = `${crypto.randomUUID()}.${extension}`;
                    const filePath = path.join(tempDir, filename);

                    await fs.promises.writeFile(filePath, data);

                    return {
                      ...clip,
                      url: `${RENDER_SERVER_URL}/temp/${filename}`,
                    };
                  }
                }
              } else if (clip.url.startsWith("/")) {
                return {
                  ...clip,
                  url: `${RENDER_SERVER_URL}${clip.url}`,
                };
              }
            }
            return clip;
          }),
        )
      : clips;

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
            props: {
              clips: processedClips,
              texts,
              templates: relevantTemplates,
            },
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
          url: `${RENDER_SERVER_URL}/renders/${filename}`,
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
