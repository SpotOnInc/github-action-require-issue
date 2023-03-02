import * as methods from '../src/methods'
import * as github from '@actions/github'

jest.mock('@actions/github')

describe('business logic', () => {
  let context
  beforeEach(() => {
    context = {
      repo: {
        owner: 'spotoninc',
        repo: 'example'
      }
    }
  })

  describe('verifyIssue', () => {
    const mockGithubRestClient = {
      rest: {
        issues: {
          get: jest.fn()
        }
      }
    }
    beforeEach(() => {
      jest.resetAllMocks()
      github.getOctokit.mockReturnValue(mockGithubRestClient)
    })

    it('should return false when there are not linked issues', async () => {
      const match = 'does not matter'
      mockGithubRestClient.rest.issues.get.mockResolvedValueOnce({})
      const actual = await methods.verifyIssue(match, context)
      expect(actual).toBeFalsy()
    })

    it('should successfully match an item', async () => {
      // arrange
      const match = '1'
      const state = 'foo'
      mockGithubRestClient.rest.issues.get.mockResolvedValueOnce({
        data: {
          number: parseInt(match),
          state
        }
      })
      process.env.INPUT_VALID_ISSUE_STATE = state

      // act
      const actual = await methods.verifyIssue(match, context)
      // assert
      expect(actual).toBeTruthy()
    })
  })

  it('should generate valid url regex', async () => {
    await expect(methods.generateUrlRegex(context)).resolves.toStrictEqual(
      /https:\/\/github.com\/spotoninc\/example\/issues\/(\d+)/g
    )
  })

  it('should get tagged issue from pr body', async () => {
    const body = 'This PR closes #1.'
    await expect(methods.getLinkedIssues(body, context)).resolves.toStrictEqual(
      ['1']
    )
  })

  it('should get multiple tagged issues from pr body', async () => {
    const body =
      'This PR is linked to #1 and #2 (and #4).\n\nIt also closes #3.'
    await expect(methods.getLinkedIssues(body, context)).resolves.toStrictEqual(
      ['1', '2', '4', '3']
    )
  })

  it('should get linked issue from pr body', async () => {
    const body =
      'This PR closes https://github.com/spotoninc/example/issues/1.'
    await expect(methods.getLinkedIssues(body, context)).resolves.toStrictEqual(
      ['1']
    )
  })

  it('should get tagged and linked issue from pr body', async () => {
    const body =
      'Relates to #1 and https://github.com/spotoninc/example/issues/2.'
    await expect(methods.getLinkedIssues(body, context)).resolves.toStrictEqual(
      ['1', '2']
    )
  })
})
