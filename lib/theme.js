'use client'

// /app/lib/theme.js
// SelfScience — three-mode theme preference (light | dark | system).
// Stored in localStorage under ss_theme. The <html> element gets a
// `dark` class when the effective theme is dark.
//
// Effective-theme resolution:
//   • 'light'  → light
//   • 'dark'   → dark
//   • 'system' → matches window.matchMedia('(prefers-color-scheme: dark)')
//
// A tiny inline script in app/layout.js applies the class before the
// React tree hydrates, so there is no light→dark flash on load.

import { useEffect, useState } from 'react'

export const THEME_LS_KEY = 'ss_theme'
const EVT = 'selfscience:theme-changed'

export const THEMES = ['light', 'dark', 'system']

/** Return the raw user preference. Defaults to 'system'. */
export function getThemePref() {
  if (typeof window === 'undefined') return 'system'
  try {
    const v = window.localStorage.getItem(THEME_LS_KEY)
    return THEMES.includes(v) ? v : 'system'
  } catch { return 'system' }
}

/** Persist the user's theme pref + apply it immediately. */
export function setThemePref(next) {
  if (typeof window === 'undefined') return
  const value = THEMES.includes(next) ? next : 'system'
  try { window.localStorage.setItem(THEME_LS_KEY, value) } catch {}
  applyTheme(value)
  try { window.dispatchEvent(new Event(EVT)) } catch {}
}

/** Compute the "effective" theme given a pref (resolves 'system'). */
export function resolveTheme(pref) {
  if (pref === 'light' || pref === 'dark') return pref
  if (typeof window === 'undefined') return 'light'
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
  } catch { return 'light' }
}

/** Toggle the <html> dark class + colour-scheme meta to match `pref`. */
export function applyTheme(pref) {
  if (typeof document === 'undefined') return
  const effective = resolveTheme(pref)
  const root = document.documentElement
  if (effective === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
  // Tell the browser about the theme so form controls / scrollbars pick it up.
  root.style.colorScheme = effective
}

/**
 * React hook: current pref + effective theme + a setter that persists
 * and updates the class immediately. Also re-applies when the system
 * setting changes (when user is on 'system').
 */
export function useTheme() {
  const [pref, setPref] = useState('system')
  const [effective, setEffective] = useState('light')

  useEffect(() => {
    const p = getThemePref()
    setPref(p)
    setEffective(resolveTheme(p))
    applyTheme(p)

    const onEvt = () => {
      const cur = getThemePref()
      setPref(cur)
      setEffective(resolveTheme(cur))
    }
    window.addEventListener(EVT, onEvt)

    // Watch prefers-color-scheme so 'system' users flip when the OS flips.
    let mql
    try {
      mql = window.matchMedia('(prefers-color-scheme: dark)')
      const onSys = () => {
        if (getThemePref() === 'system') {
          setEffective(resolveTheme('system'))
          applyTheme('system')
        }
      }
      mql.addEventListener?.('change', onSys)
      return () => {
        window.removeEventListener(EVT, onEvt)
        mql?.removeEventListener?.('change', onSys)
      }
    } catch {
      return () => window.removeEventListener(EVT, onEvt)
    }
  }, [])

  return {
    pref,
    effective,
    setTheme: (v) => setThemePref(v),
  }
}

/**
 * The inline no-flash script — stringified for direct injection into
 * <head> from a server component. Reads localStorage and sets the
 * `dark` class before React hydrates.
 */
export const NO_FLASH_SCRIPT = `
(function(){try{
  var k='${THEME_LS_KEY}';
  var v=localStorage.getItem(k);
  var pref=(v==='light'||v==='dark'||v==='system')?v:'system';
  var effective=pref;
  if(pref==='system'){
    effective=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';
  }
  if(effective==='dark') document.documentElement.classList.add('dark');
  document.documentElement.style.colorScheme=effective;
}catch(e){}})();
`.trim()
