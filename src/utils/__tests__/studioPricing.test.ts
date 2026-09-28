import { studioCreditsLabel, studioItemCredits } from "../studioPricing";

const catalog = {
  thumbnail: { generatePerImage: 12, editPerImage: 18, variationPerImage: 8 },
  ctr: { audit: 2, auditWithPersonas: 3, generatePerConcept: 15 },
};
it("prices each Studio output as the server does: concepts at any quality, edits, audits with or without personas", () => {
  expect(studioItemCredits(catalog, "generate", { quality: "standard" })).toBe(15);
  expect(studioItemCredits(catalog, "generate", { quality: "high" })).toBe(15);
  expect(studioItemCredits(catalog, "edit")).toBe(18);
  expect(studioItemCredits(catalog, "audit")).toBe(2);
  expect(studioItemCredits(catalog, "audit", { includePersonas: true })).toBe(3);
  for (const free of ["overlay", "prepare_brief", "suggest_titles", "describe_style"] as const)
    expect(studioItemCredits(catalog, free)).toBe(0);
});
it("knows free work without a catalog and reports paid work as unknown", () => {
  expect(studioItemCredits(null, "overlay")).toBe(0);
  expect(studioItemCredits(null, "generate")).toBeNull();
});
it("labels prices as the buttons show them", () => {
  expect(studioCreditsLabel(0)).toBe("free");
  expect(studioCreditsLabel(1)).toBe("1 credit");
  expect(studioCreditsLabel(30)).toBe("30 credits");
});
