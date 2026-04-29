export class Debouncer {
  private timer: ReturnType<typeof setTimeout> | undefined
  private callback: () => Promise<void>
  private defaultMs: number

  constructor(callback: () => Promise<void>, defaultMs: number) {
    this.callback = callback
    this.defaultMs = defaultMs
  }

  schedule(ms?: number): void {
    if (this.timer) clearTimeout(this.timer)
    this.timer = setTimeout(() => {
      this.timer = undefined
      void this.callback()
    }, ms ?? this.defaultMs)
  }

  cancel(): void {
    if (this.timer) {
      clearTimeout(this.timer)
      this.timer = undefined
    }
  }

  async flush(): Promise<void> {
    this.cancel()
    await this.callback()
  }
}