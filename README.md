# github-action-require-issue

GitHub action to enforce that a PR has been appropriately linked to a GitHub Issue.

## Installation

```yaml
    - name: Require linked issue on pull request
      uses: spotoninc/github-action-require-issue@v1.0.0
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
```

## Docs

[Check out the documentation here!][docs]

### Writing documentation

To run the docs locally, ensure that you have `python3` available in your path and
run `make docs`.
If this is the first time you've run the command, it will automatically build
the proper environment and then start a local server to access the rendered docs.
Otherwise, it will just start the server.
You can access the local docs server at `http://localhost:8383`. Press CTRL+C to stop.

[docs]: https://spotoninc.github.io/github-action-require-issue
