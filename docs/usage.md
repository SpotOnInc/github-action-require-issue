# Usage

## Full usage example:

```yaml
name: pull-request

on:
  pull_request:
    types: [edited, synchronize, opened, reopened]

jobs:
  checks:
    name: Perform required PR checks
    runs-on: ubuntu-latest
    steps:
      - name: Require linked issue on PR
        uses: spotoninc/github-action-require-issue@main
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Limit to particular Issue state

You can also require that only a specific Issue state is considered valid.

For example: if you don't want to allow non-open linked Issues to count as a linked
issue, you can add the `valid_issue_state` input and :

```yaml
- name: Require linked issue on PR
  uses: spotoninc/github-action-require-issue@main
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    valid_issue_state: open
```
