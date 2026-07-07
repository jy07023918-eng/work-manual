let manuals = JSON.parse(localStorage.getItem("manuals")) || [
  {
    title: "퀵 발송 매뉴얼",
    tags: ["퀵", "퀵발송", "발송", "서류", "우편물발송", "ERP"],
    content: `1. ERP 등록

- ERP 접속 (한국자산신탁 그룹웨어 우측 상단)
- 우편물발송 → 신규 선택
- 발송 유형을 '등기' → '퀵'으로 변경
- 수신지 검색 후 등록
  예) 안양동
  '동'까지 정확히 입력해야 검색됨.
  주소에 '동'이 안 적혀있으면 네이버에서 확인한 후 입력.
- 수신기관 입력
- 제목 입력(발송 서류명 작성)
  예) 법인인감증명서
  ※ 서류 상단에 기재된 명칭 그대로 입력
- 사업명 입력
  해당 사업명 또는 사업코드 입력

2. 퀵 접수

퀵 업체 연락처 : 562-6999로 전화

"안녕하세요. 한국자산신탁 ○○○입니다. ○○시 ○○구 ○○동 ○○(건물명/기관명)으로 서류 한 부 퀵 접수 부탁드립니다."

※ 서류인지 다른 것인지 말씀드려야 함.

3. 서류 전달

- 서류를 1층 데스크에 맡기고 퀵 발송 종이 작성한다.`
  }
];

let editIndex = null;

const searchInput = document.getElementById("searchInput");
const titleInput = document.getElementById("titleInput");
const tagsInput = document.getElementById("tagsInput");
const contentInput = document.getElementById("contentInput");
const manualList = document.getElementById("manualList");

function saveToStorage() {
  localStorage.setItem("manuals", JSON.stringify(manuals));
}

function saveManual() {
  const title = titleInput.value.trim();
  const tags = tagsInput.value.split(",").map(t => t.trim()).filter(t => t);
  const content = contentInput.value.trim();

  if (!title || !content) {
    alert("제목과 내용을 입력해야 함.");
    return;
  }

  const manual = { title, tags, content };

  if (editIndex === null) {
    manuals.push(manual);
  } else {
    manuals[editIndex] = manual;
    editIndex = null;
  }

  saveToStorage();
  resetForm();
  showManuals();
}

function editManual(index) {
  const m = manuals[index];

  titleInput.value = m.title;
  tagsInput.value = m.tags.join(", ");
  contentInput.value = m.content;

  editIndex = index;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteManual(index) {
  if (!confirm("진짜 삭제할 거야?")) return;

  manuals.splice(index, 1);
  saveToStorage();
  showManuals();
}

function resetForm() {
  titleInput.value = "";
  tagsInput.value = "";
  contentInput.value = "";
  editIndex = null;
}

function showManuals() {
  const keyword = searchInput.value.toLowerCase().trim();

  const result = manuals
    .map((m, index) => ({ ...m, index }))
    .filter(m =>
      m.title.toLowerCase().includes(keyword) ||
      m.tags.join(" ").toLowerCase().includes(keyword) ||
      m.content.toLowerCase().includes(keyword)
    );

  manualList.innerHTML = "";

  result.forEach(m => {
    manualList.innerHTML += `
      <div class="card">
        <h2>${m.title}</h2>
        <div class="tag">🏷 ${m.tags.join(", ")}</div>
        <pre>${m.content}</pre>
        <button onclick="editManual(${m.index})">수정</button>
        <button onclick="deleteManual(${m.index})">삭제</button>
      </div>
    `;
  });
}

searchInput.addEventListener("input", showManuals);

showManuals();
