import { defaultStudioSettings, normalizeStudioStyle, studioStyleOverrides, studioLettering, STUDIO_LETTERING_CHOICES } from '../thumbnailStudio';

it.each([
  ['DejaVu Sans', 'heavy_block'], ['DejaVu Serif', 'elegant_serif'], ['DejaVu Sans Mono', 'tech_mono'],
] as const)('loads a saved legacy %s style as %s', (font, lettering) => {
  const style = { ...defaultStudioSettings().style, font };
  delete style.lettering;
  expect(normalizeStudioStyle(style)).toMatchObject({ font, lettering });
  expect(studioLettering(style)).toBe(lettering);
});

it.each(STUDIO_LETTERING_CHOICES)('saves %s with the closest local overlay font', (lettering, label) => {
  const style = normalizeStudioStyle({ ...defaultStudioSettings().style, lettering });
  expect(style).toMatchObject({ lettering, font: lettering === 'elegant_serif' ? 'DejaVu Serif' : lettering === 'tech_mono' ? 'DejaVu Sans Mono' : 'DejaVu Sans' });
  expect(label).not.toContain('DejaVu');
});

it('preserves inheritance across sparse new and legacy style overrides', () => {
  const inherited = normalizeStudioStyle({ ...defaultStudioSettings().style, lettering: 'tech_mono' });
  expect(studioStyleOverrides({})).toEqual({});
  expect(normalizeStudioStyle({ ...inherited, ...studioStyleOverrides({ accentColor: '#123456' }) })).toMatchObject({ lettering: 'tech_mono', font: 'DejaVu Sans Mono', accentColor: '#123456' });
  expect(normalizeStudioStyle({ ...inherited, ...studioStyleOverrides({ font: 'DejaVu Serif' }) })).toMatchObject({ lettering: 'elegant_serif', font: 'DejaVu Serif' });
});
