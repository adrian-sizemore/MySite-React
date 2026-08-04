const API_BASE = (import.meta.env?.VITE_API_BASE_URL || '/api/v1').replace(
  /\/$/,
  '',
)

export const resourceConfig = {
  about: { endpoint: 'about', title: 'About Adrian' },
  experience: { endpoint: 'experience', title: 'Professional Experience' },
  military: { endpoint: 'military-service', title: 'Military Service' },
  resume: { endpoint: 'resume', title: 'Resume' },
  projects: { endpoint: 'projects', title: 'Projects' },
  volunteering: { endpoint: 'volunteering', title: 'Volunteering' },
  education: { endpoint: 'education', title: 'Education' },
  certifications: { endpoint: 'certifications', title: 'Certifications' },
  skills: { endpoint: 'skills', title: 'Skills' },
}

const responseCache = new Map()
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

  const response = await fetch(`${API_BASE}/${config.endpoint}/`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
    signal,
  })

  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`The ${config.title.toLowerCase()} service is unavailable.`)
  }

  const payload = sanitizePayload(resourceKey, await response.json())
  responseCache.set(resourceKey, payload)
  return payload
}

export function clearResourceCache(resourceKey) {
  responseCache.delete(resourceKey)
}

export function clearAllResourceCaches() {
  responseCache.clear()
}
