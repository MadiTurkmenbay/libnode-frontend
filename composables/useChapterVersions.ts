import type {
  ChapterVersionDto,
  ChapterVersionDetailDto,
  ChapterVersionVoteResultDto,
} from '~/types'

/** API-обёртки для версий перевода главы (ветки переводов). */
export function useChapterVersions() {
  const listVersions = (chapterId: string) =>
    executeApiRequest<ChapterVersionDto[]>(`/api/chapters/${chapterId}/versions`, {
      key: `chapter-versions:${chapterId}`,
    })

  const getVersion = (versionId: string) =>
    executeApiRequest<ChapterVersionDetailDto>(`/api/chapter-versions/${versionId}`, {
      key: `chapter-version:${versionId}`,
    })

  const voteVersion = (versionId: string, value: -1 | 0 | 1) =>
    executeApiRequest<ChapterVersionVoteResultDto>(`/api/chapter-versions/${versionId}/vote`, {
      method: 'POST',
      body: { value },
    })

  return { listVersions, getVersion, voteVersion }
}
