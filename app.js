import {
  db,
  manualCollection,
  manualQuery,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from "./firebase.js";

const quill = new Quill("#editor", {
  theme: "snow",
  modules: {
    toolbar: {
      container: [
        [{ header: [1, 2, 3, false] }],
        ["bold", "italic", "underline"],
        [{ background: [] }, { color: [] }],
        [{ list: "bullet" }, { list: "ordered" }],
        [{ indent: "-1" }, { indent: "+1" }],
        ["circledNumber", "clean"]
      ],
      handlers: {
        circledNumber: insertCircledNumber
      }
    }
  }
});

const CIRCLED_NUMBERS = [
  "①", "②", "③", "④", "⑤",
  "⑥", "⑦", "⑧", "⑨", "⑩",
  "⑪", "⑫", "⑬", "⑭", "⑮",
  "⑯", "⑰", "⑱", "⑲", "⑳"
];

const circledNumberButton = document.querySelector(".ql-circledNumber");
if (circledNumberButton) {
  circledNumberButton.setAttribute("type", "button");
  circledNumberButton.setAttribute("title", "원형 번호");
  circledNumberButton.setAttribute("aria-label", "원형 번호");
  circledNumberButton.textContent = "①";
}

let manuals = [];
let selectedId = null;
let mode = "view";

const loginScreen = document.getElementById("loginScreen");
const mainApp = document.getElementById("mainApp");
const passwordInput = document.getElementById("passwordInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");

const searchInput = document.getElementById("searchInput");
const manualList = document.getElementById("manualList");

const viewerArea = document.getElementById("viewerArea");
const editorArea = document.getElementById("editorArea");

const viewTitle = document.getElementById("viewTitle");
const viewTags = document.getElementById("viewTags");
const viewContent = document.getElementById("viewContent");

const titleInput = document.getElementById("titleInput");
const tagsInput = document.getElementById("tagsInput");

const newManualBtn = document.getElementById("newManualBtn");
const editBtn = document.getElementById("editBtn");
const saveBtn = document.getElementById("saveBtn");
const deleteBtn = document.getElementById("deleteBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const adminBtn = document.getElementById("adminBtn");
const adminModal = document.getElementById("adminModal");
const adminPasswordInput = document.getElementById("adminPasswordInput");
const newPasswordInput = document.getElementById("newPasswordInput");
const changePasswordBtn = document.getElementById("changePasswordBtn");
const closeAdminBtn = document.getElementById("closeAdminBtn");

const settingsRef = doc(db, "settings", "access");

async function getSettings() {
  const snap = await getDoc(settingsRef);

  if (!snap.exists()) {
    await setDoc(settingsRef, {
      accessPassword: "1234",
      adminPassword: "admin1234",
      updatedAt: serverTimestamp()
    });

    return {
      accessPassword: "1234",
      adminPassword: "admin1234"
    };
  }

  return snap.data();
}

async function login() {
  const inputPassword = passwordInput.value.trim();
  const settings = await getSettings();

  if (inputPassword === settings.accessPassword) {
    loginScreen.classList.add("hidden");
    mainApp.classList.remove("hidden");
    loginError.textContent = "";
  } else {
    loginError.textContent = "비밀번호가 틀렸습니다.";
  }
}

function stripHtml(html) {
  const div = document.createElement("div");
  div.innerHTML = html || "";
  return div.textContent || div.innerText || "";
}

function updateCircledNumbers(container) {
  let listIndex = 0;
  let circledIndex = 0;
  const orderedItems = container.querySelectorAll("ol li");

  orderedItems.forEach(item => {
    if (item.classList.contains("ql-indent-1")) {
      item.dataset.circledNumber = CIRCLED_NUMBERS[circledIndex % CIRCLED_NUMBERS.length];
      circledIndex += 1;
    } else {
      listIndex += 1;
      circledIndex = 0;
      item.dataset.listNumber = `${listIndex}.`;
      item.removeAttribute("data-circled-number");
    }
  });
}

function insertCircledNumber() {
  quill.focus();

  const range = quill.getSelection(true);
  const [line, offset] = quill.getLine(range.index);
  const lineText = line.domNode.textContent || "";
  let targetIndex = range.index;

  if (lineText.trim() && offset > 0) {
    quill.insertText(range.index, "\n", "user");
    targetIndex = range.index + 1;
  } else if (offset > 0) {
    targetIndex = range.index - offset;
  }

  quill.formatLine(targetIndex, 1, "list", "ordered", "user");
  quill.formatLine(targetIndex, 1, "indent", 1, "user");
  quill.setSelection(targetIndex, 0, "user");
  updateCircledNumbers(quill.root);
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

    card.addEventListener("click", () => openViewer(m.id));
    manualList.appendChild(card);
  });
}

function openViewer(id) {
  const manual = manuals.find(m => m.id === id);
  if (!manual) return;

  selectedId = id;
  mode = "view";

  viewerArea.classList.remove("hidden");
  editorArea.classList.add("hidden");

  viewTitle.textContent = manual.title || "제목 없음";
  viewTags.textContent = manual.tags ? `🏷 ${manual.tags}` : "";
  viewContent.innerHTML = manual.content || "내용 없음";
  updateCircledNumbers(viewContent);

  editBtn.classList.remove("hidden");

  renderManuals();
}

function openEditorForNew() {
  selectedId = null;
  mode = "edit";

  viewerArea.classList.add("hidden");
  editorArea.classList.remove("hidden");

  titleInput.value = "";
  tagsInput.value = "";
  quill.root.innerHTML = "";

  renderManuals();
}

function openEditorForSelected() {
  if (!selectedId) {
    alert("수정할 매뉴얼을 먼저 선택하세요.");
    return;
  }

  const manual = manuals.find(m => m.id === selectedId);
  if (!manual) return;

  mode = "edit";

  viewerArea.classList.add("hidden");
  editorArea.classList.remove("hidden");

  titleInput.value = manual.title || "";
  tagsInput.value = manual.tags || "";
  quill.root.innerHTML = manual.content || "";
  updateCircledNumbers(quill.root);
}

function cancelEdit() {
  if (selectedId) {
    openViewer(selectedId);
  } else {
    viewerArea.classList.remove("hidden");
    editorArea.classList.add("hidden");
  }
}

async function saveManual() {
  const title = titleInput.value.trim();
  const tags = tagsInput.value.trim();
  updateCircledNumbers(quill.root);
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
      openViewer(selectedId);
    } else {
      const newDoc = await addDoc(manualCollection, {
        ...data,
        createdAt: serverTimestamp()
      });
      alert("저장 완료");
      selectedId = newDoc.id;
      openViewer(selectedId);
    }
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

    selectedId = null;
    viewerArea.classList.remove("hidden");
    editorArea.classList.add("hidden");

    viewTitle.textContent = "매뉴얼을 선택하세요";
    viewTags.textContent = "";
    viewContent.textContent = "왼쪽 목록에서 매뉴얼을 선택하면 내용이 표시됩니다.";
    editBtn.classList.add("hidden");

    alert("삭제 완료");
  } catch (error) {
    console.error(error);
    alert("삭제 중 오류가 발생했습니다.");
  }
}

async function changePassword() {
  const adminPassword = adminPasswordInput.value.trim();
  const newPassword = newPasswordInput.value.trim();

  if (!adminPassword || !newPassword) {
    alert("관리자 비밀번호와 새 입장 비밀번호를 모두 입력하세요.");
    return;
  }

  const settings = await getSettings();

  if (adminPassword !== settings.adminPassword) {
    alert("관리자 비밀번호가 틀렸습니다.");
    return;
  }

  await setDoc(settingsRef, {
    ...settings,
    accessPassword: newPassword,
    updatedAt: serverTimestamp()
  });

  alert("입장 비밀번호가 변경되었습니다.");

  adminPasswordInput.value = "";
  newPasswordInput.value = "";
  adminModal.classList.add("hidden");
}

onSnapshot(manualQuery, snapshot => {
  manuals = snapshot.docs.map(docSnap => ({
    id: docSnap.id,
    ...docSnap.data()
  }));

  renderManuals();

  if (selectedId && mode === "view") {
    const exists = manuals.find(m => m.id === selectedId);
    if (exists) openViewer(selectedId);
  }
});

quill.on("text-change", () => {
  updateCircledNumbers(quill.root);
});

loginBtn.addEventListener("click", login);

passwordInput.addEventListener("keydown", e => {
  if (e.key === "Enter") login();
});

searchInput.addEventListener("input", renderManuals);

newManualBtn.addEventListener("click", openEditorForNew);
editBtn.addEventListener("click", openEditorForSelected);
saveBtn.addEventListener("click", saveManual);
deleteBtn.addEventListener("click", removeManual);
cancelEditBtn.addEventListener("click", cancelEdit);

adminBtn.addEventListener("click", () => {
  adminModal.classList.remove("hidden");
});

closeAdminBtn.addEventListener("click", () => {
  adminModal.classList.add("hidden");
});

changePasswordBtn.addEventListener("click", changePassword);
