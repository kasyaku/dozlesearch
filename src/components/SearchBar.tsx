// searchbar.tsx
import { useRouter } from "next/router";
import { useState, useEffect } from "react";

export default function SearchBar({
  initialTag = "",
  initialKeyword = "",
}: {
  initialTag?: string;
  initialKeyword?: string;
}) {
  const [tag, setTag] = useState("");
  const [keyword, setKeyword] = useState("");
  const router = useRouter();

  // 初期値を反映（初回マウント時＋クエリ変更時）
  useEffect(() => {
    setTag(initialTag);
    setKeyword(initialKeyword);
  }, [initialTag, initialKeyword]);

  const handleSearch = () => {
    const normalize = (input: string) =>
      input
        .replace(/\u3000/g, " ")
        .split(" ")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

    const tagList = normalize(tag);
    const keywordList = normalize(keyword);

    const params = new URLSearchParams();
    if (tagList.length > 0) params.append("tag", tagList.join(","));
    if (keywordList.length > 0) params.append("keyword", keywordList.join(","));

    router.push(`/search?${params.toString()}`);
  };

  return (
    <div
      style={{
        display: "flex",
        gap: "1rem",
        margin: "1rem 0",
        flexWrap: "wrap",
      }}
    >
      <input
        type="text"
        value={tag}
        onChange={(e) => setTag(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        placeholder="タグ（スペース区切り可）"
        style={{ padding: "0.5rem", width: "200px" }}
      />

      <input
        type="text"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        placeholder="キーワード（スペース区切り可）"
        style={{ padding: "0.5rem", width: "300px" }}
        onKeyDown={(e) => e.key === "Enter" && handleSearch()}
      />
      <button onClick={handleSearch} style={{ padding: "0.5rem 1rem" }}>
        検索
      </button>
    </div>
  );
}
