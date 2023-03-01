const core = require("@actions/core");
const github = require("@actions/github");

const context = github.context;
const github_token = core.getInput("github_token");
const octokit = github.getOctokit(github_token);
const valid_state = core.getInput("valid_issue_state");

const issue_regex = /#\d+/g;

function fail(message) {
    core.setFailed(message);
}

function generate_url_regex() {
    let owner = context.repo.owner;
    let repo = context.repo.repo;
    return new RegExp(
        `https:\/\/github.com\/${owner}\/${repo}\/issues\/(\\d+)`,
        "g"
    );
}

async function getLinkedIssues(body) {
    // extract possible issue keys from PR body
    let matches = body.match(issue_regex);
    if (! matches) matches = []
    core.debug(`Found matches from PR body: ${matches}`)
    // strip array to just the integer id #s, no extra characters
    matches = matches.map(x => x.replace(/^#/, "").trim())
    // extract possible issue links (urls) from PR body
    let url_regex = await generate_url_regex();
    let url_matches = body.matchAll(url_regex);
    for (const match of url_matches) {
        // pull the capture group, which should be the issue #
        let possible_issue = match[1];
        core.debug(`URL match found: ${possible_issue}`)
        if (! matches.includes(possible_issue)) {
            // append url-match issue keys too
            matches.push(possible_issue);
        }
    }
    core.debug(`All possible matches: ${matches}`)
    // fail if none are found
    if (! matches.length) {
        fail("No issue tags or links found.");
    }
    return matches;
}

async function verifyLinkedIssues(matches) {
    // verify that any possible issue keys are actual issue keys via GitHub API
    for (const match of matches) {
        core.debug(`Checking to see if ${match} is a valid issue.`);
        try {
            let issue = await octokit.rest.issues.get({
                owner: context.repo.owner,
                repo: context.repo.repo,
                issue_number: match,
            });
            // verify issue exists and data.number matches (just to be extra paranoid)
            if (issue && parseInt(match) === issue.data.number) {
                core.debug(`#${match} is a valid issue on this repo.`)
                let issue_state = issue.data.state
                // if valid_state has been defined, use it to check the state
                if (valid_state && typeof issue_state === "string") {
                    core.debug(`Need to check valid state: ${valid_state}`)
                    core.debug(`Comparing ${valid_state} to ${issue_state}`)
                    if (valid_state === issue_state) {
                        return true;
                    }
                } else {
                    return true;
                }
            }
        } catch {
            core.debug(`#${match} is not a valid issue on this repo.`);
        }
    }
    // no valid matches found
    return false;
}

async function checkLinkedIssues(body) {
    let matches = await getLinkedIssues(body);
    if (matches) {
        let validMatches = await verifyLinkedIssues(matches);
        if(! validMatches) {
            fail("No valid issue tags/links found.")
        }
    }
}

async function run() {
    try {
        // check if this is actually a PR
        let pull_request = context.payload.pull_request;
        if (!pull_request) {
            core.error("Not a pull request, skipping...")
            return;
        }

        // get PR body
        let body = pull_request.body;
        if (! body) {
            // no PR body, fail
            fail("No pull request body found, therefore no linked issues...")
        }

        await checkLinkedIssues(body)
    } catch (error) {
        fail(`Action failed with error ${error}`);
    }
}

run().then(() => { core.info("Action complete") })
