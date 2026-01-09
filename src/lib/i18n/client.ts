import { browser } from "$app/environment"
import {
  overwriteGetLocale,
  baseLocale,
  isLocale,
} from "$lib/paraglide/runtime"

/**
 * Initialize client-side locale detection.
 * Reads the locale from the HTML lang attribute set during SSR.
 */
if (browser) {
  overwriteGetLocale(() => {
    const lang = document.documentElement.lang
    if (lang && isLocale(lang)) {
      return lang
    }
    return baseLocale
  })
}
