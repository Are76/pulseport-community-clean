export interface PulseBoardFeedItem {
  tag: string;
  title: string;
  body: string;
  meta: string;
}

interface PulseBoardFeedProps {
  items: PulseBoardFeedItem[];
}

export function PulseBoardFeed({ items }: PulseBoardFeedProps) {
  return (
    <div className="front-feed-list front-feed-list--embedded">
      {items.map((item, index) => (
        <article className={`front-feed-card front-feed-card--${item.tag.toLowerCase().replace(/\s+/g, '-')}`} key={`${item.tag}-${index}`}>
          <div className="front-feed-meta">
            <span>{item.tag}</span>
            <small>{item.meta}</small>
          </div>
          <strong>{item.title}</strong>
          <p>{item.body}</p>
        </article>
      ))}
    </div>
  );
}

export type { PulseBoardFeedProps };
