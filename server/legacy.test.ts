import { describe, expect, it } from "vitest";
import { PONTUACAO, formatarTelefone, pontosDoStatus } from "./legacy";

describe("UMADEB legacy rules", () => {
  it("formats Brazilian phone numbers consistently", () => {
    expect(formatarTelefone("5511987654321")).toBe("(11) 98765-4321");
    expect(formatarTelefone("11 2345-6789 / 11 99876-5432")).toBe("(11) 2345-6789 / (11) 99876-5432");
    expect(formatarTelefone("")).toBeNull();
  });

  it("applies event scoring rules to attendance statuses", () => {
    expect(PONTUACAO.EBD).toBe(500);
    expect(pontosDoStatus("EBD", "presente")).toBe(500);
    expect(pontosDoStatus("EBD", "justificado")).toBe(500);
    expect(pontosDoStatus("EBD", "ausente")).toBe(0);
  });
});
