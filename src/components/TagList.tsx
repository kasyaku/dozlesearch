import { useState } from "react";

export type Tag = {
  id: string;
  name: string;
};

type Props = {
  videoId: string;
  tags: Tag[];
  onRemove?: (tagId: string) => void; // ← 親から削除通知を受け取る場合に備えて
};

export default function TagList({ videoId, tags, onRemove }: Props) {
  const handleRemove = async (tagId: string) => {
    const res = await fetch(`/api/video-tag`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, tagId }),
    });

    if (res.ok) {
      onRemove?.(tagId); // ← 親に削除を伝える（任意）
    } else {
      alert("タグの削除に失敗しました");
    }
  };

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
      {tags.map((tag) => (
        <div
          key={tag.id}
          style={{
            background: "#eee",
            padding: "0.3rem 0.6rem",
            borderRadius: "9999px",
            display: "flex",
            alignItems: "center",
          }}
        >
          <span>{tag.name}</span>
          <button
            onClick={() => handleRemove(tag.id)}
            style={{
              marginLeft: "0.5rem",
              background: "transparent",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
            }}
            title="タグを削除"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
