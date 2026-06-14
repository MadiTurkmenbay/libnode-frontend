import type { CreateQuoteDto, QuoteDto, UpdateQuoteDto } from '~/types'

export function useQuotes() {
  const mutate = useApiMutation()

  async function createQuote(dto: CreateQuoteDto): Promise<QuoteDto> {
    return mutate<QuoteDto>('/api/quotes', {
      method: 'POST',
      body: dto,
    }) as Promise<QuoteDto>
  }

  async function fetchQuotes(): Promise<QuoteDto[]> {
    return mutate<QuoteDto[]>('/api/quotes', {
      method: 'GET',
    }) as Promise<QuoteDto[]>
  }

  async function fetchQuoteById(id: string): Promise<QuoteDto> {
    return mutate<QuoteDto>(`/api/quotes/${id}`, {
      method: 'GET',
    }) as Promise<QuoteDto>
  }

  async function updateQuote(id: string, dto: UpdateQuoteDto): Promise<QuoteDto> {
    return mutate<QuoteDto>(`/api/quotes/${id}`, {
      method: 'PUT',
      body: dto,
    }) as Promise<QuoteDto>
  }

  async function deleteQuote(id: string): Promise<void> {
    await mutate(`/api/quotes/${id}`, {
      method: 'DELETE',
    })
  }

  async function fetchQuotesByBook(bookId: string): Promise<QuoteDto[]> {
    return mutate<QuoteDto[]>(`/api/quotes/by-book/${bookId}`, {
      method: 'GET',
    }) as Promise<QuoteDto[]>
  }

  return {
    createQuote,
    fetchQuotes,
    fetchQuoteById,
    updateQuote,
    deleteQuote,
    fetchQuotesByBook,
  }
}
