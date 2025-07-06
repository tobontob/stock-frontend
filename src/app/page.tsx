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
        <div style={{ display: "flex", flexWrap: "wrap", gap: 24 }}>
          {news.map((item) => (
            <div
              key={item._id}
              style={{
                border: `2px solid ${sentimentColor[item.sentiment as keyof typeof sentimentColor] || "#ccc"}`,
                borderRadius: 12,
                padding: 20,
                minWidth: 320,
                maxWidth: 400,
                background: "#fff",
                boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              }}
            >
              <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8 }}>{item.title}</div>
              <div style={{ color: "#555", marginBottom: 12 }}>{item.content}</div>
              <div>
                <span style={{
                  color: "#fff",
                  background: sentimentColor[item.sentiment as keyof typeof sentimentColor] || "#888",
                  borderRadius: 8,
                  padding: "4px 12px",
                  fontWeight: 600,
                  fontSize: 14,
                }}>
                  {item.sentiment === "positive" && "긍정"}
                  {item.sentiment === "negative" && "부정"}
                  {item.sentiment === "neutral" && "중립"}
                </span>
                {item.date && (
                  <span style={{ marginLeft: 12, color: "#888", fontSize: 13 }}>{item.date}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
