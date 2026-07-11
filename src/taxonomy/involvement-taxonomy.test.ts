import { describe, expect, it } from 'vitest';

import { ARTIFACT_LINK_KIND_OPTIONS, getArtifactLinkKindLabel } from './artifact-link-kind.js';
import {
  INVOLVEMENT_KIND_OPTIONS,
  getInvolvementKindHeading,
  getInvolvementKindLabel,
} from './involvement-kind.js';

describe('involvement-kind taxonomy', () => {
  it('has the five involvement kinds', () => {
    expect(INVOLVEMENT_KIND_OPTIONS.map((o) => o.value)).toEqual([
      'id.sifa.defs#involvementOpenSource',
      'id.sifa.defs#involvementCommunity',
      'id.sifa.defs#involvementCharity',
      'id.sifa.defs#involvementCivic',
      'id.sifa.defs#involvementOther',
    ]);
  });

  it('maps open source to the "Open Source" heading', () => {
    expect(getInvolvementKindHeading('id.sifa.defs#involvementOpenSource')).toBe('Open Source');
  });

  it('maps charity to the "Volunteering" heading (legacy volunteering semantics)', () => {
    expect(getInvolvementKindHeading('id.sifa.defs#involvementCharity')).toBe('Volunteering');
  });

  it('resolves a select label for each kind', () => {
    expect(getInvolvementKindLabel('id.sifa.defs#involvementCommunity')).toBe('Community');
  });

  it('falls back to the raw value for an unknown kind', () => {
    expect(getInvolvementKindLabel('id.sifa.defs#involvementFuture')).toBe(
      'id.sifa.defs#involvementFuture',
    );
    expect(getInvolvementKindHeading('id.sifa.defs#involvementFuture')).toBe('Other');
  });
});

describe('artifact-link-kind taxonomy', () => {
  it('includes the common artifact kinds', () => {
    const values = ARTIFACT_LINK_KIND_OPTIONS.map((o) => o.value);
    expect(values).toContain('pull-request');
    expect(values).toContain('release');
    expect(values).toContain('talk');
  });

  it('resolves a label and falls back to the raw value', () => {
    expect(getArtifactLinkKindLabel('pull-request')).toBe('Pull request');
    expect(getArtifactLinkKindLabel('mystery')).toBe('mystery');
    expect(getArtifactLinkKindLabel(undefined)).toBeUndefined();
  });
});
