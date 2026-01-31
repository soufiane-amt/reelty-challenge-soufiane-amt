import { Composition } from "remotion";
import { MyComposition, MyCompositionProps } from "./composition";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition<MyCompositionProps, any>
      id="MyComp"
      component={MyComposition}
      durationInFrames={300}
      fps={30}
      width={1080}
      height={1920}
      defaultProps={{ clips: [], texts: [] }}
    />
  );
};
