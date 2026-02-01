import { describe, it, expect } from "vitest";
import { replaceAnimationPlaceholder } from "./animation-utils";

describe("replaceAnimationPlaceholder", () => {
  it("should replace {{content}} with provided text in a simple object", () => {
    const data = { text: "Hello {{content}}" };
    const result = replaceAnimationPlaceholder(data, "World");
    expect(result).toEqual({ text: "Hello World" });
  });

  it("should replace {{content}} in nested objects", () => {
    const data = {
      layer: {
        shapes: [
          {
            name: "Shape {{content}}",
            properties: {
              title: "{{content}} Title",
            },
          },
        ],
      },
    };
    const result = replaceAnimationPlaceholder(data, "Test");
    expect(result).toEqual({
      layer: {
        shapes: [
          {
            name: "Shape Test",
            properties: {
              title: "Test Title",
            },
          },
        ],
      },
    });
  });

  it("should return original object if {{content}} is not present", () => {
    const data = { text: "Hello World" };
    const result = replaceAnimationPlaceholder(data, "Test");
    expect(result).toBe(data);
  });

  it("should handle arrays correctly", () => {
    const data = ["{{content}}", "Fixed"];
    const result = replaceAnimationPlaceholder(data, "Item");
    expect(result).toEqual(["Item", "Fixed"]);
  });
});
