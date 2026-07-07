import {
  manualCollection,
  manualQuery,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";

const quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    toolbar: [
      [{ header: [1, 2, 3, false] }],
      ["bold", "italic", "underline"],
      [{ background: [] }, { color: [] }],
      [{ list: "bullet" }, { list: "ordered" }],
      ["clean"]
    ]
  }
});

let manuals = [];
let selectedId = null;

const searchInput = document.getElementById("searchInput");
const manualList = document.getElementById("manualList");
const titleInput = document.getElementById("titleInput");
const tagsInput = document.getElementById("tagsInput");

const newManualBtn = document.getElementById("newManualBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const clearBtn = document.getElementById("clearBtn");

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

function renderManuals() {
  const keyword = searchInput.value.toLowerCase().trim();

  const filtered = manuals.filter(m => {
    const title = (m.title || "").toLowerCase();
    const tags = (m.tags || "").toLowerCase();
    const content = stripHtml(m.content || "").toLowerCase();

    return (
      title.includes(keyword) ||
      tags.includes(keyword) ||
      content.includes(keyword)
    );
  });

  manualList.innerHTML = "";

  if (filtered.length === 0) {
    manualList.innerHTML = `<p class="empty">검색 결과가 없습니다.</p>`;
    return;
  }

  filtered.forEach(m => {
    const card = document.createElement("div");
    card.className = "manual-card";
    if (m.id === selectedId) card.classList.add("active");

    card.innerHTML = `
      <h3>${m.title || "제목 없음"}</h3>
      <p>🏷 ${m.tags || "키워드 없음"}</p>
    `;

    card.addEventListener("click", () => selectManual(m.id));
    manualList.appendChild(card);
  });
}

function selectManual(id) {
  const manual = manuals.find(m => m.id === id);
  if (!manual) return;

  selectedId = id;
  titleInput.value = manual.title || "";
  tagsInput.value = manual.tags || "";
  quill.root.innerHTML = manual.content || "";

  renderManuals();
}

function clearEditor() {
  selectedId = null;
  titleInput.value = "";
  tagsInput.value = "";
  quill.root.innerHTML = "";
  renderManuals();
}

async function saveManual() {
  const title = titleInput.value.trim();
  const tags = tagsInput.value.trim();
  const content = quill.root.innerHTML.trim();
  const plainText = quill.getText().trim();

  if (!title || !plainText) {
    alert("제목과 내용을 입력해야 합니다.");
    return;
  }

  const data = {
    title,
    tags,
    content,
    updatedAt: serverTimestamp()
  };

  try {
    if (selectedId) {
      const ref = doc(manualCollection, selectedId);
      await updateDoc(ref, data);
      alert("수정 완료");
    } else {
      await addDoc(manualCollection, {
        ...data,
        createdAt: serverTimestamp()
      });
      alert("저장 완료");
    }

    clearEditor();
  } catch (error) {
    console.error(error);
    alert("저장 중 오류가 발생했습니다.");
  }
}

async function removeManual() {
  if (!selectedId) {
    alert("삭제할 매뉴얼을 먼저 선택하세요.");
    return;
  }

  if (!confirm("정말 삭제할까요?")) return;

  try {
    const ref = doc(manualCollection, selectedId);
    await deleteDoc(ref);
    alert("삭제 완료");
    clearEditor();
  } catch (error) {
    console.error(error);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

onSnapshot(manualQuery, snapshot => {
  manuals = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  renderManuals();
});

searchInput.addEventListener("input", renderManuals);
newManualBtn.addEventListener("click", clearEditor);
saveBtn.addEventListener("click", saveManual);
deleteBtn.addEventListener("click", removeManual);
clearBtn.addEventListener("click", clearEditor);
