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
  const [error, setError] = useState("");
  const [selected, setSelected] = useState<NewsItem | null>(null);
  const [stockFilter, setStockFilter] = useState("");
  const [sentimentFilter, setSentimentFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const PAGE_SIZE = 40;
  const [page, setPage] = useState(0);

  const fetchNews = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyzed_news`);
      if (!res.ok) throw new Error("API 요청 실패");
      const data = await res.json();
      setNews(data.news || []);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("데이터를 불러오지 못했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  // 필터링
  const filteredNews = news.filter((item) => {
    let pass = true;
    if (stockFilter) {
      pass = pass && !!(item.related_stocks && item.related_stocks.some(s => s.name.includes(stockFilter)));
    }
    if (sentimentFilter) {
      const label = typeof item.sentiment === "string" ? item.sentiment : item.sentiment?.label;
      pass = pass && label === sentimentFilter;
    }
    if (dateFilter) {
      pass = pass && !!(item.published && item.published.startsWith(dateFilter));
    }
    return pass;
  });

  // 차트 데이터
  const stockCount: Record<string, number> = {};
  const sentimentCount: Record<string, number> = { positive: 0, negative: 0, neutral: 0 };
  news.forEach(item => {
    if (item.related_stocks) {
      item.related_stocks.forEach(s => {
        stockCount[s.name] = (stockCount[s.name] || 0) + 1;
      });
    }
    const label = typeof item.sentiment === "string" ? item.sentiment : item.sentiment?.label;
    if (label) sentimentCount[label] = (sentimentCount[label] || 0) + 1;
  });

  const pagedNews = filteredNews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

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
        <div style={{ marginBottom: 16 }}>
          <input placeholder="종목명 필터" value={stockFilter} onChange={e => setStockFilter(e.target.value)} style={{ marginRight: 8 }} />
          <select value={sentimentFilter} onChange={e => setSentimentFilter(e.target.value)} style={{ marginRight: 8 }}>
            <option value="">감정 전체</option>
            <option value="positive">긍정</option>
            <option value="negative">부정</option>
            <option value="neutral">중립</option>
          </select>
          <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
        </div>
        {/* 차트 */}
        <div style={{ display: "flex", gap: 32, marginBottom: 24 }}>
          <div>
            <b>종목별 뉴스 건수</b>
            <div style={{ width: 300 }}>
              {Object.entries(stockCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([name, count]) => (
                <div key={name} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: 80 }}>{name}</span>
                  <div style={{ background: "#eee", height: 16, width: 150, margin: "0 8px" }}>
                    <div style={{ background: "#4a90e2", width: `${count * 10}px`, height: 16 }} />
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <b>감정별 뉴스 건수</b>
            <div style={{ width: 200 }}>
              {Object.entries(sentimentCount).map(([label, count]) => (
                <div key={label} style={{ display: "flex", alignItems: "center" }}>
                  <span style={{ width: 60 }}>{label === "positive" ? "긍정" : label === "negative" ? "부정" : "중립"}</span>
                  <div style={{ background: "#eee", height: 16, width: 80, margin: "0 8px" }}>
                    <div style={{ background: label === "positive" ? "#4caf50" : label === "negative" ? "#e74c3c" : "#aaa", width: `${count * 10}px`, height: 16 }} />
                  </div>
                  <span>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        {loading && <p>불러오는 중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles.cardList + " card-list"}>
          {pagedNews.map((item) => (
            <div
              className={styles.card + " card"}
              key={item._id}
              onClick={() => setSelected(item)}
              style={{ cursor: "pointer", flex: "1 1 22%", minWidth: 320, maxWidth: 400 }}
            >
              <div className={styles.cardTitle + " card-title"}>{item.title}</div>
              <div className={styles.cardContent + " card-content"}>
                {item.related_stocks && item.related_stocks.length > 0 ? (
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
              <div className={styles.cardDate + " card-date"}>{item.published ? item.published.replace("T", " ").slice(0, 19) : ""}</div>
            </div>
          ))}
        </div>
        <ReactPaginate
          pageCount={Math.ceil(filteredNews.length / PAGE_SIZE)}
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
