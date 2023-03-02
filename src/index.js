const core = require('@actions/core')
const github = require('@actions/github')

const validState = core.getInput('valid_issue_state')
const githubToken = core.getInput('github_token')
const octokit = github.getOctokit(githubToken)

const issueRegex = /#\d+/g

function fail (message) {
  core.setFailed(message)
}

function generateUrlRegex () {
  const { owner, repo } = github.context.repo
  return new RegExp(`https://github.com/${owner}/${repo}/issues/(\\d+)`, 'g')
}

async function getLinkedIssues (body) {
  // extract possible issue keys from PR body
  let matches = body.match(issueRegex)
  if (!matches) matches = []
  core.debug(`Found matches from PR body: ${matches}`)
  // strip array to just the integer id #s, no extra characters
  matches = matches.map(x => x.replace(/^#/, '').trim())
  // extract possible issue links (urls) from PR body
  const urlRegex = await generateUrlRegex()
  const urlMatches = body.matchAll(urlRegex)
  for (const match of urlMatches) {
    // pull the capture group, which should be the issue #
    const possibleIssue = match[1]
    core.debug(`URL match found: ${possibleIssue}`)
    if (!matches.includes(possibleIssue)) {
      // append url-match issue keys too
      matches.push(possibleIssue)
    }
  }
  core.debug(`All possible matches: ${matches}`)
  // fail if none are found
  if (!matches.length) {
    fail('No issue tags or links found.')
  }
  return matches
}

async function verifyLinkedIssues (matches) {
  // verify that any possible issue keys are actual issue keys via GitHub API
  for (const match of matches) {
    core.debug(`Checking to see if ${match} is a valid issue.`)
    try {
      const issue = await octokit.rest.issues.get({
        owner: github.context.repo.owner,
        repo: github.context.repo.repo,
        issue_number: match
      })
      // verify issue exists and data.number matches (just to be extra paranoid)
      if (issue && parseInt(match) === issue.data.number) {
        core.debug(`#${match} is a valid issue on this repo.`)
        const { state: issueState } = issue.data
        // if valid_state has been defined, use it to check the state
        if (validState && typeof issueState === 'string') {
          core.debug(`Need to check valid state: ${validState}`)
          core.debug(`Comparing ${validState} to ${issueState}`)
          if (validState === issueState) {
            return true
          }
        } else {
          return true
        }
      }
    } catch {
      core.debug(`#${match} is not a valid issue on this repo.`)
    }
  }
  // no valid matches found
  return false
}

async function checkLinkedIssues (body) {
  const matches = await getLinkedIssues(body)
  if (matches) {
    const validMatches = await verifyLinkedIssues(matches)
    if (!validMatches) {
      fail('No valid issue tags/links found.')
    }
  }
}

async function main () {
  try {
    // check if this is actually a PR
    const pullRequest = github.context.payload.pull_request
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

    await checkLinkedIssues(body)
  } catch (error) {
    fail(`Action failed with error ${error}`)
  }
}

main().then(() => { core.info('Action complete') })
