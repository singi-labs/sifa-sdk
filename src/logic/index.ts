export {
  COMPLETENESS_MAX_SCORE,
  completenessPercent,
  completenessScore,
  type ProfileCompletion,
} from './profile-completeness.js';

export {
  DIMENSIONS_MAX_SCORE,
  MIN_SKILLS,
  countFilledDimensions,
  dimensionsFromInputs,
  getFilledDimensionsMap,
  profileToDimensionInputs,
  type DimensionKey,
  type DimensionMap,
  type ProfileDimensionInputs,
} from './profile-dimensions.js';

export { pickPrimaryPosition, type PrimaryPositionCandidate } from './primary-position.js';

export { isPseudoEmployer } from './pseudo-employer.js';
export { looksLikeDomain } from './domain-detect.js';
export {
  entityDisambiguationLabel,
  searchResultDisambiguation,
  entityResultKey,
  type DisambiguationFields,
} from './entity-disambiguation.js';
export {
  classifyEntityRef,
  isLinked,
  ENTITY_REF_ANCHORS,
  type EntityRefAnchor,
} from './entity-ref-anchor.js';
