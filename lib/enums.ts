import { BookType, type OriginalStatus, type TranslationStatus } from '~/types'

export const bookTypeLabels: Record<BookType, string> = {
  [BookType.Japan]: 'Япония',
  [BookType.Korea]: 'Корея',
  [BookType.China]: 'Китай',
  [BookType.English]: 'Англия',
  [BookType.Original]: 'Оригинал',
  [BookType.Fanfic]: 'Фанфик',
}

export const translationStatusLabels: Record<TranslationStatus, string> = {
  0: '—',
  1: 'Продолжается',
  2: 'Завершён',
  3: 'Заброшен',
  4: 'Приостановлен',
}

export const originalStatusLabels: Record<OriginalStatus, string> = {
  0: '—',
  1: 'Продолжается',
  2: 'Завершён',
  3: 'Приостановлен',
}
