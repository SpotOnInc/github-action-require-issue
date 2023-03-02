import * as methods from '../src/methods'

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
