const core = require('@actions/core')
const github = require('@actions/github')

const ISSUE_REGEX = /#\d+/g

export function fail (message) {
  core.setFailed(message)
}

export async function generateUrlRegex (context) {
  const { owner, repo } = context.repo
  return new RegExp(`https://github.com/${owner}/${repo}/issues/(\\d+)`, 'g')
}

export async function getLinkedIssues (body, context) {
  // extract possible issue keys from PR body
  let matches = body.match(ISSUE_REGEX)
  if (!matches) matches = []
  core.debug(`Found matches from PR body: ${matches}`)
  // strip array to just the integer id #s, no extra characters
  matches = matches.map(x => x.replace(/^#/, '').trim())
  // extract possible issue links (urls) from PR body
  const urlRegex = await generateUrlRegex(context)
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

export async function verifyIssue (match, context) {
  try {
    const githubToken = core.getInput('github_token')
    const octokit = github.getOctokit(githubToken)
    const issue = await octokit.rest.issues.get({
      owner: context.repo.owner,
      repo: context.repo.repo,
      issue_number: match
    })
    // verify issue exists and data.number matches (just to be extra paranoid)
    if (issue && parseInt(match) === issue.data.number) {
      core.debug(`#${match} is a valid issue on this repo.`)
      const { state: issueState } = issue.data
      // if valid_state has been defined, use it to check the state
      const validState = core.getInput('valid_issue_state')
      if (!validState) {
        return true
      } else if (validState && typeof issueState === 'string') {
        core.debug(`Need to check valid state: ${validState}`)
        core.debug(`Comparing ${validState} to ${issueState}`)
        if (validState === issueState) {
          return true
        }
      } else {
        core.warning(`${validState} is not a valid string`)
        return false
      }
    }
  } catch (err) {
    core.debug(`#${match} is not a valid issue on this repo.`)
    return false
  }
}

export async function verifyLinkedIssues (matches, context) {
  // verify that any possible issue keys are actual issue keys via GitHub API
  for (const match of matches) {
    core.debug(`Checking to see if ${match} is a valid issue.`)
    const isValid = await verifyIssue(match, context)
    if (isValid) return true
  }
  // no valid matches found
  return false
}

export async function checkLinkedIssues (body, context) {
  const matches = await getLinkedIssues(body, context)
  if (matches) {
    const validMatches = await verifyLinkedIssues(matches, context)
    if (!validMatches) {
      fail('No valid issue tags/links found.')
    }
  }
}
