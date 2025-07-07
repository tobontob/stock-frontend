"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  sentiment: string | { label: string };
  published?: string;
}

const PAGE_SIZE = 10;
const PAGINATION_GROUP_SIZE = 5;

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchNews = async (pageNum: number) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyzed_news?page=${pageNum}&page_size=${PAGE_SIZE}`);
      if (!res.ok) throw new Error("API 요청 실패");
      const data = await res.json();
      setNews(data.news || []);
      setTotal(data.total || 0);
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
    fetchNews(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // 페이징 계산
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const currentGroup = Math.floor((page - 1) / PAGINATION_GROUP_SIZE);
  const startPage = currentGroup * PAGINATION_GROUP_SIZE + 1;
  const endPage = Math.min(startPage + PAGINATION_GROUP_SIZE - 1, totalPages);
  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) pageNumbers.push(i);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1 className={styles.title}>감정분석 뉴스 리스트</h1>
        {loading && <p>불러오는 중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles["card-list"]}>
          {news.map((item) => (
            <div key={item._id} className={styles.card}>
              <div className={styles["card-title"]}>{item.title}</div>
              <div className={styles["card-content"]}>{item.content}</div>
              <div>
                {(() => {
                  let label = "";
                  if (typeof item.sentiment === "string") {
                    label = item.sentiment;
                  } else if (item.sentiment && typeof item.sentiment === "object" && "label" in item.sentiment) {
                    label = item.sentiment.label;
                  }
                  let badgeClass = styles["card-badge"] + " ";
                  if (label === "positive") badgeClass += styles.positive;
                  else if (label === "negative") badgeClass += styles.negative;
                  else badgeClass += styles.neutral;
                  return (
                    <span className={badgeClass}>
                      {label === "positive" && "긍정"}
                      {label === "negative" && "부정"}
                      {label === "neutral" && "중립"}
                    </span>
                  );
                })()}
                {item.published && (
                  <span className={styles["card-date"]}>{
                    typeof item.published === "string"
                      ? item.published.replace("T", " ").slice(0, 19)
                      : ""
                  }</span>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* 페이징 UI */}
        <div className={styles.pagination}>
          <button onClick={() => setPage(1)} disabled={page === 1}>&laquo; 처음</button>
          <button onClick={() => setPage(page - 1)} disabled={page === 1}>&lt; 이전</button>
          {pageNumbers.map((p) => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={p === page ? styles.activePage : ""}
            >
              {p}
            </button>
          ))}
          <button onClick={() => setPage(page + 1)} disabled={page === totalPages}>
            다음 &gt;
          </button>
          <button onClick={() => setPage(totalPages)} disabled={page === totalPages}>
            마지막 &raquo;
          </button>
        </div>
      </main>
    </div>
  );
}
