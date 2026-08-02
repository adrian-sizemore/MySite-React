import assert from 'node:assert/strict'
import test from 'node:test'

import { selectResource } from './resumeApi.js'

const resume = {
  about: { summary: 'About Adrian' },
  experience: [{ id: 1 }],
  military_service: [{ id: 2 }],
  skill_categories: [{ id: 3 }],
}

test('projects detail resources from the static aggregate', () => {
  assert.equal(selectResource('about', resume), resume.about)
  assert.equal(selectResource('experience', resume), resume.experience)
  assert.equal(selectResource('military', resume), resume.military_service)
  assert.equal(selectResource('skills', resume), resume.skill_categories)
  assert.equal(selectResource('resume', resume), resume)
})

test('returns null for an absent aggregate section', () => {
  assert.equal(selectResource('volunteering', resume), null)
})
