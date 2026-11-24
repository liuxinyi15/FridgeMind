import type { SVGProps } from 'react';

export type IconName = 'home' | 'fridge' | 'recipes' | 'shopping' | 'back' | 'clock' | 'servings' | 'sparkle' | 'plus' | 'search' | 'filter' | 'camera' | 'gallery' | 'edit' | 'leaf' | 'alert' | 'check' | 'more' | 'snowflake' | 'calendar' | 'trash' | 'info' | 'chevron' | 'bell' | 'lock' | 'close' | 'minus';

export function Icon({ name, size = 22, ...props }: SVGProps<SVGSVGElement> & { name: IconName; size?: number }) {
  const common = { width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true };
  const paths: Record<IconName, React.ReactNode> = {
    home: <><path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9h13v-9M9.5 19v-5h5v5"/></>,
    fridge: <><rect x="5" y="2.5" width="14" height="19" rx="2"/><path d="M5 9h14M8 5.5v1M8 12v3"/></>,
    recipes: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z"/><path d="M5 4.5v17M9 6h7M9 10h7"/></>,
    shopping: <><path d="M4 8h16l-1.4 13H5.4zM8 8a4 4 0 0 1 8 0"/><path d="m9 14 2 2 4-4"/></>,
    back: <><path d="m15 18-6-6 6-6"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    servings: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0M16 11a3 3 0 0 0 0-6M17 15a5 5 0 0 1 3.5 5"/></>,
    sparkle: <><path d="m12 3 1.2 4.2L17 9l-3.8 1.8L12 15l-1.2-4.2L7 9l3.8-1.8zM5 15l.7 2.3L8 18l-2.3.7L5 21l-.7-2.3L2 18l2.3-.7z"/></>,
    plus: <><path d="M12 5v14M5 12h14"/></>,
    minus: <><path d="M5 12h14"/></>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m15.5 15.5 5 5"/></>,
    filter: <><path d="M4 6h16M7 12h10M10 18h4"/></>,
    camera: <><path d="M4 7.5h3l1.3-2h7.4l1.3 2h3v12H4z"/><circle cx="12" cy="13" r="3.5"/></>,
    gallery: <><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="9" r="1.5"/><path d="m4 17 5-5 4 4 2-2 5 5"/></>,
    edit: <><path d="m4 20 4.5-1L19 8.5 15.5 5 5 15.5zM13.8 6.7l3.5 3.5"/></>,
    leaf: <><path d="M20 4C11 4 5 9 5 16c4 1 10 0 13-5 1.5-2.5 2-7 2-7Z"/><path d="M4 20c3-5 7-8 12-11"/></>,
    alert: <><path d="M12 3 2.8 20h18.4zM12 9v4M12 17h.01"/></>,
    check: <><path d="m5 12 4 4L19 6"/></>,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none"/></>,
    snowflake: <><path d="M12 2v20M4 7l16 10M20 7 4 17M8.5 4 12 7.5 15.5 4M8.5 20l3.5-3.5 3.5 3.5"/></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7h.01"/></>,
    chevron: <><path d="m9 18 6-6-6-6"/></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/></>,
    lock: <><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></>,
    close: <><path d="m6 6 12 12M18 6 6 18"/></>,
  };
  return <svg {...common} {...props}>{paths[name]}</svg>;
}
