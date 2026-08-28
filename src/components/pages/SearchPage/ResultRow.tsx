import React from 'react';
import { Link } from 'react-router-dom';
import type { SearchHighlight, SearchResult } from '@basetube/api';
import Highlight from '../../common/Highlight';
import { formatDuration, formatNumber } from '../../../utils/format';

interface ResultRowProps {
  result: SearchResult;
  highlight?: SearchHighlight;
}

/**
 * One search result.
 *
 * A row rather than a card, because the matched words are the reason this
 * result is here and they need room to be read — the grid card writes the
 * title over the thumbnail, where a highlight would be lost.
 */
const ResultRow: React.FC<ResultRowProps> = ({ result, highlight }) => {
  const title = highlight?.title || result.title;
  const description = highlight?.description || result.description || '';

  return (
    <article className="flex flex-col gap-4 py-5 sm:flex-row">
      <Link
        to={`/video/${result.id}`}
        className="relative block w-full shrink-0 overflow-hidden rounded-lg bg-gray-900 sm:w-64"
        tabIndex={-1}
        aria-hidden="true"
      >
        <div className="relative pt-[56.25%]">
          {result.thumbnail_url && (
            <img
              src={result.thumbnail_url}
              alt=""
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover"
            />
          )}
        </div>
        <span className="absolute bottom-1.5 right-1.5 rounded bg-black/80 px-1.5 py-0.5 text-xs tabular-nums text-white">
          {formatDuration(result.duration)}
        </span>
      </Link>

      <div className="min-w-0 flex-1">
        <h2 className="text-base font-medium leading-snug text-white">
          <Link to={`/video/${result.id}`} className="transition-colors hover:text-[#fa7517]">
            <Highlight text={title} />
          </Link>
        </h2>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-gray-500">
          {result.channel && (
            <>
              <Link
                to={`/channel/${result.channel.handle}`}
                className="transition-colors hover:text-gray-300"
              >
                {result.channel.name}
              </Link>
              <span aria-hidden="true">·</span>
            </>
          )}
          <span>{formatNumber(result.views_count)} views</span>
        </p>

        {description && (
          <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-gray-400">
            <Highlight text={description} />
          </p>
        )}
      </div>
    </article>
  );
};

export default ResultRow;
