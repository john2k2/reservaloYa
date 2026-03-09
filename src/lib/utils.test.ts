import { describe, it, expect } from "vitest";
import { cn, slugify, humanizeSlug } from "./utils";

describe("cn (className utility)", () => {
  it("should merge class names correctly", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("should handle conditional classes", () => {
    expect(cn("foo", false && "bar", "baz")).toBe("foo baz");
  });

  it("should merge tailwind classes correctly", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });
});

describe("slugify", () => {
  it("should convert text to slug", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("should handle accents", () => {
    expect(slugify("Café de México")).toBe("cafe-de-mexico");
  });

  it("should handle multiple spaces", () => {
    expect(slugify("Hello    World")).toBe("hello-world");
  });

  it("should handle special characters", () => {
    expect(slugify("Hello & World!")).toBe("hello-world");
  });

  it("should handle leading/trailing dashes", () => {
    expect(slugify("-hello-world-")).toBe("hello-world");
  });

  it("should handle empty string", () => {
    expect(slugify("")).toBe("");
  });
});

describe("humanizeSlug", () => {
  it("should convert slug to readable text", () => {
    expect(humanizeSlug("hello-world")).toBe("Hello World");
  });

  it("should handle multiple words", () => {
    expect(humanizeSlug("my-business-name")).toBe("My Business Name");
  });

  it("should handle empty parts", () => {
    expect(humanizeSlug("hello--world")).toBe("Hello World");
  });
});
