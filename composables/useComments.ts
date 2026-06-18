import type {
  CommentDto,
  CreateCommentDto,
  CommentVoteResultDto,
  CursorPagedResult,
} from '~/types'

/**
 * API-обёртки для комментариев книги/главы (ответы, голоса, закреп).
 */
export function useComments() {
  function listBookComments(bookId: string, cursor: string | null, sort = 'new', limit = 20) {
    const cursorPart = cursor ? `&cursor=${cursor}` : ''
    return executeApiRequest<CursorPagedResult<CommentDto, string>>(
      `/api/books/${bookId}/comments?limit=${limit}&sort=${sort}${cursorPart}`,
      { key: `book-comments:${bookId}:${sort}:${cursor ?? 'init'}` },
    )
  }

  function listChapterComments(chapterId: string, cursor: string | null, sort = 'new', limit = 20) {
    const cursorPart = cursor ? `&cursor=${cursor}` : ''
    return executeApiRequest<CursorPagedResult<CommentDto, string>>(
      `/api/chapters/${chapterId}/comments?limit=${limit}&sort=${sort}${cursorPart}`,
      { key: `chapter-comments:${chapterId}:${sort}:${cursor ?? 'init'}` },
    )
  }

  function reportComment(commentId: string, reason: string) {
    return executeApiRequest<void>(`/api/comments/${commentId}/report`, { method: 'POST', body: { reason } })
  }

  function createBookComment(bookId: string, content: string, parentId: string | null = null) {
    const body: CreateCommentDto = { content, parentId }
    return executeApiRequest<CommentDto>(`/api/books/${bookId}/comments`, { method: 'POST', body })
  }

  function createChapterComment(chapterId: string, content: string, parentId: string | null = null) {
    const body: CreateCommentDto = { content, parentId }
    return executeApiRequest<CommentDto>(`/api/chapters/${chapterId}/comments`, { method: 'POST', body })
  }

  function voteComment(commentId: string, value: -1 | 0 | 1) {
    return executeApiRequest<CommentVoteResultDto>(`/api/comments/${commentId}/vote`, {
      method: 'POST',
      body: { value },
    })
  }

  function pinComment(commentId: string) {
    return executeApiRequest<{ isPinned: boolean }>(`/api/comments/${commentId}/pin`, { method: 'POST' })
  }

  function deleteComment(commentId: string) {
    return executeApiRequest<void>(`/api/comments/${commentId}`, { method: 'DELETE' })
  }

  return {
    listBookComments,
    listChapterComments,
    reportComment,
    createBookComment,
    createChapterComment,
    voteComment,
    pinComment,
    deleteComment,
  }
}
