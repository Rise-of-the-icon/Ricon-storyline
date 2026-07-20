/**
 * @typedef {"narrator" | "ask"} TwinMode
 */

/**
 * @typedef {Object} TalentStat
 * @property {string} value
 * @property {string} label
 */

/**
 * @typedef {Object} TalentHook
 * @property {Array<{ text: string, accent?: boolean }>} quoteParts
 * @property {string} attribution
 * @property {string} subcopy
 */

/**
 * @typedef {Object} TalentTwinConfig
 * @property {boolean} available
 * @property {TwinMode[]} modes
 * @property {string} askCtaLabel
 * @property {string} [narratorLabel]
 * @property {string} [bannerTitle]
 * @property {string} [bannerBody]
 */

/**
 * @typedef {Object} TalentTrust
 * @property {string} consent
 * @property {string} sourceScope
 * @property {string} limit
 * @property {string} simulation
 * @property {string} sourceLabel
 */

/**
 * @typedef {Object} TalentStatusCopy
 * @property {string} idle
 * @property {string} submitted
 * @property {string} preparing
 * @property {string} streaming
 * @property {string} stopped
 * @property {string} complete
 * @property {string} uncertain
 * @property {string} failed
 */

/**
 * @typedef {Object} TalentMediaItem
 * @property {string} [id]
 * @property {"texture"|"image"|"video"} [type]
 * @property {string} tone
 * @property {string} [mark]
 * @property {string} [label]
 * @property {string} [title]
 * @property {string} [purpose]
 * @property {string} [caption]
 * @property {"wide"|"small"} [size]
 * @property {string} [src]
 */

/**
 * @typedef {Object} TalentBeat
 * @property {string} id
 * @property {string} title
 * @property {string} setup
 * @property {string} tape
 * @property {string} narr
 * @property {string} [askKey]
 * @property {TalentMediaItem[]} [mediaItems]
 */

/**
 * @typedef {Object} TalentEra
 * @property {string} id
 * @property {string} label
 * @property {string} year
 * @property {string} [chapterNo]
 * @property {TalentMediaItem} [media]
 * @property {TalentBeat[]} beats
 */

/**
 * @typedef {Object} TalentChatResponse
 * @property {"grounded"|"uncertain"} kind
 * @property {string} chapter
 * @property {string} text
 * @property {string[]} [sourceBeatIds]
 * @property {string[]} [sourceEraIds]
 */

/**
 * @typedef {Object} TalentChatMatcher
 * @property {string} id
 * @property {string|RegExp} pattern
 */

/**
 * @typedef {Object} TalentChat
 * @property {Record<string, TalentChatResponse>} responses
 * @property {Record<string, string>} questions
 * @property {Array<{ id: string, label: string, q: string }>} suggested
 * @property {TalentChatResponse} uncertain
 * @property {TalentChatMatcher[]} matchers
 * @property {Array<{ label: string, questionKey: string }>} [recovery]
 */

/**
 * @typedef {Object} TalentCopy
 * @property {string} empty
 * @property {string} disclose
 * @property {string} composerPlaceholder
 * @property {string} composerAriaLabel
 * @property {string} tapeLabel
 * @property {string} outsideCue
 * @property {string} storyTrust
 * @property {string} chatHeading
 * @property {string} chatEyebrow
 * @property {string} footer
 * @property {string} mediaProvenance
 * @property {string} timelineAriaLabel
 * @property {string} verifiedBadge
 */

/**
 * @typedef {Object} TalentStoryPack
 * @property {string} id
 * @property {string} displayName
 * @property {string} initial
 * @property {string} [portraitSrc]
 * @property {string[]} [tags]
 * @property {string} [verifiedLabel]
 * @property {string} [verificationNote]
 * @property {TalentHook} hook
 * @property {TalentStat[]} [stats]
 * @property {TalentTwinConfig} twin
 * @property {TalentTrust} trust
 * @property {TalentStatusCopy} statusCopy
 * @property {TalentEra[]} eras
 * @property {TalentChat} chat
 * @property {TalentCopy} copy
 */

export {};
