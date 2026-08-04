import assert from 'node:assert/strict'
import test from 'node:test'

import {
  clearResourceCache,
  fetchResource,
  resourceConfig,
} from './resumeApi.js'

test.afterEach(() => {
  globalThis.fetch = undefined
  Object.keys(resourceConfig).forEach(clearResourceCache)
})

test('loads each resource through the same-origin API path', async () => {
  let requestedUrl
  globalThis.fetch = async (url) => {
    requestedUrl = url
    return new Response(JSON.stringify([{ id: 1 }]), {
      headers: { 'Content-Type': 'application/json' },
    })
  }

  assert.deepEqual(await fetchResource('projects'), [{ id: 1 }])
  assert.equal(requestedUrl, '/api/v1/projects/')
})

test('returns null when an optional API resource is absent', async () => {
  globalThis.fetch = async () => new Response(null, { status: 404 })

  assert.equal(await fetchResource('volunteering'), null)
})

test('filters the unapproved CI/CD skill from API responses', async () => {
  globalThis.fetch = async () =>
    new Response(
      JSON.stringify([
        {
          name: 'Automation',
          skills: [{ name: 'Python' }, { name: 'CI/CD' }],
        },
      ]),
      { headers: { 'Content-Type': 'application/json' } },
    )

  const categories = await fetchResource('skills')
  assert.deepEqual(categories[0].skills, [{ name: 'Python' }])
})
