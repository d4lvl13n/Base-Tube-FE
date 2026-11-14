/**
 * The Videos Management list, in the Business / Analytics register
 * (`Business/businessStyles.ts`): one translucent-black card on the hub's
 * #09090B, hairline cool borders, sentence-case grey-400 headers, tabular
 * figures, and orange only where something is on (selection, the public
 * switch, the active filter). Nothing here paints a browser default (no native
 * focus ring, no system checkbox, no OS select list).
 *
 * The exported names and shape are unchanged so every consumer keeps working;
 * the values now come from the Business sheet.
 */
import { button, empty, list, popover, surface, table } from '../../../Business/businessStyles';

export const styles = {
  /** The single card the whole list lives in. */
  panel: surface.card,

  table: {
    header: table.head,
    headerCell: `${table.th} select-none`,
    row: list.table.row,
    cell: list.table.cell,
  },

  /** Hairlines between rows, in both layouts. */
  divider: surface.divider,

  title: list.title,
  preview: list.preview,
  stat: list.stat,

  /**
   * Controls stay out of the way until you go looking for them, but they never
   * leave the tab order — and on a touch screen, where there is no hover to go
   * looking with, they are simply always there.
   */
  revealed: list.revealed,

  actionButton: `${button.icon} disabled:hover:bg-transparent disabled:hover:text-gray-400`,
  actionIcon: 'h-4 w-4',

  tooltip: popover.panel,
  /** Radix tooltip arrow, the panel's own black. */
  tooltipArrow: 'fill-black',

  dropdownMenu: list.dropdownMenu,

  loadMore: list.loadMore,

  emptyState: {
    wrapper: empty.wrapper,
    icon: empty.icon,
    title: empty.title,
    subtitle: empty.body,
  },
};
