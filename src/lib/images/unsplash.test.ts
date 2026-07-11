import { describe, expect, it } from "vitest";

import { unsplashSrcForWidth } from "./unsplash";

describe("unsplashSrcForWidth", () => {
  it("reduce el ancho de URLs de Unsplash", () => {
    const src =
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1400&h=900&fit=crop";

    expect(unsplashSrcForWidth(src, 640)).toBe(
      "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=640&h=411&fit=crop"
    );
  });

  it("devuelve la URL original si no es Unsplash", () => {
    const src = "https://picsum.photos/seed/demo/800/600";
    expect(unsplashSrcForWidth(src, 640)).toBe(src);
  });
});
