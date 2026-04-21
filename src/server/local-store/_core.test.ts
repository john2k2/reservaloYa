import { beforeEach, describe, expect, it, vi } from "vitest";

const {
  copyFileMock,
  mkdirMock,
  readFileMock,
  renameMock,
  writeFileMock,
} = vi.hoisted(() => ({
  copyFileMock: vi.fn(),
  mkdirMock: vi.fn(),
  readFileMock: vi.fn(),
  renameMock: vi.fn(),
  writeFileMock: vi.fn(),
}));

vi.mock(import("node:fs/promises"), async (importOriginal) => {
  const actual = await importOriginal();
  const mockedModule = {
    ...actual,
    copyFile: copyFileMock,
    mkdir: mkdirMock,
    readFile: readFileMock,
    rename: renameMock,
    writeFile: writeFileMock,
  };

  return {
    ...mockedModule,
    default: mockedModule,
  };
});

vi.mock("@/server/local-domain", () => ({
  ensureDemoPresetData: vi.fn((store) => store),
  normalizeStore: vi.fn((store) => store),
}));

describe("local store core", () => {
  beforeEach(() => {
    vi.resetModules();
    mkdirMock.mockReset();
    copyFileMock.mockReset();
    readFileMock.mockReset();
    renameMock.mockReset();
    writeFileMock.mockReset();
    mkdirMock.mockResolvedValue(undefined);
    copyFileMock.mockResolvedValue(undefined);
    renameMock.mockResolvedValue(undefined);
    writeFileMock.mockResolvedValue(undefined);
  });

  it("falls back to the seed store when runtime file cannot be created", async () => {
    readFileMock
      .mockRejectedValueOnce(new Error("runtime missing"))
      .mockResolvedValueOnce('{"businesses":[],"services":[],"availabilityRules":[],"blockedSlots":[],"customers":[],"bookings":[],"waitlistEntries":[],"reviews":[],"analyticsEvents":[],"communicationEvents":[]}');
    copyFileMock.mockRejectedValueOnce(new Error("read only filesystem"));

    const { readStore, seedPath } = await import("./_core");
    const store = await readStore();

    expect(store).toMatchObject({
      businesses: [],
      services: [],
      bookings: [],
    });
    expect(readFileMock).toHaveBeenLastCalledWith(seedPath, "utf8");
  });
});
