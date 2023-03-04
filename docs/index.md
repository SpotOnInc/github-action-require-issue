# github-action-require-issue

A GitHub action to enforce that a PR has been appropriately linked to a GitHub Issue.
This can be used for compliance purposes to ensure that code changes are appropriately
made as a result of an actual request for projects that use GitHub Issues to track
change requests.

## Installation / Basic Setup

Include this in your actions file:

```yaml
- name: Require linked issue on pull request
  uses: spotoninc/github-action-require-issue@v1
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
```

Note: You will need the following triggers for your action:

```yaml
pull_request:
  types: [edited, synchronize, opened, reopened]
```

For full usage instructions and examples, see [Usage][usage]

<!-- links -->
[usage]: usage.md
