export default defineAppConfig({
  ui: {
    primary: 'violet',
    gray: 'slate',
    button: {
      default: {
        size: 'md',
        color: 'gray',
      },
      rounded: 'rounded-xl',
      font: 'font-medium',
    },
    input: {
      rounded: 'rounded-xl',
      color: {
        white: {
          outline: 'shadow-sm bg-white/80 dark:bg-slate-950/70 ring-1 ring-inset ring-slate-200/80 dark:ring-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/60 dark:focus:ring-violet-400/60',
        },
        gray: {
          outline: 'shadow-sm bg-white/80 dark:bg-slate-950/70 ring-1 ring-inset ring-slate-200/80 dark:ring-white/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:ring-2 focus:ring-violet-500/60 dark:focus:ring-violet-400/60',
        },
      },
    },
    card: {
      base: 'rounded-[28px] border border-white/10 bg-white/80 shadow-[0_24px_80px_-32px_rgba(15,23,42,0.45)] backdrop-blur-xl dark:bg-slate-950/70 dark:border-white/10',
      ring: '',
      divide: 'divide-y divide-white/10 dark:divide-white/10',
      header: {
        base: 'p-6 sm:px-7',
      },
      body: {
        base: 'p-6 sm:px-7',
      },
      footer: {
        base: 'p-6 sm:px-7',
      },
    },
    modal: {
      wrapper: 'z-[60]',
      rounded: 'rounded-[28px]',
      background: 'bg-slate-950/95 dark:bg-slate-950/95',
      overlay: {
        background: 'bg-slate-950/70 backdrop-blur-sm',
      },
    },
  },
})
