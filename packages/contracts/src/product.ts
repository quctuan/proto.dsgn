import type { ProjectMetadata } from './api/projects.js';
import type { SkillSummary } from './api/registry.js';

export const PRODUCT_NAME = 'proto.dsgn';

/** Creation policy; legacy artifact types remain readable for existing projects. */
export function supportsPrototypeCreation(metadata: Partial<ProjectMetadata> | null | undefined): boolean {
  return (!metadata?.kind || metadata.kind === 'prototype') && !metadata?.intent;
}

/** Functional skills and design-system tools support the prototype workflow. */
export function isPrototypeSkill(skill: Pick<SkillSummary, 'mode' | 'surface'>): boolean {
  return ['utility', 'prototype', 'design-system'].includes(skill.mode)
    && (!skill.surface || skill.surface === 'web');
}
