const core = require('@actions/core')
const github = require('@actions/github')
const { checkLinkedIssues, fail } = require('./methods')

export async function main (context) {
  try {
    // check if this is actually a PR
    const pullRequest = context.payload.pull_request
    if (!pullRequest) {
      core.error('Not a pull request, skipping...')
      return
    }

    // get PR body
    const body = pullRequest.body
    if (!body) {
      // no PR body, fail
      fail('No pull request body found, therefore no linked issues...')
    }

    await checkLinkedIssues(body, context)
  } catch (error) {
    fail(`Action failed with error ${error}`)
  }
}

main(github.context).then(() => {
  core.info('Action complete')
}).catch(() => {
  fail('Error detected')
})
