// ── Enums (зеркало C# Models/Enums) ──────────────────

export enum BookType {
  Japan = 1,
  Korea = 2,
  China = 3,
  English = 4,
  Original = 5,
  Fanfic = 6,
}

export enum TranslationStatus {
  None = 0,
  Ongoing = 1,
  Completed = 2,
  Dropped = 3,
  Hiatus = 4,
}

export enum OriginalStatus {
  None = 0,
  Ongoing = 1,
  Completed = 2,
  Hiatus = 3,
}

// ── Типы, соответствующие C# бэкенду ──────────────────

export interface ReadingProgressDto {
  chapterId: string
  chapterNumber: number
}

export interface TagDto {
  id: string
  name: string
  slug: string
}

export interface CategoryDto {
  id: string
  name: string
  slug: string
}

export interface BookDto {
  id: string
  title: string
  description: string | null
  coverUrl: string | null
  coverThumbUrl: string | null
  type: BookType
  originalStatus: OriginalStatus
  translationStatus: TranslationStatus
  createdAt: string
  updatedAt: string
  chapterCount: number
  userProgress: ReadingProgressDto | null
  tags: TagDto[]
  categories: CategoryDto[]
  averageRating: number | null
  ratingCount: number
}

export interface BookDetailDto extends BookDto {}

export interface BookCatalogFilters {
  search: string
  types: BookType[]
  originalStatuses: OriginalStatus[]
  translationStatuses: TranslationStatus[]
  tags: string[]
  categories: string[]
  sortBy: CatalogSortBy
  sortDirection: SortDirection
}

export enum CatalogSortBy {
  CreatedAt = 'createdAt',
  UpdatedAt = 'updatedAt',
  Title = 'title',
}

export enum SortDirection {
  Asc = 'asc',
  Desc = 'desc',
}

export interface ChapterListDto {
  id: string
  bookId: string
  title: string
  chapterNumber: number
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
  isPublished: boolean
}

export interface ChapterDetailDto {
  id: string
  bookId: string
  title: string
  content: string
  chapterNumber: number
  createdAt: string
  likesCount: number
  isLikedByCurrentUser: boolean
  previousChapterId: string | null
  nextChapterId: string | null
  isPublished: boolean
}

export interface PagedResult<T> {
  items: T[]
  totalCount: number
  pageNumber: number
  pageSize: number
}

export interface CursorPagedResult<T, TCursor = string> {
  items: T[]
  nextCursor: TCursor | null
  hasMore: boolean
}

export interface CursorStringPagedResult<T> {
  items: T[]
  nextCursor: string | null
  hasMore: boolean
}

export interface CreateBookDto {
  title: string
  description?: string | null
  coverUrl?: string | null
  type?: BookType
  originalStatus?: OriginalStatus
  translationStatus?: TranslationStatus
  tagIds?: string[] | null
  categoryIds?: string[] | null
}

export interface CreateChapterDto {
  bookId: string
  title: string
  content: string
  chapterNumber: number
  isPublished?: boolean
}

export interface SetProgressDto {
  chapterId: string
}

export interface CollectionDto {
  id: string
  name: string
  createdAt: string
  bookCount: number
}

export interface CollectionDetailDto extends CollectionDto {
  books: BookDto[]
}

export interface CreateCollectionDto {
  name: string
}

export interface AddBookToCollectionDto {
  bookId: string
}

export interface BookCollectionStatusDto {
  collectionId: string
  collectionName: string
}

export interface QuoteDto {
  id: string
  chapterId: string
  bookId: string
  bookTitle: string
  chapterTitle: string
  chapterNumber: number
  selectedText: string
  contextText: string | null
  note: string | null
  createdAt: string
  updatedAt: string
}

export interface CreateQuoteDto {
  chapterId: string
  selectedText: string
  contextText?: string | null
  note?: string | null
}

export interface UpdateQuoteDto {
  note?: string | null
}

export interface CommentDto {
  id: string
  bookId: string
  chapterId: string | null
  parentId: string | null
  userId: string
  username: string
  content: string
  score: number
  myVote: number
  isPinned: boolean
  isOwn: boolean
  replyCount: number
  createdAt: string
  replies: CommentDto[]
}

export interface CreateCommentDto {
  content: string
  parentId?: string | null
}

export interface CommentVoteResultDto {
  commentId: string
  score: number
  myVote: number
}

export enum TeamRole {
  Head = 1,
  Translator = 2,
  Editor = 3,
}

export enum RequestStatus {
  Pending = 0,
  Approved = 1,
  Rejected = 2,
}

export interface TeamDto {
  id: string
  name: string
  slug: string | null
  description: string | null
  memberCount: number
  bookCount: number
  createdAt: string
  isVerified?: boolean
}

export interface TeamMemberDto {
  userId: string
  username: string
  role: TeamRole
  createdAt: string
}

export interface TeamBookDto {
  id: string
  title: string
  coverUrl: string | null
  chapterCount: number
}

export interface TeamDetailDto {
  id: string
  name: string
  slug: string | null
  description: string | null
  createdAt: string
  members: TeamMemberDto[]
  books: TeamBookDto[]
  myRole: TeamRole | null
  isVerified?: boolean
}

export interface CreateTeamDto {
  name: string
  slug?: string | null
  description?: string | null
}

export interface UpdateTeamDto {
  name: string
  description?: string | null
}

export interface AddTeamMemberDto {
  username: string
  role: TeamRole
}

export interface TeamTitleRequestDto {
  id: string
  teamId: string
  teamName: string
  bookId: string
  bookTitle: string
  status: RequestStatus
  message: string | null
  createdAt: string
  decidedAt: string | null
}

export interface CreateTitleRequestDto {
  bookId: string
  message?: string | null
}

export interface AdminUserDto {
  id: string
  username: string
  email: string
  role: string
  createdAt: string
  isBanned?: boolean
  isMuted?: boolean
}

export interface UpdateChapterDto {
  title: string
  content: string
  chapterNumber: number
  isPublished: boolean
}

export interface UpdateBookDto {
  title: string
  description?: string | null
  coverUrl?: string | null
  type: BookType
  originalStatus: OriginalStatus
  translationStatus: TranslationStatus
}

export interface ChapterDetailDtoFull extends ChapterDetailDto {}

export enum NotificationType {
  CommentReply = 1,
  TeamInvite = 2,
  RequestApproved = 3,
  RequestRejected = 4,
  NewChapter = 5,
  Mention = 6,
  LevelUp = 7,
  Achievement = 8,
}

export interface BookTeamDto {
  teamId: string
  teamName: string
  slug: string | null
}

export interface ChapterVersionDto {
  id: string
  chapterId: string
  teamId: string | null
  teamName: string | null
  title: string
  language: string
  score: number
  myVote: number
  isPublished: boolean
  isOwn: boolean
  createdAt: string
}

export interface ChapterVersionDetailDto {
  id: string
  chapterId: string
  teamId: string | null
  teamName: string | null
  title: string
  content: string
  language: string
  score: number
  myVote: number
  isPublished: boolean
  createdAt: string
}

export interface ChapterVersionVoteResultDto {
  versionId: string
  score: number
  myVote: number
}

export interface UserStatsDto {
  xp: number
  level: number
  xpIntoLevel: number
  xpForNextLevel: number
  chaptersRead: number
  commentsPosted: number
  currentStreak: number
  longestStreak: number
}

export enum RankingType {
  Popular = 1,
  TopRated = 2,
  MostChapters = 3,
  Newest = 4,
}

export enum ShelfStatus {
  Reading = 1,
  Completed = 2,
  PlanToRead = 3,
  Dropped = 4,
}

export interface ShelfItemDto {
  status: ShelfStatus
  updatedAt: string
  book: BookDto
}

export interface RatingAggregateDto {
  average: number | null
  count: number
  distribution: number[]
  myValue: number | null
  myReview: string | null
}

export interface ReviewDto {
  userId: string
  username: string
  avatarThumbUrl: string | null
  value: number
  review: string | null
  updatedAt: string
}

export enum FollowTargetType {
  User = 1,
  Team = 2,
}

export interface FollowStatusDto {
  isFollowing: boolean
  followerCount: number
}

export interface FeedItemDto {
  chapterId: string
  bookId: string
  bookTitle: string
  coverThumbUrl: string | null
  chapterNumber: number
  chapterTitle: string
  teamId: string | null
  teamName: string | null
  createdAt: string
}

export interface QuestDto {
  key: string
  title: string
  icon: string
  target: number
  progress: number
  reward: number
  completed: boolean
}

export interface LeaderboardEntryDto {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  level: number
  value: number
}

export interface LeaderboardDto {
  topXp: LeaderboardEntryDto[]
  topStreak: LeaderboardEntryDto[]
  topCommenters: LeaderboardEntryDto[]
}

export interface AchievementDto {
  key: string
  title: string
  description: string
  icon: string
  unlocked: boolean
  unlockedAt: string | null
}

export interface UserProfileDto {
  id: string
  username: string
  email: string
  role: string
  avatarUrl: string | null
  avatarThumbUrl: string | null
  bio: string | null
  createdAt: string
}

export interface UpdateProfileDto {
  username: string
  email: string
  avatarUrl?: string | null
  bio?: string | null
}

export interface ChangePasswordDto {
  currentPassword: string
  newPassword: string
}

export interface ContinueReadingDto {
  bookId: string
  bookTitle: string
  coverUrl: string | null
  lastChapterId: string
  lastChapterNumber: number
  updatedAt: string
}

export interface NotificationDto {
  id: string
  type: NotificationType
  title: string
  message: string | null
  linkUrl: string | null
  isRead: boolean
  createdAt: string
}

export interface NotificationPrefsDto {
  enableCommentReply: boolean
  enableTeamInvite: boolean
  enableRequestApproved: boolean
  enableRequestRejected: boolean
  enableNewChapter: boolean
  enableMention: boolean
  enableLevelUp: boolean
  enableAchievement: boolean
}

export interface UpdateNotificationPrefsDto {
  enableCommentReply?: boolean
  enableTeamInvite?: boolean
  enableRequestApproved?: boolean
  enableRequestRejected?: boolean
  enableNewChapter?: boolean
  enableMention?: boolean
  enableLevelUp?: boolean
  enableAchievement?: boolean
}

export interface CommentReportDto {
  id: string
  commentId: string
  bookId: string
  chapterId: string | null
  commentContent: string
  commentAuthor: string
  reporterUsername: string
  reason: string
  isResolved: boolean
  createdAt: string
}

export interface TeamInviteDto {
  id: string
  teamId: string
  teamName: string
  role: TeamRole
  status: RequestStatus
  createdAt: string
}

export interface CreateInviteDto {
  username: string
  role: TeamRole
}

// ── Типы авторизации ──────────────────────────────────

export interface UserDto {
  id: string
  username: string
  email: string
  role: 'Admin' | 'User' | 'Translator'
}

export interface AuthResponse {
  token: string
  user: UserDto
}

export interface CreateUserDto {
  username: string
  email: string
  password: string
}

export interface LoginDto {
  email: string
  password: string
}
