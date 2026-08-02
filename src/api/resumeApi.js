const RESUME_DATA_URL =
  import.meta.env?.VITE_RESUME_DATA_URL || '/data/resume.json'

export const resourceConfig = {
  about: { dataKey: 'about', title: 'About' },
  experience: { dataKey: 'experience', title: 'Professional Experience' },
  military: { dataKey: 'military_service', title: 'Military Service' },
  resume: { dataKey: null, title: 'Resume' },
  projects: { dataKey: 'projects', title: 'Projects' },
  volunteering: { dataKey: 'volunteering', title: 'Volunteering' },
  education: { dataKey: 'education', title: 'Education' },
  certifications: { dataKey: 'certifications', title: 'Certifications' },
  skills: { dataKey: 'skill_categories', title: 'Skills' },
}

const responseCache = new Map()
let resumePayloadCache = null
const excludedSkills = new Set(['CI/CD'])

function sanitizeSkillCategories(categories = []) {
  return categories.map((category) => ({
    ...category,
    skills: (category.skills || []).filter(
      (skill) => !excludedSkills.has(skill.name),
    ),
  }))
}

function sanitizePayload(resourceKey, payload) {
  if (resourceKey === 'skills' && Array.isArray(payload)) {
    return sanitizeSkillCategories(payload)
  }

  if (resourceKey === 'resume' && payload?.skill_categories) {
    return {
      ...payload,
      skill_categories: sanitizeSkillCategories(payload.skill_categories),
    }
  }

  return payload
}

export async function fetchResource(resourceKey, signal) {
  const config = resourceConfig[resourceKey]
  if (!config) throw new Error(`Unknown resource: ${resourceKey}`)
  if (responseCache.has(resourceKey)) return responseCache.get(resourceKey)

  if (!resumePayloadCache) {
    const response = await fetch(RESUME_DATA_URL, {
      headers: { Accept: 'application/json' },
      signal,
    })

    if (!response.ok) {
      throw new Error(`The ${config.title.toLowerCase()} content is unavailable.`)
    }

    resumePayloadCache = await response.json()
  }

  const selectedPayload = selectResource(resourceKey, resumePayloadCache)
  const payload = sanitizePayload(resourceKey, selectedPayload)
  responseCache.set(resourceKey, payload)
  return payload
}

export function selectResource(resourceKey, resumePayload) {
  const config = resourceConfig[resourceKey]
  if (!config) throw new Error(`Unknown resource: ${resourceKey}`)
  return config.dataKey === null
    ? resumePayload
    : (resumePayload?.[config.dataKey] ?? null)
}

export function clearResourceCache(resourceKey) {
  responseCache.delete(resourceKey)
  resumePayloadCache = null
}
