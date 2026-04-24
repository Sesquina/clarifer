import { describe, it, expect } from "vitest";
import { isAllowedEmail, accessLevelFor, ALLOWED_EMAILS } from "@/lib/internal/types";

describe("internal access allowlist", () => {
  it("13. allowlisted email resolves to the correct access level", () => {
    expect(isAllowedEmail("samira.esquina@clarifer.com")).toBe(true);
    expect(accessLevelFor("samira.esquina@clarifer.com")).toBe("full");
    expect(isAllowedEmail("michael.barbara@clarifer.com")).toBe(true);
    expect(accessLevelFor("michael.barbara@clarifer.com")).toBe("growth");
  });

  it("14. disallowed email is blocked and has no level", () => {
    expect(isAllowedEmail("attacker@example.com")).toBe(false);
    expect(accessLevelFor("attacker@example.com")).toBeNull();
    expect(isAllowedEmail("samira@clarifer.com")).toBe(false); // must be the .esquina variant
    expect(isAllowedEmail("")).toBe(false);
    expect(isAllowedEmail(null)).toBe(false);
    expect(isAllowedEmail(undefined)).toBe(false);
  });

  it("15. allowlist is exactly the two internal users and no more", () => {
    expect([...ALLOWED_EMAILS]).toEqual([
      "samira.esquina@clarifer.com",
      "michael.barbara@clarifer.com",
    ]);
  });
});
