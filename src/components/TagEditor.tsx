import styles from "./TagEditor.module.scss";
import React, { useState } from "react";

export default function TagEditor({
  videoId,
  allTags: initialTags,
  videoTags,
  setVideoTags,
}) {
  const TAG_CATEGORIES = ["出演", "ジャンル", "形式", "内容", "その他"];
  const [selected, setSelected] = useState(
    new Set(videoTags.map((vt) => vt.tag.id))
  );
  const [showForm, setShowForm] = useState({});
  const [allTags, setAllTags] = useState(initialTags); // ← 追加

  const toggleTag = async (tagId) => {
    const isSelected = selected.has(tagId);
    const method = isSelected ? "DELETE" : "POST";

    await fetch("/api/video-tag", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId, tagId }),
    });

    setSelected((prev) => {
      const next = new Set(prev);
      isSelected ? next.delete(tagId) : next.add(tagId);
      return next;
    });

    setVideoTags((prev) => {
      if (isSelected) {
        return prev.filter((vt) => vt.tag.id !== tagId);
      } else {
        const addedTag = allTags.find((t) => t.id === tagId);
        if (!addedTag) return prev;
        return [...prev, { tag: addedTag }];
      }
    });
  };

  return (
    <div className={styles.tagEditor}>
      {TAG_CATEGORIES.map((category) => {
        const tags = allTags.filter((tag) => tag.category === category);

        return (
          <div key={category} className={styles.tagEditor__group}>
            <div className={styles.tagEditor__groupTitle}>{category}</div>
            <div className={styles.tagEditor__tagList}>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  className={`${styles.tagEditor__tag} ${
                    selected.has(tag.id)
                      ? styles["tagEditor__tag--selected"]
                      : ""
                  }`}
                  onClick={() => toggleTag(tag.id)}
                >
                  {tag.name}
                </button>
              ))}
              <button
                className={styles.tagEditor__addButton}
                onClick={() =>
                  setShowForm((prev) => ({ ...prev, [category]: true }))
                }
              >
                ＋
              </button>
              {showForm[category] && (
                <TagCreateForm
                  category={category}
                  onCreated={(newTag) => {
                    setAllTags((prev) => [...prev, newTag]);
                    setShowForm((prev) => ({ ...prev, [category]: false }));
                    // 必要なら videoTags にも追加（自動で選択状態にしたい場合）
                    setVideoTags((prev) => [...prev, { tag: newTag }]);
                    setSelected((prev) => new Set(prev).add(newTag.id));
                  }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function TagCreateForm({ category, onCreated }) {
  const [name, setName] = useState("");

  const submit = async () => {
    const res = await fetch("/api/tag-create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, category }),
    });

    const data = await res.json();
    if (data.success) {
      onCreated(data.tag); // ← 新しいタグを親に渡す
      setName("");
    }
  };

  return (
    <div className={styles.tagEditor__form}>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="新しいタグ名"
      />
      <button onClick={submit}>追加</button>
    </div>
  );
}
