import { describe, expect, it } from "vitest";
import { hashPassword, verifyPassword, ROLES } from "./auth";

describe("autenticação", () => {
  it("cria e valida hashes de senha sem guardar a senha original", async () => {
    const hash = await hashPassword("senha-segura-123");
    expect(hash).toMatch(/^scrypt\$[^$]+\$[a-f0-9]+$/);
    expect(hash).not.toContain("senha-segura-123");
    await expect(verifyPassword("senha-segura-123", hash)).resolves.toBe(true);
    await expect(verifyPassword("senha-incorreta", hash)).resolves.toBe(false);
  });

  it("mantém os níveis de acesso definidos para o sistema", () => {
    expect(ROLES).toEqual(["admin", "secretario", "lider", "eventos"]);
  });
});
