"use client";
import { useEffect, useState } from "react";
import styles from "./page.module.css";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  sentiment: string;
  date?: string;
}

const sentimentColor = {
  positive: "#4caf50",
  negative: "#f44336",
  neutral: "#9e9e9e",
};

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/analyzed_news`);
        if (!res.ok) throw new Error("API 요청 실패");
        const data = await res.json();
        setNews(data.news || data || []);
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
    fetchNews();
  }, []);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <h1>감정분석 뉴스 리스트</h1>
        {loading && <p>불러오는 중...</p>}
        {error && <p style={{ color: "red" }}>{error}</p>}
        <div className={styles["card-list"]}>
          {news.map((item) => (
            <div
              key={item._id}
              className={styles.card}
            >
              <div className={styles["card-title"]}>{item.title}</div>
              <div className={styles["card-content"]}>{item.content}</div>
              <div>
                <span
                  className={
                    styles["card-badge"] +
                    " " +
                    styles[
                      item.sentiment === "positive"
                        ? "positive"
                        : item.sentiment === "negative"
                        ? "negative"
                        : "neutral"
                    ]
                  }
                >
                  {item.sentiment === "positive" && "긍정"}
                  {item.sentiment === "negative" && "부정"}
                  {item.sentiment === "neutral" && "중립"}
                </span>
                {item.date && (
                  <span className={styles["card-date"]}>{item.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
