"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { FaArrowUp, FaArrowDown, FaRegDotCircle } from "react-icons/fa";
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
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const PAGE_SIZE = 40;
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
      <main className={styles.main}>
        <h1 className={styles.title}>감정분석 뉴스 리스트</h1>
        {loading && <p>불러오는 중...</p>}
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
                    <span key={s.name + idx} style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
                      {s.name}
                      {s.direction === "상승" && <FaArrowUp style={{ color: "#2196f3", marginLeft: 4 }} title="상승" />}
                      {s.direction === "하락" && <FaArrowDown style={{ color: "#e53935", marginLeft: 4 }} title="하락" />}
                      {s.direction === "중립" && <FaRegDotCircle style={{ color: "#757575", marginLeft: 4 }} title="중립" />}
                    </span>
                  ))
                ) : (
                  <span>-</span>
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
          containerClassName="pagination"
          activeClassName="active"
          previousLabel={"<"}
          nextLabel={">"}
          breakLabel={"..."}
        />
        {/* 상세 뉴스 모달 */}
        {selected && (
          <div style={{ position: "fixed", left: 0, top: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.3)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setSelected(null)}>
            <div style={{ background: "#fff", padding: 32, borderRadius: 8, minWidth: 320, maxWidth: 600 }} onClick={e => e.stopPropagation()}>
              <h2>{(selected as NewsItem)!.title}</h2>
              <div style={{ marginBottom: 8, color: "#888" }}>{(selected as NewsItem)!.published?.replace("T", " ").slice(0, 19) ?? ""}</div>
              <div style={{ marginBottom: 16 }}>
                <b>종목:</b>{" "}
                {Array.isArray((selected as NewsItem)!.related_stocks) && (selected as NewsItem)!.related_stocks!.length > 0
                  ? (selected as NewsItem)!.related_stocks!.map((s, idx) => (
                      <span key={s.name + idx} style={{ marginRight: 8, display: "inline-flex", alignItems: "center" }}>
                        {s.name}
                        {s.direction === "상승" && <FaArrowUp style={{ color: "#2196f3", marginLeft: 4 }} title="상승" />}
                        {s.direction === "하락" && <FaArrowDown style={{ color: "#e53935", marginLeft: 4 }} title="하락" />}
                        {s.direction === "중립" && <FaRegDotCircle style={{ color: "#757575", marginLeft: 4 }} title="중립" />}
                      </span>
                    ))
                  : "-"}
                <br />
                <b>감정:</b> {getSentimentLabel((selected as NewsItem)!.sentiment)}
              </div>
              <div style={{ marginBottom: 16 }}>
                <b>분석근거:</b> {(selected as any).reason || "분석 근거 데이터 없음"}
              </div>
              <div style={{ whiteSpace: "pre-line", marginBottom: 16 }}>{(selected as NewsItem)!.content}</div>
              {(selected as NewsItem)!.link && <a href={(selected as NewsItem)!.link} target="_blank" rel="noopener noreferrer" style={{ color: "#2196f3", textDecoration: "underline" }}>기사 원문보기</a>}
              <div style={{ textAlign: "right", marginTop: 16 }}>
                <button onClick={() => setSelected(null)}>닫기</button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
