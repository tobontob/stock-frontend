"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { FaArrowUp, FaArrowDown, FaRegDotCircle } from "react-icons/fa";
import { FiLoader } from "react-icons/fi";
import ReactPaginate from "react-paginate";

interface RelatedStock {
  name: string;
  code?: string;
  sector?: string;
  direction?: string;
}

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  sentiment: string | { label: string };
  published?: string;
  related_stocks?: RelatedStock[];
  link?: string;
  reason?: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(0);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyzed_news`);
      if (!res.ok) throw new Error("API 요청 실패");
      const data = await res.json();
      setNews(data.news || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error(err.message);
      } else {
        console.error("데이터를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const pagedNews = news.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  function getSentimentLabel(sentiment: string | { label: string } | undefined): string {
    if (!sentiment) return "";
    if (typeof sentiment === "string") return sentiment;
    if (typeof sentiment === "object" && "label" in sentiment) return sentiment.label;
    return "";
  }

  return (
    <div className={styles.page}>
      {/* 상단 네비게이션 */}
      <nav className={styles.navbar}>
        <div className={styles.navTitle}>AI 금융 뉴스 분석</div>
      </nav>
      <main className={styles.main}>
        <h1 className={styles.title}>감정분석 뉴스 리스트</h1>
        {loading && (
          <div className={styles.loaderWrap}><FiLoader className={styles.loader} /> 불러오는 중...</div>
        )}
        {!loading && news.length === 0 && (
          <div className={styles.emptyWrap}>
            <div className={styles.emptyIllust}>📰</div>
            <div className={styles.emptyText}>분석된 뉴스가 없습니다.</div>
          </div>
        )}
        <div className={styles.cardList + " card-list"}>
          {pagedNews.map((item) => (
            <div
              className={styles.card + " card"}
              key={item._id}
              onClick={() => setSelected(item)}
            >
              <div className={styles.cardTitle + " card-title"}>{item.title}</div>
              <div className={styles.cardContent + " card-content"}>
                {Array.isArray(item.related_stocks) && item.related_stocks.length > 0 ? (
                  item.related_stocks.map((s, idx) => (
                    <span key={s.name + idx} className={styles.stockBadge}>
                      {s.name}
                      {s.direction === "상승" && <FaArrowUp className={styles.upIcon} title="상승" />}
                      {s.direction === "하락" && <FaArrowDown className={styles.downIcon} title="하락" />}
                      {s.direction === "중립" && <FaRegDotCircle className={styles.neutralIcon} title="중립" />}
                    </span>
                  ))
                ) : (
                  <span className={styles.stockBadge}>-</span>
                )}
              </div>
              <div className={styles.cardDate + " card-date"}>{item.published?.replace("T", " ").slice(0, 19) ?? ""}</div>
            </div>
          ))}
        </div>
        <ReactPaginate
          pageCount={Math.ceil(news.length / PAGE_SIZE)}
          pageRangeDisplayed={5}
          marginPagesDisplayed={1}
          onPageChange={({ selected }) => setPage(selected)}
          forcePage={page}
          containerClassName={"pagination " + styles.pagination}
          activeClassName={styles.active}
          previousLabel={"<"}
          nextLabel={">"}
          breakLabel={"..."}
        />
        {/* 상세 뉴스 모달 */}
        {selected && (
          <div className={styles.modalOverlay} onClick={() => setSelected(null)}>
            <div className={styles.modal} onClick={e => e.stopPropagation()}>
              <button className={styles.modalClose} onClick={() => setSelected(null)}>&times;</button>
              <h2 className={styles.modalTitle}>{selected.title}</h2>
              <div className={styles.modalDate}>{selected.published?.replace("T", " ").slice(0, 19) ?? ""}</div>
              <div className={styles.modalStocks}>
                <b>종목:</b>{" "}
                {Array.isArray(selected.related_stocks) && selected.related_stocks.length > 0
                  ? selected.related_stocks.map((s, idx) => (
                      <span key={s.name + idx} className={styles.stockBadge}>
                        {s.name}
                        {s.direction === "상승" && <FaArrowUp className={styles.upIcon} title="상승" />}
                        {s.direction === "하락" && <FaArrowDown className={styles.downIcon} title="하락" />}
                        {s.direction === "중립" && <FaRegDotCircle className={styles.neutralIcon} title="중립" />}
                      </span>
                    ))
                  : "-"}
              </div>
              <div className={styles.modalSentiment}><b>감정:</b> {getSentimentLabel(selected.sentiment)}</div>
              <div className={styles.modalReason}><b>분석근거:</b> {selected.reason || "분석 근거 데이터 없음"}</div>
              <div className={styles.modalContent}>{selected.content}</div>
              {selected.link && <a href={selected.link} target="_blank" rel="noopener noreferrer" className={styles.modalLink}>기사 원문보기</a>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
