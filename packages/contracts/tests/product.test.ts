import { describe, expect, it } from 'vitest';
import { isPrototypeSkill, supportsPrototypeCreation } from '../src/product.js';
import type { ProjectMetadata } from '../src/api/projects.js';
import type { SkillSummary } from '../src/api/registry.js';

describe('proto.dsgn creation policy', () => {
  it.each([undefined, null, {}, { kind: 'prototype' }])('accepts prototype metadata: %j', metadata => {
    expect(supportsPrototypeCreation(metadata as ProjectMetadata)).toBe(true);
  });
  it.each(['deck', 'image', 'video', 'audio', 'template', 'other'])('rejects %s creation', kind => {
    expect(supportsPrototypeCreation({ kind } as ProjectMetadata)).toBe(false);
  });
  it.each(['live-artifact', 'web-clone', 'document', 'webgl-experience', 'hyperframes', 'motion-design'])('rejects retired %s routes', intent => {
    expect(supportsPrototypeCreation({ kind: 'prototype', intent } as ProjectMetadata)).toBe(false);
  });
  it.each(['utility', 'prototype', 'design-system'])('keeps %s skills', mode => {
    expect(isPrototypeSkill({ mode } as SkillSummary)).toBe(true);
  });
  it.each(['deck', 'image', 'video', 'audio', 'template'])('excludes %s generators', mode => {
    expect(isPrototypeSkill({ mode } as SkillSummary)).toBe(false);
  });
  it('does not expose media skills disguised as utilities', () => {
    expect(isPrototypeSkill({ mode: 'utility', surface: 'image' })).toBe(false);
  });
});
